export const toDateKey = (date = new Date()) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

export const getTodayKey = () => toDateKey(new Date());

export const dateKeyToUtcNoon = (dateKey) => new Date(`${dateKey}T12:00:00Z`);

export const formatEventDate = (dateKey) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
  }).format(dateKeyToUtcNoon(dateKey));

export const formatEventDateWithWeekday = (dateKey) =>
  new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
  }).format(dateKeyToUtcNoon(dateKey));

export const formatWeekDay = (dateKey) => {
  const weekDay = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    timeZone: "UTC",
  }).format(dateKeyToUtcNoon(dateKey));

  return weekDay.charAt(0).toUpperCase() + weekDay.slice(1);
};

export const formatEventTime = (time, fallback = "A definir") =>
  time?.slice(0, 5) || fallback;
