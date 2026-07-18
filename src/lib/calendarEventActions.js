import { addDaysToDateKey, dateKeyToDate, toDateKey } from "@/lib/calendar";

const escapeIcsText = (value = "") =>
  String(value).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

const toIcsDate = (date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

const getEventStart = (event) => {
  const [year, month, day] = event.date.split("-").map(Number);
  const [hour = 0, minute = 0] = (event.time || "00:00").split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute);
};

export const getEventPageUrl = (event) => {
  const url = new URL(window.location.href);
  url.pathname = "/calendario";
  url.search = "";
  url.searchParams.set("event", event.id);
  return url.toString();
};

export const getEventLocation = (event) => event.address || event.location || "";

export const downloadEventIcs = (event) => {
  const startsAt = getEventStart(event);
  const endsAt = new Date(startsAt.getTime() + 2 * 60 * 60 * 1000);
  const content = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//AD Lapa//Calendario//PT-BR", "BEGIN:VEVENT",
    `UID:${event.id}@adlapa`, `DTSTAMP:${toIcsDate(new Date())}`, `DTSTART:${toIcsDate(startsAt)}`,
    `DTEND:${toIcsDate(endsAt)}`, `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(`${event.description || ""}\n${getEventPageUrl(event)}`)}`,
    `LOCATION:${escapeIcsText(getEventLocation(event))}`, "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" }));
  link.download = `${event.date}-${event.title.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}.ics`;
  link.click();
  URL.revokeObjectURL(link.href);
};

export const shareCalendarEvent = async (event) => {
  const text = `${event.title}\n${event.date.split("-").reverse().join("/")} às ${event.time || "horário a definir"}${event.location ? `\n${event.location}` : ""}`;
  const url = getEventPageUrl(event);
  if (navigator.share) return navigator.share({ title: event.title, text, url });
  window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, "_blank", "noopener,noreferrer");
};

export const copyEventLink = async (event) => navigator.clipboard.writeText(getEventPageUrl(event));

export const buildRecurrenceDates = (startDate, recurrence) => {
  if (!recurrence.enabled) return [startDate];
  const dates = [];
  const limit = recurrence.endDate || addDaysToDateKey(startDate, 365);
  const maxOccurrences = Number(recurrence.occurrences) || 4;
  let current = startDate;

  while (dates.length < maxOccurrences && current <= limit) {
    dates.push(current);
    if (recurrence.frequency === "biweekly") current = addDaysToDateKey(current, 14);
    else if (recurrence.frequency === "first-sunday") {
      const date = dateKeyToDate(current);
      const firstOfNextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      const firstSunday = 1 + ((7 - firstOfNextMonth.getDay()) % 7);
      current = toDateKey(firstOfNextMonth.getFullYear(), firstOfNextMonth.getMonth(), firstSunday);
    } else if (recurrence.frequency === "monthly") {
      const date = dateKeyToDate(current);
      const originalDay = dateKeyToDate(startDate).getDate();
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      const safeDay = Math.min(originalDay, new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate());
      current = toDateKey(nextMonth.getFullYear(), nextMonth.getMonth(), safeDay);
    } else current = addDaysToDateKey(current, 7);
  }
  return dates;
};
