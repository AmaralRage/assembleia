export const toDateKey = (dateOrYear = new Date(), month, day) => {
  if (typeof dateOrYear === "number") {
    return [
      dateOrYear,
      String(month + 1).padStart(2, "0"),
      String(day).padStart(2, "0"),
    ].join("-");
  }

  return [
    dateOrYear.getFullYear(),
    String(dateOrYear.getMonth() + 1).padStart(2, "0"),
    String(dateOrYear.getDate()).padStart(2, "0"),
  ].join("-");
};

export const getTodayKey = () => toDateKey(new Date());

export const dateKeyToDate = (dateKey) => {
  if (!dateKey) return undefined;

  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const dateKeyToUtcNoon = (dateKey) => new Date(`${dateKey}T12:00:00Z`);

export const isPastDate = (dateKey) => Boolean(dateKey && dateKey < getTodayKey());

export const addDaysToDateKey = (dateKey, amount) => {
  const date = dateKeyToDate(dateKey || getTodayKey());
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
};

export const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

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
