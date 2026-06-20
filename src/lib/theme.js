const THEME_KEY = "assembleia-theme";

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
  applyTheme(theme);
};
