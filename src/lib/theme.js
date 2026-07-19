const THEME_KEY = "assembleia-theme";
let themeChangeTimer;
let themeCleanupTimer;

export const getPreferredTheme = () => {
  const savedTheme = window.localStorage.getItem(THEME_KEY);

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const applyTheme = (theme) => {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
};

export const saveTheme = (theme) => {
  window.localStorage.setItem(THEME_KEY, theme);
  const root = document.documentElement;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    applyTheme(theme);
    return;
  }

  window.clearTimeout(themeChangeTimer);
  window.clearTimeout(themeCleanupTimer);
  root.classList.remove("theme-switching");
  void root.offsetWidth;
  root.classList.add("theme-switching");

  themeChangeTimer = window.setTimeout(() => applyTheme(theme), 115);
  themeCleanupTimer = window.setTimeout(() => {
    root.classList.remove("theme-switching");
  }, 340);
};
