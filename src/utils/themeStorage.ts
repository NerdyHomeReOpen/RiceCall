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
  setThemeClass: (val: string | null) => void;
  setBackgroundColor: (val: string | null) => void;
  setBackgroundImage: (val: string | null) => void;
}) {
  const theme = localStorage.getItem('selectedTheme');
  const color = localStorage.getItem('selectedThemeColor') || 'rgb(0, 115, 198) none repeat scroll 0% 0% / auto padding-box border-box';
  const customImage = localStorage.getItem('customThemeImage');

  setters.setThemeClass(theme);
  setters.setBackgroundColor(color);
  setters.setBackgroundImage(customImage);
}
