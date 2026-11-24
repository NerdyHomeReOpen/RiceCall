import Logger from '@/utils/logger';
import { isMain, isRenderer, isWebsite } from '@/utils/platform';

export interface I18nStorageType {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  keys(): string[];
}

class LocalStorageAdapter implements I18nStorageType {
  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  keys(): string[] {
    const result: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) result.push(k);
    }

    return result;
  }
}

class FsAdapter implements I18nStorageType {
  constructor(
    private dir: string,
    private fs: typeof import('fs'),
    private path: typeof import('path'),
  ) {}

  private filePath(key: string): string {
    return this.path.join(this.dir, encodeURIComponent(key) + '.dat');
  }

  getItem(key: string): string | null {
    try {
      return this.fs.readFileSync(this.filePath(key), 'utf-8');
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      this.fs.writeFileSync(this.filePath(key), value, 'utf-8');
    } catch (e) {
      new Logger('I18N_STORAGE').warn(`fs write failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  removeItem(key: string): void {
    try {
      this.fs.unlinkSync(this.filePath(key));
    } catch {}
  }

  keys(): string[] {
    try {
      return (this.fs.readdirSync(this.dir) as string[]).filter((f: string) => f.endsWith('.dat')).map((f: string) => decodeURIComponent(f.slice(0, -4)));
    } catch {
      return [];
    }
  }
}

/* eslint-disable @typescript-eslint/no-unused-vars */
class NoopStorage implements I18nStorageType {
  getItem(_key: string): string | null {
    return null;
  }

  setItem(_key: string, _value: string): void {}
  removeItem(_key: string): void {}

  keys(): string[] {
    return [];
  }
}

let storage: I18nStorageType | null = null;

export async function loadStorage(): Promise<void> {
  if (isMain()) {
    const createRequire = await import(/* webpackIgnore: true */ 'module').then((module) => module.createRequire).then((cr) => cr(import.meta.url));
    const electron = createRequire('electron');
    const path = createRequire('path');
    const fs = createRequire('fs');
    const app = electron.app;
    const cacheDir = path.join(app.getPath('userData'), 'i18n-cache') as string;
    fs.mkdirSync(cacheDir, { recursive: true });
    storage = new FsAdapter(cacheDir, fs, path);
  } else if (isRenderer() || isWebsite()) {
    storage = new LocalStorageAdapter();
  } else {
    storage = new NoopStorage();
  }
}

export default class I18nStorage {
  static async load(): Promise<void> {
    loadStorage();
  }

  static get(): I18nStorageType {
    if (!storage) {
      new Logger('I18N_STORAGE').error('storage not initialized');
      return new NoopStorage();
    }

    return storage;
  }
}
