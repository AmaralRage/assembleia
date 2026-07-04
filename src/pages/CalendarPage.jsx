import React, { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  CalendarDays,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  LockKeyhole,
  LogOut,
  ImageIcon,
  MapPin,
  Plus,
  Save,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import Header from "@/components/Header.jsx";
import Footer from "@/components/Footer.jsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { churchLocations } from "@/data/churchLocations";
import { forgetAdminDevice, isAdminSessionFresh } from "@/lib/adminDevice";
import { Link, useSearchParams } from "react-router-dom";
import {
  addDaysToDateKey,
  dateKeyToDate,
  getDaysInMonth,
  getTodayKey,
  isPastDate,
  toDateKey,
} from "@/lib/calendar";

const MAX_DESCRIPTION_LENGTH = 180;
const MAX_BANNER_IMAGE_SIZE = 5 * 1024 * 1024;
const BANNER_IMAGE_BUCKET = "calendar-banners";
const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const getFileExtension = (fileName = "") => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return extension && extension !== fileName ? extension : "jpg";
};

const emptyForm = (date = "") => ({
  title: "",
  date,
  time: "19:00",
  location: "",
  description: "",
  category: "especial",
  highlightHome: false,
  highlightUntil: "",
  highlightImageUrl: "",
  highlightSummary: "",
});

const formatSelectedDate = (dateKey) => {
  const date = dateKeyToDate(dateKey);
  if (!date) return "Escolha uma data";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

const formatShortDate = (dateKey) => {
  const [year, month, day] = (dateKey || "").split("-");
  return day && month && year ? `${day}/${month}` : "";
};

const getDateParts = (dateKey) => {
  const date = dateKeyToDate(dateKey) || dateKeyToDate(getTodayKey());

  return {
    day: date.getDate(),
    month: date.getMonth(),
    year: date.getFullYear(),
  };
};

const timeOptions = Array.from({ length: 32 }, (_, index) => {
  const totalMinutes = 6 * 60 + index * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
});

const quickTimeOptions = ["18:00", "19:00", "19:30", "20:00"];

const eventColorStyles = [
  "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/60 dark:text-blue-200 dark:border-blue-600/70",
  "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/60 dark:text-amber-200 dark:border-amber-600/70",
  "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/60 dark:text-emerald-200 dark:border-emerald-600/70",
  "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/60 dark:text-violet-200 dark:border-violet-600/70",
  "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/60 dark:text-rose-200 dark:border-rose-600/70",
  "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/60 dark:text-cyan-200 dark:border-cyan-600/70",
  "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/60 dark:text-orange-200 dark:border-orange-600/70",
  "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-900/60 dark:text-fuchsia-200 dark:border-fuchsia-600/70",
];

const getEventColorStyle = (eventId = "") => {
  const hash = String(eventId)
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);

  return eventColorStyles[hash % eventColorStyles.length];
};

const eventMarkerStyles = [
  "bg-blue-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-fuchsia-500",
];

const getEventMarkerStyle = (eventId = "") => {
  const hash = String(eventId)
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), 0);

  return eventMarkerStyles[hash % eventMarkerStyles.length];
};

const categoryLabels = {
  especial: "Evento especial",
  culto: "Culto",
  jovens: "Jovens",
  festividade: "Festividade",
  reuniao: "Reunião",
};

const categoryOptions = Object.entries(categoryLabels).map(([value, label]) => ({
  value,
  label,
}));

const highlightableCategories = ["especial", "festividade"];
const canHighlightEvent = (category) => highlightableCategories.includes(category);

const fromDatabaseEvent = (event) => ({
  id: event.id,
  title: event.title,
  date: event.event_date,
  time: event.event_time?.slice(0, 5) || "",
  location: event.location || "",
  description: event.description || "",
  category: event.category,
  highlightHome: Boolean(event.highlight_home),
  highlightUntil: event.highlight_until || "",
  highlightImageUrl: event.highlight_image_url || "",
  highlightSummary: event.highlight_summary || "",
});

const toDatabaseEvent = (event) => ({
  title: event.title.trim(),
  event_date: event.date,
  event_time: event.time || null,
  location: event.location.trim(),
  description: event.description.trim(),
  category: event.category,
  highlight_home: canHighlightEvent(event.category) && event.highlightHome,
  highlight_until:
    canHighlightEvent(event.category) && event.highlightHome
      ? event.highlightUntil || null
      : null,
  highlight_image_url:
    canHighlightEvent(event.category) ? event.highlightImageUrl.trim() : "",
  highlight_summary:
    canHighlightEvent(event.category) ? event.highlightSummary.trim() : "",
});

