import { isMain, isRenderer, isWebsite } from '@/utils/platform';

export interface I18nStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  keys(): string[];
}

class LocalStorageAdapter implements I18nStorage {
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

class FsAdapter implements I18nStorage {
  constructor(
    private dir: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private fs: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private path: any,
  ) { }

  private filePath(key: string): string {
    return this.path.join(this.dir, encodeURIComponent(key) + '.dat') as string;
  }

  getItem(key: string): string | null {
    try {
      return this.fs.readFileSync(this.filePath(key), 'utf-8') as string;
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      this.fs.writeFileSync(this.filePath(key), value, 'utf-8');
    } catch (e) {
      console.warn('[i18n] fs write failed:', e);
    }
  }

  removeItem(key: string): void {
    try {
      this.fs.unlinkSync(this.filePath(key));
    } catch {
      // ignore if file does not exist
    }
  }

  keys(): string[] {
    try {
      return (this.fs.readdirSync(this.dir) as string[])
        .filter((f: string) => f.endsWith('.dat'))
        .map((f: string) => decodeURIComponent(f.slice(0, -4)));
    } catch {
      return [];
    }
  }
}

/* eslint-disable @typescript-eslint/no-unused-vars */
class NoopStorage implements I18nStorage {
  getItem(_key: string): string | null { return null; }
  setItem(_key: string, _value: string): void { }
  removeItem(_key: string): void { }
  keys(): string[] { return []; }
}

let storage: I18nStorage | null = null;

export async function loadStorage(): Promise<void> {
  if (isMain()) {
    const createRequire = await import(/* webpackIgnore: true */ 'module')
      .then((module) => module.createRequire)
      .then((cr) => cr(import.meta.url));
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

export function getStorage(): I18nStorage {
  if (!storage) throw new Error('[i18n] storage not initialized');
  return storage;
}
