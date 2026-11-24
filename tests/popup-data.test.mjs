import assert from 'node:assert/strict';
import { test } from 'node:test';

const { loadPopupData } = await import('@/main/popup/initial-data-loader');
const systemSettings = { theme: 'test' };

test('a popup without a loader receives exactly what the caller passed', async () => {
  const data = { message: 'message:hello', parameter: { name: 'Alice' } };
  assert.deepEqual(await loadPopupData('dialogInfo', data, systemSettings), data);
});

test('loaded data is merged with the request and the system settings', async () => {
  const request = { userId: 'user-1', serverId: 'server-1' };
  assert.deepEqual(await loadPopupData('createChannel', request, systemSettings), { parent: null, ...request, systemSettings });
});
