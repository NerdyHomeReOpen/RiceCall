import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
const binaryPath = ffmpegPath ? (app.isPackaged ? ffmpegPath.replace('app.asar', 'app.asar.unpacked') : ffmpegPath) : '';
ffmpeg.setFfmpegPath(binaryPath);
import { app, ipcMain, dialog } from 'electron';

import { createPopup, store } from '@/electron/main';

import { t } from '@/i18n';
import Logger from '@/logger';

function convertWavToMp3AndSave(inputWav: ArrayBuffer, outputMp3: string) {
  const buffer = Buffer.from(inputWav);
  const inputStream = Readable.from(buffer);

  ffmpeg(inputStream)
    .audioCodec('libmp3lame')
    .audioBitrate('320k')
    .save(outputMp3)
    .on('error', () => {
      createPopup('dialogError', 'dialogError', { error: new Error('convert-wav-to-mp3-failed') }, true);
    });
}

export function registerRecordHandlers() {
  ipcMain.on('save-record', (_, record: ArrayBuffer) => {
    try {
      const outputDir = store.get('recordSavePath');

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const format = store.get('recordFormat') === 'mp3' ? 'mp3' : 'wav';

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `recording-${timestamp}.${format}`;
      const outputPath = path.join(outputDir, fileName);

      if (format === 'mp3') {
        convertWavToMp3AndSave(record, outputPath);
      } else {
        const buffer = Buffer.from(record);
        fs.writeFileSync(outputPath, buffer);
      }
    } catch (e) {
      const error = e instanceof Error ? e : new Error('Unknown error');
      new Logger('System').error(`Save audio error: ${error.message}`);
    }
  });

  ipcMain.handle('select-record-save-path', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: t('select-record-save-path'),
      defaultPath: store.get('recordSavePath'),
      properties: ['openDirectory'],
    });
    if (canceled) return null;
    return filePaths[0];
  });
}
