export type RGB = { r: number; g: number; b: number };

function norm(v: number): number {
  return Math.min(255, Math.max(0, v)) / 255;
}

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function luminance(rLin: number, gLin: number, bLin: number): number {
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

export function contrastWithWhite({ r, g, b }: RGB): number {
  const R = srgbToLinear(norm(r));
  const G = srgbToLinear(norm(g));
  const B = srgbToLinear(norm(b));
  const L = luminance(R, G, B);
  return 1.05 / (L + 0.05);
}

export function isTooWhite(rgb: RGB, minContrast = 3): boolean {
  return contrastWithWhite(rgb) < minContrast;
}

export function getVisibleColor({ r, g, b }: RGB, minContrast = 3): RGB {
  const R = srgbToLinear(norm(r));
  const G = srgbToLinear(norm(g));
  const B = srgbToLinear(norm(b));
  const L = luminance(R, G, B);
  const Lmax = 1.05 / minContrast - 0.05;
  if (L <= Lmax) return { r, g, b };
  const scale = Lmax / L;
  const R2 = Math.max(0, Math.min(1, R * scale));
  const G2 = Math.max(0, Math.min(1, G * scale));
  const B2 = Math.max(0, Math.min(1, B * scale));
  const to8bit = (x: number) => Math.round(Math.max(0, Math.min(1, linearToSrgb(x))) * 255);
  const out: RGB = { r: to8bit(R2), g: to8bit(G2), b: to8bit(B2) };
  return out;
}

export function getContrastColor({ r, g, b }: RGB): RGB {
  return isTooWhite({ r, g, b }) ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 };
}

export function getDominantColor(url: string): Promise<RGB> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No canvas context');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const colorCount: Record<string, number> = {};

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const key = `${r},${g},${b}`;
        colorCount[key] = (colorCount[key] || 0) + 1;
      }

      const dominant = Object.entries(colorCount).sort((a, b) => b[1] - a[1])[0][0];
      const [r, g, b] = dominant.split(',').map(Number);
      resolve({ r, g, b });
    };

    img.onerror = reject;
  });
}

export function toRGBString({ r, g, b }: RGB): string {
  return `rgb(${r}, ${g}, ${b})`;
}

export function getLerpColor(color1: string, color2: string, t: number): string {
  const c1 = parseInt(color1.slice(1), 16);
  const c2 = parseInt(color2.slice(1), 16);
  const r1 = (c1 >> 16) & 0xff;
  const g1 = (c1 >> 8) & 0xff;
  const b1 = c1 & 0xff;
  const r2 = (c2 >> 16) & 0xff;
  const g2 = (c2 >> 8) & 0xff;
  const b2 = c2 & 0xff;
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
