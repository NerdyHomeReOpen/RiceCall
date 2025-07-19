export const THEME_CHANGE_EVENT = 'themeChange';

export function setThemeValue(key: 'theme-header-image' | 'theme-main-color' | 'theme-secondary-color', value: string) {
  localStorage.setItem(key, value);
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT));
}

export function removeThemeValue(key: 'theme-header-image' | 'theme-main-color' | 'theme-secondary-color') {
  localStorage.removeItem(key);
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT));
}

export function extractFirstColor(input: string | null): string | undefined {
  if (!input) return undefined;
  const match = input.match(/rgb\((\d{1,3},\s*\d{1,3},\s*\d{1,3})\)/);
  return match ? `rgb(${match[1]})` : undefined;
}

export function applyThemeToReactState(setters: { setHeaderImage?: (val: string | null) => void; setMainColor?: (val: string | null) => void; setSecondaryColor?: (val: string | null) => void }) {
  const headerImage = localStorage.getItem('theme-header-image');
  const mainColor = localStorage.getItem('theme-main-color');
  const secondaryColor = localStorage.getItem('theme-secondary-color');

  if (setters.setHeaderImage) setters.setHeaderImage(headerImage);
  if (setters.setMainColor) setters.setMainColor(mainColor);
  if (setters.setSecondaryColor) setters.setSecondaryColor(secondaryColor);
}
