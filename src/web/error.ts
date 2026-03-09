import { createPopup } from '@/web/main';

import Logger from '@/logger';
import { getEnv } from '@/env';

export function errorSubmit(errorId: string, error: Error) {
  fetch(getEnv().ERROR_SUBMISSION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: null,
      embeds: [
        {
          title: 'Error Submission',
          color: 14286900,
          fields: [
            { name: 'Error Message', value: JSON.stringify(error.message) || 'Unknown', inline: true },
            { name: 'Error Cause', value: JSON.stringify(error.cause) || 'Unknown', inline: true },
            { name: 'Error Detail', value: JSON.stringify(error.stack) || 'Unknown' },
          ],
          footer: {
            text: `Error ID: ${errorId}`,
          },
          timestamp: new Date().toISOString(),
        },
      ],
      attachments: [],
    }),
  })
    .then((response) => {
      if (response.ok) {
        new Logger('Error').error(`(${errorId}), Error submitted: ${error.message}`);
      } else {
        new Logger('Error').error(`(${errorId}), Failed to submit error: ${response.statusText}`);
      }
    })
    .catch((e) => {
      const error = e instanceof Error ? e : new Error('Unknown error');
      new Logger('Error').error(`(${errorId}), Failed to submit error: ${error.message}`);
    });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function webRTCSignalStateChange(formData: { signalState: string; userId: string; channelId: string; info?: any }) {
  return new Promise((resolve) => {
    if (formData.signalState === 'disconnected') {
      createPopup('rtcDisconnect', `rtcDisconnect-${Date.now()}`, formData);
    }

    const fields = [
      { name: 'user-id', value: formData.userId },
      { name: 'channel-id', value: formData.channelId },
      { name: 'webrtc-signal', value: formData.signalState },
    ];

    if (formData.info) {
      fields.push({
        name: 'webrtc-info',
        value: JSON.stringify(formData.info, null, 2).substring(0, 1024),
      });
    }

    fetch(getEnv().ERROR_SUBMISSION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: null,
        embeds: [
          {
            color: 0xffd089,
            timestamp: new Date().toISOString(),
            fields: fields,
          },
        ],
      }),
    })
      .then((response) => {
        if (response.ok) {
          new Logger('System').info(`WebRTC signal log sent to Discord: ${formData.userId}, ${formData.channelId}, ${formData.signalState}`);
        } else {
          new Logger('System').error(`Failed to send WebRTC signal log to Discord: ${response.statusText}`);
        }
      })
      .catch((error) => {
        new Logger('System').error(`Failed to send WebRTC signal log to Discord: ${error.message}`);
      });

    resolve(true);
  });
}
