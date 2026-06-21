const ADMIN_DEVICE_KEY = "assembleia-calendar-admin-device";
const ADMIN_SESSION_STARTED_AT_KEY = "assembleia-calendar-admin-session-started-at";
const ADMIN_SESSION_MAX_AGE_MS = 2 * 60 * 60 * 1000;

const getStorage = () =>
  typeof window !== "undefined" ? window.sessionStorage : undefined;

export const startAdminSessionTimer = () => {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(ADMIN_SESSION_STARTED_AT_KEY, String(Date.now()));
};

export const isAdminSessionFresh = () => {
  const storage = getStorage();
  if (!storage) return false;

  const startedAt = Number(storage.getItem(ADMIN_SESSION_STARTED_AT_KEY));
  return Number.isFinite(startedAt) && Date.now() - startedAt < ADMIN_SESSION_MAX_AGE_MS;
};

export const forgetAdminDevice = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ADMIN_DEVICE_KEY);
  window.sessionStorage.removeItem(ADMIN_DEVICE_KEY);
  window.sessionStorage.removeItem(ADMIN_SESSION_STARTED_AT_KEY);
};
