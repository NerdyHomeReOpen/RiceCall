# WebRTC Provider Refactor + Reconnection Fix

**Date:** 2026-05-11  
**Branch:** dev

## Problem

`src/providers/WebRTC.tsx` is 1133 lines managing 6 distinct domains in a single file. Additionally, WebRTC transport failures on network disconnect do not trigger reconnection — only a state signal is sent.

## Goals

1. Split the provider into focused domain hooks under `src/hooks/WebRTC/`
2. Keep the provider entry point at `src/providers/WebRTC.tsx` (no import changes for consumers)
3. Add automatic transport reconnection on `failed`/`disconnected`

---

## File Structure

```
src/providers/WebRTC.tsx         (unchanged path — thin orchestrator, ~100 lines)

src/hooks/WebRTC/
├── useSharedRefs.ts             (all ~25 refs, no logic)
├── useAudioContext.ts
├── useMicAudio.ts
├── useSpeakerAudio.ts
├── useMixAudio.ts
├── useRecording.ts
└── useSFUTransport.ts
```

---

## Hook Responsibilities

### `useSharedRefs`
Declares and returns all shared refs. No logic. Type exported as `SharedRefs`.

Refs managed:
- `audioContextRef`, `speakerRef`, `rafIdListRef`, `audioProducerRef`
- `micNodesRef`, `mixNodesRef`, `speakerNodesRef`
- `masterGainNodeRef`, `inputAnalyserRef`, `inputDesRef`, `outputDesRef`
- `recorderDesRef`, `recorderGainRef`
- `bitrateRef`, `deviceRef`, `sendTransportRef`, `recvTransportRef`, `consumersRef`
- `microphoneAmplificationRef`, `inputAudioDeviceRef`, `echoCancellationRef`, `noiseCancellationRef`
- `recordBuffersRef`, `recordTimerRef`

### `useAudioContext(refs)`
**Returns:** `initAudioContext`  
**Responsibilities:**
- Create AudioContext, resume if suspended
- Build all shared audio nodes: masterGain, inputAnalyser, inputDes, outputDes, recorderDes
- Load AudioWorklet module
- Create and attach speaker Audio element to document body
- Effect: add `click`/`keydown` listeners (once) to resume suspended AudioContext

### `useMicAudio(refs, { initAudioContext })`
**Returns:** `initMicAudio`, `removeMicAudio`, `startSpeaking`, `stopSpeaking`, `pressSpeakKey`, `releaseSpeakKey`, `changeMicVolume`, `toggleMicMuted`  
**Responsibilities:**
- Build/teardown mic source → gain → inputDes + inputAnalyser node chain
- Run `detectSpeaking` RAF loop for `'user'` target (internal, not exported)
- `startSpeaking`: call `getUserMedia`, then `initMicAudio`
- `pressSpeakKey` / `releaseSpeakKey`: enable/disable mic tracks, dispatch speak state
- `changeMicVolume`: clamp, update gain node, persist to localStorage
- `toggleMicMuted`: save/restore previous volume
- Effects: subscribe to `inputAudioDevice`, `echoCancellation`, `noiseCancellation`, `microphoneAmplification`, `speakingMode` settings via `ipc.systemSettings`

### `useSpeakerAudio(refs, { initAudioContext })`
**Returns:** `initSpeakerAudio`, `removeSpeakerAudio`, `changeSpeakerVolume`, `addSpeakerVolume`, `subtractSpeakerVolume`, `toggleSpeakerMuted`  
**Responsibilities:**
- Build/teardown per-user source → gain → masterGain node chain
- Run `detectSpeaking` RAF loop for remote user targets (internal, not exported)
- `changeSpeakerVolume`: clamp, update masterGainNode, persist to localStorage
- Effect: subscribe to `outputAudioDevice` setting via `ipc.systemSettings`, call `setSinkId`

