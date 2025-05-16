export const THEME_CHANGE_EVENT = 'themeChange';

export function setThemeValue(key: string, value: string) {
  localStorage.setItem(key, value);
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT));
}

export function removeThemeValue(key: string) {
  localStorage.removeItem(key);
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT));
}

export function applyThemeToReactState(setters: {
  setThemeClass: (val: string | null) => void;
  setBackgroundColor: (val: string | null) => void;
  setBackgroundImage: (val: string | null) => void;
}) {
  const theme = localStorage.getItem('selectedTheme');
  const color = localStorage.getItem('selectedThemeColor');
  const customImage = localStorage.getItem('customThemeImage');

  setters.setThemeClass(theme);
  setters.setBackgroundColor(color);
  setters.setBackgroundImage(customImage);
}
