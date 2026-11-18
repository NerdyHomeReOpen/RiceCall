import Logger from '@/utils/logger';

export function saveRecord(record: ArrayBuffer): void {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([record]));
    a.download = `recording-${timestamp}.wav`;
    a.click();
  } catch (e) {
    const error = e instanceof Error ? e : new Error('Unknown error');
    new Logger('SYSTEM').error(`Save audio error: ${error.message}`);
  }
}

export async function selectRecordSavePath(): Promise<null> {
  new Logger('SYSTEM').info(`Select record save path only available in desktop version`);
  return null;
}