### `useMixAudio(refs, { initAudioContext })`
**Returns:** `initMixAudio`, `removeMixAudio`, `startMixing`, `stopMixing`, `toggleMixMode`, `changeMixVolume`  
**Responsibilities:**
- Capture system audio via `getDisplayMedia`, strip video tracks
- Build/teardown system source → gain → inputDes node chain
- Connect to `recorderGainRef` when recording is active
- `startMixing`: call `ipc.loopbackAudio.enable()`, then `getDisplayMedia`
- `stopMixing`: call `ipc.loopbackAudio.disable()`, then `removeMixAudio`

### `useRecording(refs, { initAudioContext })`
**Returns:** `startRecording`, `stopRecording`, `toggleRecording`  
**Responsibilities:**
- Create `recorderGain` node, connect mic + mix + masterGain into it
- Run `AudioWorkletNode('recorder-processor')` to buffer PCM frames
- On stop: call `encodeAudio` + `ipc.record.save`
- Manage `recordTimerRef` interval for elapsed time dispatch

### `useSFUTransport(refs, { initSpeakerAudio, removeSpeakerAudio, startSpeaking })`
**Returns:** `setupSend`, `setupRecv`, `closeSend`, `closeRecv`, `consumeOne`, `unconsumeOne`, `takeMic`, `releaseMic`, `muteUser`, `unmuteUser`, `changeBitrate`  
**Responsibilities:**
- Create/close send and recv mediasoup transports
- Handle `produce` and `connect` transport events
- Consume/unconsume SFU producers, call `initSpeakerAudio`/`removeSpeakerAudio`
- Effects: subscribe to `SFUJoined`, `SFULeft`, `SFUNewProducer`, `SFUProducerClosed` socket events
- **Reconnection logic** (see below)
- Status polling interval (500ms) for latency + connection state dispatch

---

## Reconnection Logic

### Root cause
`sendTransportRef` `connectionstatechange` handler fires `ipc.webrtc.signalStateChange` on `failed`/`disconnected` but does not retry. `recvTransportRef` handler only logs — no action on failure.

### Fix
Add two new refs inside `useSFUTransport`:
- `currentChannelIdRef: MutableRefObject<string | null>` — set in `setupSend`/`setupRecv`, cleared in `releaseMic`/`closeRecv`
- `sendRetryCountRef: MutableRefObject<number>` and `recvRetryCountRef: MutableRefObject<number>`

**Send transport:**
```ts
sendTransportRef.current.on('connectionstatechange', async (s) => {
  if (s === 'connected') {
    sendRetryCountRef.current = 0;
  }
  if (s === 'failed' || s === 'disconnected') {
    ipc.webrtc.signalStateChange({ ... });
    const channelId = currentChannelIdRef.current;
    if (channelId && sendRetryCountRef.current < 3) {
      sendRetryCountRef.current++;
      setTimeout(() => setupSend(channelId), 2000 * sendRetryCountRef.current);
    }
  }
});
```

**Recv transport:** Same pattern added to `recvTransportRef` `connectionstatechange` (currently missing any failure handling).

**Guard:** `releaseMic` and `closeRecv` set `currentChannelIdRef.current = null` before closing transport, preventing retry after intentional leave.

---

## `providers/WebRTC.tsx` After Refactor

```ts
const refs = useSharedRefs();
const { initAudioContext } = useAudioContext(refs);
const { startSpeaking, stopSpeaking, ..., changeMicVolume, toggleMicMuted } = useMicAudio(refs, { initAudioContext });
const { initSpeakerAudio, removeSpeakerAudio, ..., changeSpeakerVolume } = useSpeakerAudio(refs, { initAudioContext });
const { startMixing, ..., changeMixVolume } = useMixAudio(refs, { initAudioContext });
const { startRecording, ... } = useRecording(refs, { initAudioContext });
const { takeMic, releaseMic, ..., changeBitrate } = useSFUTransport(refs, { initSpeakerAudio, removeSpeakerAudio, startSpeaking });

// assemble contextValue, initialize localStorage
```

---

## Out of Scope

- Backend reconnection handling
- Video support in mix mode (existing TODO)
- Unit tests for extracted hooks
