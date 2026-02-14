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
