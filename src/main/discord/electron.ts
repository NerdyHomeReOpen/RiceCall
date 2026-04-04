import { ipcMain } from 'electron';
import DiscordRPC, { Presence } from 'discord-rpc';

import Logger from '@/logger';

const DISCORD_RPC_CLIENT_ID = '1242441392341516288';
const START_TIMESTAMP = Date.now();

let rpc: DiscordRPC.Client | null = null;

export async function configureDiscordRPC() {
  DiscordRPC.register(DISCORD_RPC_CLIENT_ID);
  rpc = new DiscordRPC.Client({ transport: 'ipc' });
  rpc = await rpc.login({ clientId: DISCORD_RPC_CLIENT_ID }).catch((e) => {
    const error = e instanceof Error ? e : new Error('Unknown error');
    new Logger('DiscordRPC').error(`Cannot login to discord rpc: ${error.message}`);
    return null;
  });

  ipcMain.on('update-discord-presence', (_, presence: Presence) => {
    presence.startTimestamp = START_TIMESTAMP;
    updateDiscordPresence(presence);
  });
}

export function updateDiscordPresence(presence: Presence) {
  if (!rpc) return;
  rpc.setActivity(presence);
}

export function clearDiscordPresence() {
  if (!rpc) return;
  rpc.clearActivity();
}
