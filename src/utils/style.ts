export type StyleDict = Record<string, string>;

export const styleObjToString = (obj: StyleDict): string =>
  Object.entries(obj)
    .map(([k, v]) => `${k}:${v}`)
    .join(';');

export const styleStringToObj = (raw = ''): StyleDict =>
  raw
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .reduce<StyleDict>((acc, kv) => {
      const [k, v] = kv.split(':').map((s) => s.trim());
      if (k && v) acc[k] = v;
      return acc;
    }, {});
