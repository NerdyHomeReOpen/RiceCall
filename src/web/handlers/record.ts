import Logger from '@/logger';

export function saveRecord(record: ArrayBuffer) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([record]));
    a.download = `recording-${timestamp}.wav`;
    a.click();
  } catch (e) {
    const error = e instanceof Error ? e : new Error('Unknown error');
    new Logger('System').error(`Save audio error: ${error.message}`);
  }
}

export function selectRecordSavePath() {
  new Logger('System').info(`Select record save path only available in desktop version`);
  return null;
}
