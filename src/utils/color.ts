export type RGB = { r: number; g: number; b: number };

/** sRGB 0..255 -> 0..1 (before linearization) */
const norm = (v: number) => Math.min(255, Math.max(0, v)) / 255;
/** sRGB -> Linear RGB */
const srgbToLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
/** Linear RGB -> sRGB */
const linearToSrgb = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
/** Linear RGB luminance (WCAG) */
const luminance = (rLin: number, gLin: number, bLin: number) => 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;

/**
 * Contrast with white (white is always the brighter side)
 * @param rgb - color
 * @returns contrast
 */
export function contrastWithWhite({ r, g, b }: RGB): number {
  // Convert to linear space
  const R = srgbToLinear(norm(r));
  const G = srgbToLinear(norm(g));
  const B = srgbToLinear(norm(b));
  const L = luminance(R, G, B);
  // Contrast (L1+0.05)/(L2+0.05), white is 1
  return 1.05 / (L + 0.05);
}

/** Whether the color is too white (contrast is too low) */
export function isTooWhite(rgb: RGB, minContrast = 3): boolean {
  return contrastWithWhite(rgb) < minContrast;
}

/**
 * Ensure visibility under white: If the contrast is too low, darken the color in proportion to the black direction,
 * until the required contrast is reached; try to preserve the original hue/saturation.
 * @param rgb - color
 * @param minContrast - minimum contrast
 * @returns color, contrast, and whether the color was changed
 */
export function getVisibleColor({ r, g, b }: RGB, minContrast = 3): RGB {
  // Convert to linear space
  const R = srgbToLinear(norm(r));
  const G = srgbToLinear(norm(g));
  const B = srgbToLinear(norm(b));
  const L = luminance(R, G, B);

  // Target maximum luminance (by inverting the contrast threshold)
  // ratio = 1.05 / (L + 0.05) >= minContrast  =>  L <= 1.05/minContrast - 0.05
  const Lmax = 1.05 / minContrast - 0.05;

  if (L <= Lmax) return { r, g, b };

  // Scale proportionally in linear RGB to the target luminance, preserving the hue trend
  const scale = Lmax / L; // (0,1)
  const R2 = Math.max(0, Math.min(1, R * scale));
  const G2 = Math.max(0, Math.min(1, G * scale));
  const B2 = Math.max(0, Math.min(1, B * scale));

  // Back to sRGB 0..255
  const to8bit = (x: number) => Math.round(Math.max(0, Math.min(1, linearToSrgb(x))) * 255);
  const out: RGB = { r: to8bit(R2), g: to8bit(G2), b: to8bit(B2) };

  return out;
}

/**
 * Get the contrast color (black or white)
 * @param rgb - color
 * @returns contrast color
 */
export function getContrastColor({ r, g, b }: RGB): RGB {
  return isTooWhite({ r, g, b }) ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 };
}

/**
 * Get the dominant color of an image
 * @param url - image url
 * @returns dominant color
 */
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

/**
 * Convert RGB to string
 * @param rgb - color
 * @returns string
 */
export function toRGBString({ r, g, b }: RGB): string {
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Get the interpolated color between two colors
 * @param color1 - first color
 * @param color2 - second color
 * @param t - interpolation factor
 * @returns interpolated color
 */
export function getLerpColor(color1: string, color2: string, t: number) {
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
