export const THEME_CHANGE_EVENT = 'themeChange';

export function setThemeValue(key: string, value: string) {
  localStorage.setItem(key, value);
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT));
}

export function removeThemeValue(key: string) {
  localStorage.removeItem(key);
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT));
}

export function extractFirstColor(input: string | null): string | undefined {
  if (!input) return undefined;
  const match = input.match(/rgb\((\d{1,3},\s*\d{1,3},\s*\d{1,3})\)/);
  return match ? `rgb(${match[1]})` : undefined;
}

export function applyThemeToReactState(setters: {
  setBackgroundColor?: (val: string | null) => void;
  setBackgroundImage?: (val: string | null) => void;
}) {
  const selectedColor = localStorage.getItem('themeColor');
  const customImage = localStorage.getItem('themeImage');

  if (setters.setBackgroundColor) setters.setBackgroundColor(selectedColor);
  if (setters.setBackgroundImage) setters.setBackgroundImage(customImage);
}
