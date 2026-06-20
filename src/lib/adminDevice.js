const ADMIN_DEVICE_KEY = "assembleia-calendar-admin-device";

export const recognizeAdminDevice = () => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_DEVICE_KEY, "recognized");
};

export const isAdminDeviceRecognized = () =>
  typeof window !== "undefined" &&
  window.localStorage.getItem(ADMIN_DEVICE_KEY) === "recognized";