const DatePickerField = ({
  value,
  onChange,
  disabled = false,
  minDateKey = getTodayKey(),
  placeholder = "Escolha uma data",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedParts = getDateParts(value || minDateKey);
  const [visibleMonth, setVisibleMonth] = useState({
    month: selectedParts.month,
    year: selectedParts.year,
  });

  useEffect(() => {
    const nextParts = getDateParts(value || minDateKey);
    setVisibleMonth({
      month: nextParts.month,
      year: nextParts.year,
    });
  }, [minDateKey, value]);

  const firstWeekDay = new Date(
    visibleMonth.year,
    visibleMonth.month,
    1,
  ).getDay();
  const daysInMonth = getDaysInMonth(visibleMonth.year, visibleMonth.month);
  const pickerCells = [
    ...Array.from({ length: firstWeekDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  const changePickerMonth = (offset) => {
    const nextDate = new Date(
      visibleMonth.year,
      visibleMonth.month + offset,
      1,
    );

    setVisibleMonth({
      month: nextDate.getMonth(),
      year: nextDate.getFullYear(),
    });
  };

  const selectDate = (day) => {
    const dateKey = toDateKey(visibleMonth.year, visibleMonth.month, day);
    if (dateKey < minDateKey) return;

    onChange(dateKey);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        className="mt-1.5 flex h-12 w-full items-center justify-between rounded-xl border border-input bg-background px-3 text-left text-base font-semibold text-foreground shadow-sm transition-colors hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={value ? "" : "text-muted-foreground"}>
          {value ? formatShortDate(value) : placeholder}
        </span>
        <CalendarDays className="h-4 w-4 text-primary" />
      </button>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 z-50 mt-2 max-w-full rounded-2xl border border-border bg-background p-2.5 shadow-2xl sm:p-3 md:right-auto md:w-full">
          <div className="mb-3 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl sm:h-9 sm:w-9"
              onClick={() => changePickerMonth(-1)}
              aria-label="MÃªs anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="text-sm font-bold capitalize text-foreground">
              {monthNames[visibleMonth.month]} {visibleMonth.year}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl sm:h-9 sm:w-9"
              onClick={() => changePickerMonth(1)}
              aria-label="PrÃ³ximo mÃªs"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-2 grid grid-cols-7 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {weekDays.map((weekDay, index) => (
              <span
                key={`picker-week-${weekDay}`}
                className={index === 0 || index === 6 ? "text-primary" : ""}
              >
                {weekDay.slice(0, 1)}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {pickerCells.map((day, index) => {
              if (!day) {
                return <span key={`picker-empty-${index}`} className="h-9 sm:h-10" />;
              }

              const dateKey = toDateKey(
                visibleMonth.year,
                visibleMonth.month,
                day,
              );
              const isSelected = value === dateKey;
              const isToday = getTodayKey() === dateKey;
              const isDisabledDay = dateKey < minDateKey;

              return (
                <button
                  key={dateKey}
                  type="button"
                  disabled={isDisabledDay}
                  onClick={() => selectDate(day)}
                  className={`relative flex h-9 items-center justify-center rounded-xl text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-30 sm:h-10 ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : isToday
                        ? "border border-primary/40 bg-primary/10 text-primary"
                        : "bg-muted/45 text-foreground hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-w-0 rounded-xl px-2 text-sm"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
            >
              Limpar
            </Button>
            <Button
              type="button"
              className="min-w-0 rounded-xl px-2 text-sm"
              onClick={() => {
                onChange(getTodayKey());
                setIsOpen(false);
              }}
            >
              Hoje
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const CalendarPage = () => {
  const today = useMemo(() => new Date(), []);
  const eventEditorRef = useRef(null);
  const selectedDayDetailsRef = useRef(null);
  const [searchParams] = useSearchParams();
  const deepLinkedEventId = searchParams.get("event");
  const shouldEditDeepLinkedEvent = searchParams.get("edit") === "1";
  const [visibleDate, setVisibleDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [events, setEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    toDateKey(today.getFullYear(), today.getMonth(), today.getDate()),
  );
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPastDateWarning, setShowPastDateWarning] = useState(false);
  const [showDeleteEventWarning, setShowDeleteEventWarning] = useState(false);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const [showDeleteDayWarning, setShowDeleteDayWarning] = useState(false);
  const [isDeletingDayEvents, setIsDeletingDayEvents] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [form, setForm] = useState(() => emptyForm(selectedDate));

  const scrollToEventEditorOnMobile = () => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 768px)").matches) return;

    window.requestAnimationFrame(() => {
      eventEditorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const scrollToSelectedDayOnMobile = () => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 768px)").matches) return;

    window.requestAnimationFrame(() => {
      selectedDayDetailsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  useEffect(() => {
    let sessionRetryId;

    const checkAdminAccess = async (currentSession) => {
      if (!currentSession) {
        setIsAdmin(false);
        setIsEditing(false);
        return;
      }

      if (!isAdminSessionFresh()) {
        await supabase.auth.signOut();
        forgetAdminDevice();
        setIsAdmin(false);
        setIsEditing(false);
        return;
      }

      const { data, error } = await supabase.rpc("is_calendar_admin");
      const hasAdminAccess = !error && data === true;

      setIsAdmin(hasAdminAccess);

    };

    const refreshAdminAccess = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      await checkAdminAccess(session);
    };

    const loadCalendar = async () => {
      const [{ data: sessionData }, { data, error }] = await Promise.all([
        supabase.auth.getSession(),
        supabase
          .from("calendar_events")
          .select("*")
          .order("event_date", { ascending: true })
          .order("event_time", { ascending: true }),
      ]);

      await checkAdminAccess(sessionData.session);

      if (!sessionData.session) {
        sessionRetryId = window.setTimeout(refreshAdminAccess, 150);
      }

      if (error) {
        setEventsError(true);
        toast.error("Não foi possível carregar a agenda.");
      } else {
        setEventsError(false);
        setEvents(data.map(fromDatabaseEvent));
      }

      setIsLoadingEvents(false);
    };

    loadCalendar();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setTimeout(() => {
        checkAdminAccess(currentSession);
      }, 0);
    });

    return () => {
      if (sessionRetryId) window.clearTimeout(sessionRetryId);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!deepLinkedEventId || isLoadingEvents) return;

    const targetEvent = events.find((event) => event.id === deepLinkedEventId);
    if (!targetEvent) return;

    const targetDate = dateKeyToDate(targetEvent.date);
    setSelectedDate(targetEvent.date);
    setSelectedEventId(targetEvent.id);
    setVisibleDate(new Date(targetDate.getFullYear(), targetDate.getMonth(), 1));

    if (shouldEditDeepLinkedEvent && isAdmin && !isPastDate(targetEvent.date)) {
      setForm({ ...targetEvent });
      setIsEditing(true);
    }
  }, [
    deepLinkedEventId,
    events,
    isAdmin,
    isLoadingEvents,
    shouldEditDeepLinkedEvent,
  ]);

  const year = visibleDate.getFullYear();
  const month = visibleDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekDay = new Date(year, month, 1).getDay();
  const previousMonthDays = new Date(year, month, 0).getDate();

  const calendarDays = useMemo(() => {
    const cells = [];

    for (let index = firstWeekDay - 1; index >= 0; index -= 1) {
      const day = previousMonthDays - index;
      const date = new Date(year, month - 1, day);
      cells.push({
        day,
        dateKey: toDateKey(date.getFullYear(), date.getMonth(), day),
        isCurrentMonth: false,
      });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({
        day,
        dateKey: toDateKey(year, month, day),
        isCurrentMonth: true,
      });
    }

    let nextMonthDay = 1;
    while (cells.length < 42) {
      const date = new Date(year, month + 1, nextMonthDay);
      cells.push({
        day: nextMonthDay,
        dateKey: toDateKey(
          date.getFullYear(),
          date.getMonth(),
          nextMonthDay,
        ),
        isCurrentMonth: false,
      });
      nextMonthDay += 1;
    }

    return cells;
  }, [daysInMonth, firstWeekDay, month, previousMonthDays, year]);

  const formDateParts = getDateParts(form.date);
  const formDaysInMonth = getDaysInMonth(formDateParts.year, formDateParts.month);
  const formFirstWeekDay = new Date(
    formDateParts.year,
    formDateParts.month,
    1,
  ).getDay();
  const formCalendarCells = [
    ...Array.from({ length: formFirstWeekDay }, () => null),
    ...Array.from({ length: formDaysInMonth }, (_, index) => index + 1),
  ];
  const yearOptions = useMemo(() => {
    const currentYear = today.getFullYear();
    return Array.from({ length: 6 }, (_, index) => currentYear + index);
  }, [today]);
  const highlightDurationOptions = useMemo(
    () => [
      { label: "Ate o evento", value: form.date || getTodayKey() },
      { label: "7 dias", value: addDaysToDateKey(getTodayKey(), 7) },
      { label: "15 dias", value: addDaysToDateKey(getTodayKey(), 15) },
      { label: "30 dias", value: addDaysToDateKey(getTodayKey(), 30) },
    ],
    [form.date],
  );

  const updateFormDate = (changes) => {
    const nextParts = { ...formDateParts, ...changes };
    const safeDay = Math.min(
      nextParts.day,
      getDaysInMonth(nextParts.year, nextParts.month),
    );
    const nextDate = toDateKey(nextParts.year, nextParts.month, safeDay);

    setForm({
      ...form,
      date: nextDate < getTodayKey() ? getTodayKey() : nextDate,
    });
  };

  const changeFormMonth = (offset) => {
    const nextMonth = new Date(
      formDateParts.year,
      formDateParts.month + offset,
      1,
    );

    updateFormDate({
      year: nextMonth.getFullYear(),
      month: nextMonth.getMonth(),
    });
  };

  const adjustFormTime = (offsetMinutes) => {
    const [hour = 19, minute = 0] = (form.time || "19:00")
      .split(":")
      .map(Number);
    const nextTotal = Math.min(
      23 * 60 + 30,
      Math.max(0, hour * 60 + minute + offsetMinutes),
    );
    const nextHour = Math.floor(nextTotal / 60);
    const nextMinute = nextTotal % 60;

    setForm({
      ...form,
      time: `${String(nextHour).padStart(2, "0")}:${String(nextMinute).padStart(2, "0")}`,
    });
  };

  const selectedEvent = events.find((event) => event.id === selectedEventId);
  const selectedDateEvents = events.filter(
    (event) => event.date === selectedDate,
  );
  const visibleMonthEvents = events.filter((event) => {
    const [eventYear, eventMonth] = event.date.split("-").map(Number);
    return eventYear === year && eventMonth === month + 1;
  });
  const visibleMonthEventDays = Object.values(
    visibleMonthEvents.reduce((days, event) => {
      if (!days[event.date]) {
        days[event.date] = {
          date: event.date,
          events: [],
        };
      }

      days[event.date].events.push(event);
      return days;
    }, {}),
  ).sort((firstDay, secondDay) => firstDay.date.localeCompare(secondDay.date));
  const mobileCalendarDays = useMemo(() => {
    let lastCurrentMonthIndex = calendarDays.length - 1;

    while (
      lastCurrentMonthIndex > 0 &&
      !calendarDays[lastCurrentMonthIndex].isCurrentMonth
    ) {
      lastCurrentMonthIndex -= 1;
    }

    return calendarDays.slice(0, lastCurrentMonthIndex + 1);
  }, [calendarDays]);

  const formatLongDate = (dateKey) => {
    if (!dateKey) return "";
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${dateKey}T12:00:00Z`));
  };

  const changeMonth = (offset) => {
    const nextMonth = new Date(year, month + offset, 1);
    const nextDateKey = toDateKey(
      nextMonth.getFullYear(),
      nextMonth.getMonth(),
      1,
    );
    setVisibleDate(nextMonth);
    setSelectedDate(nextDateKey);
    setSelectedEventId(null);
    setIsEditing(false);
    setForm(emptyForm(nextDateKey));
  };

  const goToToday = () => {
    const todayKey = getTodayKey();
    setVisibleDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(todayKey);
    setSelectedEventId(null);
    setIsEditing(false);
    setForm(emptyForm(todayKey));
  };

  const selectDay = (day) => {
    setSelectedDate(day.dateKey);
    setSelectedEventId(null);
    setForm(emptyForm(day.dateKey));
    setIsEditing(false);

    if (!day.isCurrentMonth) {
      const date = new Date(`${day.dateKey}T12:00:00`);
      setVisibleDate(new Date(date.getFullYear(), date.getMonth(), 1));
    }

    if (!isAdmin) return;

    if (isPastDate(day.dateKey)) {
      setShowPastDateWarning(true);
      return;
    }

    setIsEditing(true);
  };

  const selectEvent = (event, eventObject) => {
    eventObject.stopPropagation();
    setSelectedDate(event.date);
    setSelectedEventId(event.id);
    setIsEditing(false);
  };

  const startNewEvent = () => {
    if (!isAdmin) return;

    const date =
      selectedDate ||
      toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

    if (isPastDate(date)) {
      setShowPastDateWarning(true);
      return;
    }

    setSelectedEventId(null);
    setForm(emptyForm(date));
    setIsEditing(true);
    scrollToEventEditorOnMobile();
  };

  const startEditing = () => {
    if (!selectedEvent) return;

    if (!isAdmin) return;

    if (isPastDate(selectedEvent.date)) {
      setShowPastDateWarning(true);
      return;
    }

    setForm({ ...selectedEvent });
    setIsEditing(true);
  };

  const closeForm = () => {
    setIsEditing(false);
    if (!selectedEventId) setForm(emptyForm(selectedDate));
  };

  const handleBannerImageUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Escolha uma imagem para o banner.");
      return;
    }

    if (file.size > MAX_BANNER_IMAGE_SIZE) {
      toast.error("A imagem deve ter no maximo 5MB.");
      return;
    }

    setIsUploadingBanner(true);

    const extension = getFileExtension(file.name);
    const fileName = `${form.date || getTodayKey()}-${crypto.randomUUID()}.${extension}`;
    const filePath = `home-highlights/${fileName}`;

    const { error } = await supabase.storage
      .from(BANNER_IMAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "31536000",
        upsert: false,
      });

    if (error) {
      toast.error("Nao foi possivel enviar a imagem do banner.");
      setIsUploadingBanner(false);
      return;
    }

    const { data } = supabase.storage
      .from(BANNER_IMAGE_BUCKET)
      .getPublicUrl(filePath);

    setForm((currentForm) => ({
      ...currentForm,
      highlightImageUrl: data.publicUrl,
    }));
    setIsUploadingBanner(false);
    toast.success("Imagem do banner enviada.");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isAdmin) return;

    if (!form.title.trim() || !form.date) {
      toast.error("Informe o título e a data do evento.");
      return;
    }

    if (form.description.length > MAX_DESCRIPTION_LENGTH) {
      toast.error(
        `A descrição deve ter no máximo ${MAX_DESCRIPTION_LENGTH} caracteres.`,
      );
      return;
    }

    if (canHighlightEvent(form.category) && form.highlightHome && !form.highlightUntil) {
      toast.error("Informe ate quando o evento deve ficar em destaque.");
      return;
    }

    if (isPastDate(form.date)) {
      setShowPastDateWarning(true);
      return;
    }

    const databaseEvent = toDatabaseEvent(form);

    if (selectedEventId) {
      const { data, error } = await supabase
        .from("calendar_events")
        .update(databaseEvent)
        .eq("id", selectedEventId)
        .select()
        .single();

      if (error) {
        toast.error("Não foi possível atualizar o evento.");
        return;
      }

      const updatedEvent = fromDatabaseEvent(data);
      setEvents((currentEvents) =>
        currentEvents.map((item) =>
          item.id === selectedEventId ? updatedEvent : item,
        ),
      );
      toast.success("Evento atualizado.");
    } else {
      const { data, error } = await supabase
        .from("calendar_events")
        .insert(databaseEvent)
        .select()
        .single();

      if (error) {
        toast.error("Não foi possível adicionar o evento.");
        return;
      }

      const newEvent = fromDatabaseEvent(data);
      setEvents((currentEvents) => [...currentEvents, newEvent]);
      setSelectedEventId(newEvent.id);
      toast.success("Evento adicionado ao calendário.");
    }

    const eventDate = new Date(`${form.date}T12:00:00`);
    setVisibleDate(
      new Date(eventDate.getFullYear(), eventDate.getMonth(), 1),
    );
    setSelectedDate(form.date);
    setIsEditing(false);
    scrollToSelectedDayOnMobile();
  };

  const deleteEvent = async () => {
    if (!selectedEventId || !isAdmin) return;

    setIsDeletingEvent(true);

    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", selectedEventId);

    setIsDeletingEvent(false);

    if (error) {
      toast.error("Não foi possível remover o evento.");
      return;
    }

    setEvents((currentEvents) =>
      currentEvents.filter((event) => event.id !== selectedEventId),
    );
    setSelectedEventId(null);
    setIsEditing(false);
    setShowDeleteEventWarning(false);
    scrollToSelectedDayOnMobile();
    toast.success("Evento removido.");
  };

  const deleteSelectedDateEvents = async () => {
    if (!isAdmin || selectedDateEvents.length <= 1) return;

    setIsDeletingDayEvents(true);

    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("event_date", selectedDate);

    setIsDeletingDayEvents(false);

    if (error) {
      toast.error("Não foi possível remover os eventos deste dia.");
      return;
    }

    setEvents((currentEvents) =>
      currentEvents.filter((event) => event.date !== selectedDate),
    );
    setSelectedEventId(null);
    setIsEditing(false);
    setShowDeleteDayWarning(false);
    scrollToSelectedDayOnMobile();
    toast.success("Eventos do dia removidos.");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    forgetAdminDevice();
    setIsAdmin(false);
    setIsEditing(false);
    toast.warning("Sessão administrativa encerrada.");
  };

  return (
    <>
      <Helmet>
        <title>Calendário - Assembleia de Deus da Lapa</title>
        <meta
          name="description"
          content="Consulte e organize os eventos da Assembleia de Deus da Lapa."
        />
      </Helmet>

      <Header />
      <main className="min-h-screen bg-muted pb-14 pt-28 md:pb-20 md:pt-28">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-background border border-border rounded-xl md:rounded-3xl shadow-xl overflow-hidden"
          >
            <div className="flex flex-col gap-4 border-b border-border bg-background/95 p-4 backdrop-blur md:gap-5 md:p-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 md:h-11 md:w-11">
                    <CalendarDays className="h-5 w-5 text-primary md:h-6 md:w-6" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-semibold uppercase tracking-[0.14em] md:tracking-[0.18em] text-primary dark:text-white">
                      Agenda da Assembleia de Deus da Lapa
                    </p>
                    <h1 className="text-xl font-bold text-foreground md:text-3xl">
                      Calendário
                    </h1>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="flex w-full items-center justify-between rounded-xl border border-border bg-muted p-1 sm:w-auto">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => changeMonth(-1)}
                    aria-label="Mês anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <span className="min-w-32 text-center text-sm font-semibold text-foreground sm:min-w-40 sm:text-base">
                    {monthNames[month]} {year}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => changeMonth(1)}
                    aria-label="Próximo mês"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={goToToday}
                  className="rounded-xl md:hidden"
                >
                  Hoje
                </Button>

                {isAdmin && (
                  <>
                    <Button
                      type="button"
                      onClick={startNewEvent}
                      className="rounded-xl shadow-md"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      <span className="md:hidden">
                        Novo em {formatShortDate(selectedDate)}
                      </span>
                      <span className="hidden md:inline">Novo evento</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleLogout}
                      className="rounded-xl"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </Button>
                  </>
                )}

                {!isAdmin && (
                  <Button type="button" variant="outline" asChild className="rounded-xl">
                    <Link to="/administracao">
                      <LockKeyhole className="w-4 h-4 mr-2" />
                      Área administrativa
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="border-b border-border bg-muted/20 p-4 md:hidden">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="font-bold text-foreground">
                    Agenda do mês
                  </h2>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {visibleMonthEvents.length} eventos
                  </span>
                </div>

                <div className="mb-4 rounded-2xl border border-border bg-background p-3 shadow-sm">
                  <div className="mb-2 grid grid-cols-7 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    {weekDays.map((weekDay, index) => (
                      <span
                        key={weekDay}
                        className={index === 0 || index === 6 ? "text-primary" : ""}
                      >
                        {weekDay.slice(0, 1)}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {mobileCalendarDays.map((day) => {
                      if (!day.isCurrentMonth) {
                        return (
                          <span
                            key={`mobile-empty-${day.dateKey}`}
                            aria-hidden="true"
                            className="h-12"
                          />
                        );
                      }

                      const isSelected = selectedDate === day.dateKey;
                      const isToday = day.dateKey === getTodayKey();
                      const isPastDay = isPastDate(day.dateKey) && !isToday;
                      const mobileDayEvents = events.filter(
                        (event) => event.date === day.dateKey,
                      );
                      const hasMobileDayEvents = mobileDayEvents.length > 0;

                      return (
                        <button
                          key={`mobile-${day.dateKey}`}
                          type="button"
                          onClick={() => selectDay(day)}
                          className={`relative flex h-12 items-center justify-center rounded-xl text-sm font-bold transition-all active:scale-95 ${
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                              : isToday
                                ? "border border-primary/40 bg-primary/10 text-primary"
                                : hasMobileDayEvents
                                  ? "border border-primary/25 bg-primary/5 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.08)]"
                                : isPastDay
                                  ? "bg-muted/30 text-muted-foreground/60"
                                  : "bg-muted/50 text-foreground"
                          }`}
                        >
                          {day.day}
                          {hasMobileDayEvents && (
                            <span className="absolute bottom-1.5 flex max-w-[1.75rem] gap-0.5">
                              {mobileDayEvents.slice(0, 3).map((event) => (
                                <span
                                  key={event.id}
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    isSelected
                                      ? "bg-primary-foreground"
                                      : getEventMarkerStyle(event.id)
                                  }`}
                                />
                              ))}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  ref={selectedDayDetailsRef}
                  className="mb-4 scroll-mt-24 rounded-2xl border border-border bg-background p-4 shadow-sm"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                        Dia selecionado
                      </p>
                      <p className="mt-1 text-sm font-bold capitalize text-foreground">
                        {formatLongDate(selectedDate)}
                      </p>
                    </div>
                    {selectedDate === getTodayKey() && (
                      <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                        Hoje
                      </span>
                    )}
                  </div>

                  {selectedDateEvents.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDateEvents.map((event) => (
                        <button
                          key={`selected-${event.id}`}
                          type="button"
                          onClick={() => {
                            setSelectedEventId(event.id);
                            setIsEditing(false);
                          }}
                          className="w-full rounded-xl border border-border bg-muted/25 px-3 py-3 text-left transition-colors active:border-primary/60 active:bg-primary/5"
                        >
                          <span className="mb-2 flex items-center justify-between gap-2">
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                                getEventColorStyle(event.id)
                              }`}
                            >
                              {categoryLabels[event.category] || "Evento"}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs font-bold tabular-nums text-primary">
                              <Clock className="h-3.5 w-3.5" />
                              {event.time || "--:--"}
                            </span>
                          </span>
                          <span className="block min-w-0">
                            <span className="block text-sm font-semibold text-foreground [overflow-wrap:anywhere]">
                              {event.title}
                            </span>
                            {event.location && (
                              <span className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                                <span className="min-w-0 [overflow-wrap:anywhere]">
                                  {event.location}
                                </span>
                              </span>
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-center">
                      <CalendarDays className="mx-auto mb-2 h-6 w-6 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        Nenhum evento neste dia.
                      </p>
                    </div>
                  )}

                  {isAdmin && selectedDateEvents.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowDeleteDayWarning(true)}
                      className="mt-3 w-full rounded-xl border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir todos do dia
                    </Button>
                  )}
                </div>

                {isLoadingEvents ? (
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Carregando agenda...
                  </div>
                ) : eventsError ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-100">
                    <div className="flex gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>Não foi possível carregar a agenda agora. Tente novamente em instantes.</p>
                    </div>
                  </div>
                ) : visibleMonthEventDays.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-bold text-foreground">
                        Eventos do mês
                      </h3>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {monthNames[month]} {year}
                      </span>
                    </div>
                    {visibleMonthEventDays.map((eventDay) => {
                      const isPastDay = isPastDate(eventDay.date);
                      const isToday = eventDay.date === getTodayKey();
                      const isSelectedEventDay = eventDay.date === selectedDate;

                      return (
                        <div
                          key={eventDay.date}
                          className={`rounded-2xl border p-3 shadow-sm ${
                            isSelectedEventDay
                              ? "border-primary/40 bg-primary/5"
                              : isPastDay && !isToday
                              ? "border-border/60 bg-muted/20 opacity-60"
                              : "border-border bg-background"
                          }`}
                        >
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold capitalize text-foreground">
                                {formatLongDate(eventDay.date)}
                              </p>
                              {isPastDay && !isToday && (
                                <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                                  Data já passou
                                </p>
                              )}
                            </div>
                            {isToday && (
                              <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                                Hoje
                              </span>
                            )}
                          </div>

                          <div className="space-y-2">
                            {eventDay.events.map((event) => (
                              <button
                                key={event.id}
                                type="button"
                                onClick={() => {
                                  setSelectedDate(event.date);
                                  setSelectedEventId(event.id);
                                  setIsEditing(false);
                                }}
                                className={`w-full rounded-xl border px-3 py-2.5 text-left transition-all active:scale-[0.99] active:border-primary/60 ${
                                  isPastDay && !isToday
                                    ? "border-border/70 bg-background/60"
                                    : "border-border bg-muted/30"
                                }`}
                              >
                                <div className="mb-1.5 flex items-center justify-between gap-2">
                                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                    {categoryLabels[event.category] || "Evento"}
                                  </span>
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                                    <Clock className="h-3.5 w-3.5 text-primary" />
                                    {event.time || "A definir"}
                                  </span>
                                </div>
                                <p className="min-w-0 text-sm font-semibold text-foreground [overflow-wrap:anywhere]">
                                  {event.title}
                                </p>
                                {event.location && (
                                  <p className="mt-1 inline-flex min-w-0 items-start gap-1.5 text-xs text-muted-foreground">
                                    <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                                    <span className="min-w-0 [overflow-wrap:anywhere]">{event.location}</span>
                                  </p>
                                )}
                                {event.description && (
                                  <p className="mt-2 line-clamp-1 min-w-0 text-xs leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
                                    {event.description}
                                  </p>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                    Nenhum evento cadastrado neste mês.
                  </div>
                )}
              </div>

              <div className="hidden overflow-x-auto p-3 md:block md:p-8">
                <div className="min-w-[620px] md:min-w-[720px]">
                  <div className="grid grid-cols-7 mb-3">
                    {weekDays.map((day, index) => (
                      <div
                        key={day}
                        className={`px-2 text-xs font-bold uppercase tracking-widest ${
                          index === 0 || index === 6
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {isLoadingEvents ? (
                    <div className="h-[460px] md:h-[552px] flex items-center justify-center rounded-xl md:rounded-2xl border border-border bg-muted/20">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                  ) : eventsError ? (
                    <div className="flex h-[460px] items-center justify-center rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-800 md:h-[552px] md:rounded-2xl dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-100">
                      <div>
                        <AlertTriangle className="mx-auto mb-3 h-8 w-8" />
                        <p className="font-semibold">Não foi possível carregar a agenda.</p>
                        <p className="mt-1 text-sm">Tente novamente em instantes.</p>
                      </div>
                    </div>
                  ) : (
                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day) => {
                      const dayEvents = events.filter(
                        (event) => event.date === day.dateKey,
                      );
                      const isSelected = selectedDate === day.dateKey;
                      const isToday =
                        day.dateKey ===
                        toDateKey(
                          today.getFullYear(),
                          today.getMonth(),
                          today.getDate(),
                        );
                      const isPastDay = isPastDate(day.dateKey) && !isToday;

                      return (
                        <button
                          key={day.dateKey}
                          type="button"
                          onClick={() => selectDay(day)}
                          className={`min-h-28 md:min-h-32 rounded-xl md:rounded-2xl border p-2 text-left align-top transition-all hover:border-primary/50 hover:shadow-md ${
                            isSelected
                              ? "border-primary bg-primary/5 ring-2 ring-primary/15 dark:bg-primary/10 dark:ring-primary/30"
                              : isPastDay
                                ? "border-border/50 bg-muted/20"
                                : "border-border bg-card"
                          } ${day.isCurrentMonth ? "" : "opacity-45"} ${isPastDay ? "opacity-55 grayscale-[0.25] hover:opacity-70" : ""}`}
                        >
                          <span
                            className={`inline-flex w-8 h-8 items-center justify-center rounded-full text-sm font-semibold ${
                              isToday
                                ? "bg-primary text-primary-foreground"
                                : isPastDay
                                  ? "text-muted-foreground/70"
                                : "text-foreground"
                            }`}
                          >
                            {day.day}
                          </span>

                          <div className="mt-2 space-y-1.5">
                            {dayEvents.slice(0, 3).map((event) => (
                              <span
                                key={event.id}
                                onClick={(clickEvent) =>
                                  selectEvent(event, clickEvent)
                                }
                                className={`block truncate rounded-lg border px-2 py-1.5 text-xs font-semibold ${
                                  getEventColorStyle(event.id)
                                } ${isPastDay ? "opacity-60 saturate-50" : ""}`}
                              >
                                {event.time && `${event.time} · `}
                                {event.title}
                              </span>
                            ))}
                            {dayEvents.length > 3 && (
                              <span className="block px-2 text-xs font-medium text-muted-foreground">
                                + {dayEvents.length - 3} eventos
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  )}
                </div>
              </div>

              <aside ref={eventEditorRef} className="scroll-mt-24 border-t border-border bg-background p-4 md:p-7 xl:border-l xl:border-t-0 xl:bg-muted/35">
                {isEditing ? (
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-2">
                          {selectedEventId ? "Editar evento" : "Novo evento"}
                        </p>
                        <h2 className="text-xl md:text-2xl font-bold text-foreground">
                          {selectedEventId
                            ? "Atualize os detalhes"
                            : "Adicionar à agenda"}
                        </h2>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={closeForm}
                        aria-label="Fechar formulário"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>

                    <form id="calendar-event-form" onSubmit={handleSubmit} className="space-y-5 pb-28 md:space-y-4 md:pb-0">
                      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 md:bg-background">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                          Dados básicos
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-foreground">
                          Título
                        </label>
                        <Input
                          value={form.title}
                          onChange={(event) =>
                            setForm({ ...form, title: event.target.value })
                          }
                          placeholder="Ex.: Culto especial"
                          className="mt-1.5 bg-background"
                        />
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-semibold text-foreground">
                            Data
                          </label>
                          <div className="mt-1.5 rounded-xl border border-input bg-background p-3 shadow-sm">
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                  <CalendarDays className="h-4 w-4 text-primary" />
                                  <span className="capitalize">
                                    {monthNames[formDateParts.month]} {formDateParts.year}
                                  </span>
                                </div>
                                <p className="mt-0.5 truncate text-xs capitalize text-muted-foreground">
                                  {formatSelectedDate(form.date)}
                                </p>
                              </div>
                              <div className="flex shrink-0 gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg"
                                  onClick={() => changeFormMonth(-1)}
                                  aria-label="Mês anterior"
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg"
                                  onClick={() => changeFormMonth(1)}
                                  aria-label="Próximo mês"
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase text-muted-foreground">
                              {weekDays.map((weekDay) => (
                                <span key={weekDay}>{weekDay.slice(0, 1)}</span>
                              ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                              {formCalendarCells.map((day, index) => {
                                if (!day) return <span key={`blank-${index}`} />;

                                const dateKey = toDateKey(
                                  formDateParts.year,
                                  formDateParts.month,
                                  day,
                                );
                                const dayEvents = events.filter(
                                  (event) => event.date === dateKey,
                                );
                                const isSelectedFormDay = formDateParts.day === day;

                                return (
                                  <button
                                    key={`${formDateParts.month}-${day}`}
                                    type="button"
                                    disabled={dateKey < getTodayKey()}
                                    onClick={() => updateFormDate({ day })}
                                    className={`relative h-10 rounded-lg text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-30 md:h-9 ${
                                      isSelectedFormDay
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "bg-muted/40 text-foreground hover:bg-primary/10 hover:text-primary"
                                    }`}
                                  >
                                    {day}
                                    {dayEvents.length > 0 && (
                                      <span className="absolute bottom-1 left-1/2 flex max-w-[1.4rem] -translate-x-1/2 gap-0.5">
                                        {dayEvents.slice(0, 3).map((event) => (
                                          <span
                                            key={event.id}
                                            className={`h-1 w-1 rounded-full ${
                                              isSelectedFormDay
                                                ? "bg-primary-foreground"
                                                : getEventMarkerStyle(event.id)
                                            }`}
                                          />
                                        ))}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="hidden grid-cols-[0.8fr_1.2fr_1fr] gap-2">
                              <select
                                value={formDateParts.day}
                                onChange={(event) =>
                                  updateFormDate({ day: Number(event.target.value) })
                                }
                                className="h-10 rounded-lg border border-input bg-muted/40 px-2 text-sm font-semibold outline-none transition-colors focus:border-primary"
                                aria-label="Dia do evento"
                              >
                                {Array.from({ length: formDaysInMonth }, (_, index) => index + 1).map((day) => (
                                  <option key={day} value={day}>
                                    {String(day).padStart(2, "0")}
                                  </option>
                                ))}
                              </select>
                              <select
                                value={formDateParts.month}
                                onChange={(event) =>
                                  updateFormDate({ month: Number(event.target.value) })
                                }
                                className="h-10 rounded-lg border border-input bg-muted/40 px-2 text-sm font-semibold outline-none transition-colors focus:border-primary"
                                aria-label="Mês do evento"
                              >
                                {monthNames.map((monthName, monthIndex) => (
                                  <option key={monthName} value={monthIndex}>
                                    {monthName}
                                  </option>
                                ))}
                              </select>
                              <select
                                value={formDateParts.year}
                                onChange={(event) =>
                                  updateFormDate({ year: Number(event.target.value) })
                                }
                                className="h-10 rounded-lg border border-input bg-muted/40 px-2 text-sm font-semibold outline-none transition-colors focus:border-primary"
                                aria-label="Ano do evento"
                              >
                                {yearOptions.map((yearOption) => (
                                  <option key={yearOption} value={yearOption}>
                                    {yearOption}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-foreground">
                            Horário
                          </label>
                          <div className="mt-1.5 rounded-xl border border-input bg-background p-3 shadow-sm">
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-2">
                              <Clock className="h-4 w-4 text-primary" />
                              <span className="text-2xl font-bold tabular-nums text-foreground">
                                {form.time || "19:00"}
                              </span>
                              </div>
                              <div className="flex shrink-0 gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-9 rounded-lg px-3 text-xs font-bold"
                                  onClick={() => adjustFormTime(-30)}
                                >
                                  -30
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-9 rounded-lg px-3 text-xs font-bold"
                                  onClick={() => adjustFormTime(30)}
                                >
                                  +30
                                </Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              {quickTimeOptions.map((time) => (
                                <button
                                  key={time}
                                  type="button"
                                  onClick={() => setForm({ ...form, time })}
                                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                                    form.time === time
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-input bg-muted/40 text-foreground hover:border-primary/50 hover:bg-primary/10"
                                  }`}
                                >
                                  {time}
                                </button>
                              ))}
                            </div>
                            <label className="mt-3 block text-xs font-semibold text-muted-foreground">
                              Horário livre
                            </label>
                            <Input
                              type="time"
                              value={form.time}
                              onChange={(event) =>
                                setForm({ ...form, time: event.target.value })
                              }
                              className="mt-1.5 h-11 rounded-lg bg-muted/40 font-semibold tabular-nums"
                            />
                            <div className="hidden max-h-36 grid-cols-2 gap-2 overflow-y-auto pr-1">
                              {timeOptions.map((time) => (
                                <button
                                  key={time}
                                  type="button"
                                  onClick={() => setForm({ ...form, time })}
                                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                                    form.time === time
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-input bg-muted/40 text-foreground hover:border-primary/50 hover:bg-primary/10"
                                  }`}
                                >
                                  {time}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-foreground">
                          Categoria
                        </label>
                        <select
                          value={form.category}
                          onChange={(event) =>
                            setForm({ ...form, category: event.target.value })
                          }
                          className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="especial">Evento especial</option>
                          <option value="culto">Culto</option>
                          <option value="jovens">Jovens</option>
                          <option value="festividade">Festividade</option>
                          <option value="reuniao">Reunião</option>
                        </select>
                      </div>

                      {canHighlightEvent(form.category) && (
                        <>
                        <div className="rounded-xl border border-border bg-background px-4 py-3">
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                            Destaque
                          </p>
                        </div>
                        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background shadow-sm">
                          <div className="border-b border-primary/15 p-4">
                            <div className="flex flex-col gap-3">
                              <div className="min-w-0">
                                <p className="flex items-center gap-2 text-sm font-bold text-foreground">
                                  <ImageIcon className="h-4 w-4 text-primary" />
                                  Destaque na Home
                                </p>
                                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                  Monte o banner principal e escolha ate quando ele fica visivel.
                                </p>
                              </div>

                              <label className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
                                <span>
                                  <span className="block text-xs font-bold text-foreground">
                                    Exibir banner
                                  </span>
                                  <span className="block text-[11px] text-muted-foreground">
                                    Aparece na Home
                                  </span>
                                </span>
                                <input
                                  type="checkbox"
                                  checked={form.highlightHome}
                                  onChange={(event) =>
                                    setForm({
                                      ...form,
                                      highlightHome: event.target.checked,
                                    })
                                  }
                                  className="h-5 w-5 rounded border-input accent-primary"
                                />
                              </label>
                            </div>
                          </div>

                          <div className="grid min-w-0 gap-5 p-4">
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-semibold text-foreground">
                                  Tempo de destaque
                                </label>
                                <div className="mt-2 grid grid-cols-2 gap-2">
                                  {highlightDurationOptions.map((option) => (
                                    <button
                                      key={option.label}
                                      type="button"
                                      disabled={!form.highlightHome}
                                      onClick={() =>
                                        setForm({
                                          ...form,
                                          highlightUntil: option.value,
                                        })
                                      }
                                      className={`rounded-xl border px-3 py-2 text-left text-xs font-bold transition-colors ${
                                        form.highlightUntil === option.value
                                          ? "border-primary bg-primary text-primary-foreground"
                                          : "border-border bg-background text-foreground hover:border-primary/50"
                                      } disabled:cursor-not-allowed disabled:opacity-50`}
                                    >
                                      {option.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <label className="text-sm font-semibold text-foreground">
                                  Data final
                                </label>
                                <DatePickerField
                                  value={form.highlightUntil}
                                  minDateKey={getTodayKey()}
                                  disabled={!form.highlightHome}
                                  onChange={(dateKey) =>
                                    setForm({
                                      ...form,
                                      highlightUntil: dateKey,
                                    })
                                  }
                                />
                                <p className="mt-1.5 text-xs text-muted-foreground">
                                  Depois dessa data, o banner some automaticamente.
                                </p>
                              </div>

                              <div>
                                <label className="text-sm font-semibold text-foreground">
                                  Descrição do banner
                                </label>
                                <Textarea
                                  value={form.highlightSummary}
                                  maxLength={240}
                                  onChange={(event) =>
                                    setForm({
                                      ...form,
                                      highlightSummary: event.target.value,
                                    })
                                  }
                                  placeholder="Convide o visitante com uma frase curta e especial..."
                                  className="mt-1.5 min-h-28 resize-none bg-background"
                                />
                                <p className="mt-1.5 text-right text-xs text-muted-foreground">
                                  {form.highlightSummary.length}/240
                                </p>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-semibold text-foreground">
                                  Foto do banner
                                </label>
                                <div className="mt-2 overflow-hidden rounded-2xl border border-dashed border-primary/30 bg-background">
                                  <div className="aspect-[16/9] bg-muted">
                                    {form.highlightImageUrl ? (
                                      <img
                                        src={form.highlightImageUrl}
                                        alt="Previa do banner"
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-muted-foreground">
                                        <ImageIcon className="h-8 w-8 text-primary" />
                                        <p className="text-xs font-semibold">
                                          Envie uma imagem horizontal para o banner.
                                        </p>
                                      </div>
                                    )}
                                  </div>

                                  <div className="grid gap-2 border-t border-border p-3">
                                    <input
                                      id="highlight-banner-upload"
                                      type="file"
                                      accept="image/*"
                                      disabled={!form.highlightHome || isUploadingBanner}
                                      onChange={handleBannerImageUpload}
                                      className="hidden"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      asChild
                                      className={`w-full ${!form.highlightHome || isUploadingBanner ? "pointer-events-none opacity-50" : ""}`}
                                    >
                                      <label htmlFor="highlight-banner-upload" className="cursor-pointer">
                                        {isUploadingBanner ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <UploadCloud className="h-4 w-4" />
                                        )}
                                        {isUploadingBanner ? "Enviando..." : "Enviar foto"}
                                      </label>
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      disabled={!form.highlightImageUrl}
                                      onClick={() =>
                                        setForm({
                                          ...form,
                                          highlightImageUrl: "",
                                        })
                                      }
                                    >
                                      Remover foto
                                    </Button>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <label className="text-sm font-semibold text-foreground">
                                  Link manual da imagem
                                </label>
                                <Input
                                  type="text"
                                  value={form.highlightImageUrl}
                                  placeholder="https://... ou /imagens/banner.jpg"
                                  disabled={!form.highlightHome}
                                  onChange={(event) =>
                                    setForm({
                                      ...form,
                                      highlightImageUrl: event.target.value,
                                    })
                                  }
                                  className="mt-1.5 bg-background"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        </>
                      )}

                      <div className="rounded-xl border border-border bg-background px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                          Detalhes
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-foreground">
                          Local
                        </label>
                        <select
                          value={form.location}
                          onChange={(event) =>
                            setForm({ ...form, location: event.target.value })
                          }
                          className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Selecione uma igreja</option>
                          {form.location &&
                            !churchLocations.some(
                              (location) => location.name === form.location,
                            ) && (
                              <option value={form.location}>
                                {form.location} (evento antigo)
                              </option>
                            )}
                          {churchLocations.map((location) => (
                            <option key={location.id} value={location.name}>
                              {location.name}
                              {location.isExample ? " (Exemplo)" : ""}
                            </option>
                          ))}
                        </select>
                        {form.location &&
                          churchLocations.find(
                            (location) => location.name === form.location,
                          ) && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              {
                                churchLocations.find(
                                  (location) => location.name === form.location,
                                ).address
                              }
                            </p>
                          )}
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-foreground">
                          Descrição
                        </label>
                        <Textarea
                          value={form.description}
                          maxLength={MAX_DESCRIPTION_LENGTH}
                          onChange={(event) =>
                            setForm({
                              ...form,
                              description: event.target.value,
                            })
                          }
                          placeholder="Conte brevemente sobre o evento..."
                          className="mt-1.5 min-h-28 bg-background resize-none"
                        />
                        <p className="mt-1.5 text-right text-xs text-muted-foreground">
                          {form.description.length}/{MAX_DESCRIPTION_LENGTH}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 md:hidden">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                          Resumo
                        </p>
                        <div className="mt-3 space-y-2 text-sm">
                          <p className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Data</span>
                            <span className="font-semibold text-foreground">
                              {formatShortDate(form.date)}
                            </span>
                          </p>
                          <p className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Horário</span>
                            <span className="font-semibold text-foreground">
                              {form.time || "A definir"}
                            </span>
                          </p>
                          <p className="flex items-start justify-between gap-3">
                            <span className="text-muted-foreground">Local</span>
                            <span className="max-w-[12rem] text-right font-semibold text-foreground">
                              {form.location || "A definir"}
                            </span>
                          </p>
                        </div>
                      </div>

                      <Button type="submit" className="hidden w-full rounded-xl md:inline-flex">
                        <Save className="w-4 h-4 mr-2" />
                        Salvar evento
                      </Button>
                    </form>
                    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 shadow-[0_-12px_30px_-20px_rgba(15,23,42,0.45)] backdrop-blur md:hidden">
                      <div className="mx-auto max-w-md">
                        <div className="mb-2 flex items-center justify-between gap-3 px-1 text-xs">
                          <span className="truncate font-semibold text-foreground">
                            {formatShortDate(form.date)}
                          </span>
                          <span className="shrink-0 font-bold tabular-nums text-primary">
                            {form.time || "A definir"}
                          </span>
                        </div>
                        <div className="grid grid-cols-[0.8fr_1.2fr] gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={closeForm}
                          className="rounded-xl"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          form="calendar-event-form"
                          className="rounded-xl"
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Salvar evento
                        </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : selectedEvent ? (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary dark:text-white mb-3">
                      Evento selecionado
                    </p>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold mb-4 ${
                        getEventColorStyle(selectedEvent.id)
                      }`}
                    >
                      {categoryLabels[selectedEvent.category] || "Evento"}
                    </span>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground leading-tight mb-5">
                      {selectedEvent.title}
                    </h2>

                    <div className="space-y-4 border-y border-border py-5">
                      <div className="flex gap-3">
                        <CalendarDays className="w-5 h-5 text-primary shrink-0" />
                        <p className="text-sm text-muted-foreground capitalize">
                          {formatLongDate(selectedEvent.date)}
                        </p>
                      </div>
                      {selectedEvent.time && (
                        <div className="flex gap-3">
                          <Clock className="w-5 h-5 text-primary shrink-0" />
                          <p className="text-sm text-muted-foreground">
                            {selectedEvent.time}
                          </p>
                        </div>
                      )}
                      {selectedEvent.location && (
                        <div className="flex gap-3">
                          <MapPin className="w-5 h-5 text-primary shrink-0" />
                          <p className="text-sm text-muted-foreground">
                            {selectedEvent.location}
                          </p>
                        </div>
                      )}
                    </div>

                    <p className="text-muted-foreground leading-relaxed my-6">
                      {selectedEvent.description || "Sem descrição adicional."}
                    </p>

                    {isAdmin && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-[1fr_auto] gap-3">
                          <Button
                            type="button"
                            onClick={startEditing}
                            className="rounded-xl"
                          >
                            Editar evento
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setShowDeleteEventWarning(true)}
                            className="rounded-xl border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive"
                            aria-label="Excluir evento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {selectedDateEvents.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowDeleteDayWarning(true)}
                            className="w-full rounded-xl border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir todos os eventos deste dia
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary mb-3">
                      Data selecionada
                    </p>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground capitalize">
                      {formatLongDate(selectedDate)}
                    </h2>

                    {isAdmin && selectedDateEvents.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowDeleteDayWarning(true)}
                        className="mt-5 w-full rounded-xl border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir todos os eventos do dia
                      </Button>
                    )}

                    {selectedDateEvents.length > 0 ? (
                      <div className="mt-6 space-y-3">
                        {selectedDateEvents.map((event) => (
                          <button
                            key={event.id}
                            type="button"
                            onClick={() => setSelectedEventId(event.id)}
                            className="w-full text-left bg-background border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
                          >
                            <p className="font-semibold text-foreground">
                              {event.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {event.time || "Horário não informado"}
                            </p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-8 rounded-2xl border border-dashed border-border bg-background p-6 text-center">
                        <CalendarDays className="w-9 h-9 text-muted-foreground/50 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                          Ainda não há eventos cadastrados para esta data.
                        </p>
                      </div>
                    )}

                    {isAdmin && (
                      <Button
                        type="button"
                        onClick={startNewEvent}
                        className="w-full mt-6 rounded-xl"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar em {formatShortDate(selectedDate)}
                      </Button>
                    )}
                  </div>
                )}
              </aside>
            </div>
          </motion.div>
        </div>
      </main>

      {showPastDateWarning && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="past-date-title"
          onClick={() => setShowPastDateWarning(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-border bg-background p-7 text-center shadow-2xl"
          >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/50">
              <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h2
              id="past-date-title"
              className="text-2xl font-bold text-foreground"
            >
              Esta data já passou
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Não é possível adicionar ou alterar eventos em uma data anterior
              ao dia de hoje. Escolha uma data atual ou futura.
            </p>
            <Button
              type="button"
              onClick={() => setShowPastDateWarning(false)}
              className="mt-7 w-full rounded-xl"
            >
              Entendi
            </Button>
          </motion.div>
        </div>
      )}

      {showDeleteEventWarning && selectedEvent && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-event-title"
          onClick={() => {
            if (!isDeletingEvent) setShowDeleteEventWarning(false);
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-border bg-background p-7 text-center shadow-2xl"
          >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
              <Trash2 className="h-8 w-8 text-destructive" />
            </div>
            <h2
              id="delete-event-title"
              className="text-2xl font-bold text-foreground"
            >
              Excluir este evento?
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Você tem certeza que deseja excluir{" "}
              <strong className="font-semibold text-foreground">
                {selectedEvent.title}
              </strong>
              ? Esta ação não poderá ser desfeita.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteEventWarning(false)}
                disabled={isDeletingEvent}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={deleteEvent}
                disabled={isDeletingEvent}
                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeletingEvent ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Excluir evento
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {showDeleteDayWarning && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-day-title"
          onClick={() => {
            if (!isDeletingDayEvents) setShowDeleteDayWarning(false);
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-border bg-background p-7 text-center shadow-2xl"
          >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
              <Trash2 className="h-8 w-8 text-destructive" />
            </div>
            <h2
              id="delete-day-title"
              className="text-2xl font-bold text-foreground"
            >
              Excluir todos os eventos?
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Você tem certeza que deseja excluir todos os eventos de{" "}
              <strong className="font-semibold text-foreground">
                {formatLongDate(selectedDate)}
              </strong>
              ? Esta ação removerá {selectedDateEvents.length} eventos e não
              poderá ser desfeita.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteDayWarning(false)}
                disabled={isDeletingDayEvents}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={deleteSelectedDateEvents}
                disabled={isDeletingDayEvents}
                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeletingDayEvents ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Excluir todos
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default CalendarPage;
