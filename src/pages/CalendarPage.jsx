import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
  Search,
  Share2,
  Download,
  Navigation,
  Copy,
  List,
  LayoutDashboard,
  Plus,
  Save,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import Header from "@/components/Header.jsx";
import Seo from "@/components/Seo.jsx";
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
import {
  buildRecurrenceDates,
  copyEventLink,
  downloadEventIcs,
  getEventLocation,
  shareCalendarEvent,
} from "@/lib/calendarEventActions";

const MAX_DESCRIPTION_LENGTH = 180;
const MAX_BANNER_IMAGE_SIZE = 5 * 1024 * 1024;
const BANNER_IMAGE_BUCKET = "calendar-banners";
const featuredInviteMessagePresets = [
  "Venha viver uma noite de fé com a gente.",
  "Prepare-se para uma noite especial de comunhão e Palavra.",
  "Traga sua família e participe desse momento especial.",
  "Uma igreja vivendo em união.",
];
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

const formatDateTime = (value) => {
  if (!value) return "";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
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

const quickTimeOptions = ["09:00", "18:00", "19:00", "19:30", "20:00"];

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

const categorySuggestions = {
  especial: {
    title: "Evento Especial",
    time: "19:00",
    description: "Uma programação especial para toda a igreja.",
  },
  culto: {
    title: "Culto de Adoração",
    time: "19:00",
    description: "Venha cultuar conosco em comunhão.",
  },
  jovens: {
    title: "Culto de Jovens",
    time: "19:30",
    description: "Um encontro de comunhão, louvor e Palavra para a juventude.",
  },
  festividade: {
    title: "Culto de Celebração",
    time: "19:00",
    description: "Uma programação especial para celebrarmos juntos.",
  },
  reuniao: {
    title: "Reunião",
    time: "19:00",
    description: "Um momento de alinhamento, comunhão e serviço.",
  },
};

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
  createdAt: event.created_at || "",
  updatedAt: event.updated_at || "",
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

const hasMeaningfulText = (value) => /[\p{L}\p{N}]/u.test(value || "");

const getFormWarnings = (form) => {
  const warnings = [];
  const title = form.title.trim();
  const location = form.location.trim();
  const description = form.description.trim();

  if (title && title.length < 4) {
    warnings.push("O título parece curto demais.");
  }

  if (!form.time) {
    warnings.push("O evento está sem horário.");
  }

  if (location && !churchLocations.some((church) => church.name === location)) {
    warnings.push("O local não está na lista de congregações cadastradas.");
  }

  if (description && !hasMeaningfulText(description)) {
    warnings.push("A descrição parece conter apenas símbolos ou emojis.");
  }

  if (isPastDate(form.date)) {
    warnings.push("A data selecionada está no passado.");
  }

  return warnings;
};

const compareCalendarEvents = (firstEvent, secondEvent) =>
  `${firstEvent.date || ""} ${firstEvent.time || "99:99"}`.localeCompare(
    `${secondEvent.date || ""} ${secondEvent.time || "99:99"}`,
  );

const eventDateTime = (event) => {
  if (!event?.date || !event.time) return null;

  const [year, month, day] = event.date.split("-").map(Number);
  const [hour = 0, minute = 0] = event.time.split(":").map(Number);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day, hour, minute);
};

const hasEventTimePassed = (event, currentDateTime) => {
  if (!event?.date) return false;

  const currentDateKey = toDateKey(currentDateTime);
  if (event.date < currentDateKey) return true;
  if (event.date > currentDateKey) return false;

  const startsAt = eventDateTime(event);
  return startsAt ? startsAt <= currentDateTime : false;
};

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
              aria-label="Mês anterior"
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
              aria-label="Próximo mês"
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
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());
  const eventEditorRef = useRef(null);
  const selectedDayDetailsRef = useRef(null);
  const monthDayRefs = useRef({});
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
  const [showLogoutWarning, setShowLogoutWarning] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showEndedMonthEvents, setShowEndedMonthEvents] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [publicSearch, setPublicSearch] = useState("");
  const [publicCategory, setPublicCategory] = useState("all");
  const [publicLocation, setPublicLocation] = useState("all");
  const [showAgendaList, setShowAgendaList] = useState(false);
  const [recurrence, setRecurrence] = useState({
    enabled: false,
    frequency: "weekly",
    occurrences: 4,
    endDate: "",
  });
  const [form, setForm] = useState(() => emptyForm(selectedDate));

  useEffect(() => {
    const clockId = window.setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60 * 1000);

    return () => window.clearInterval(clockId);
  }, []);

  const scrollToEventEditorOnMobile = () => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 768px)").matches) return;

    window.requestAnimationFrame(() => {
      const target = eventEditorRef.current;
      if (!target) return;

      const headerOffset = 96;
      const targetTop =
        target.getBoundingClientRect().top + window.scrollY - headerOffset;

      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: "smooth",
      });
    });
  };

  const scrollToSelectedDayOnMobile = () => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 768px)").matches) return;

    window.requestAnimationFrame(() => {
      const target = selectedDayDetailsRef.current;
      if (!target) return;

      const headerOffset = 96;
      const targetTop =
        target.getBoundingClientRect().top + window.scrollY - headerOffset;

      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: "smooth",
      });
    });
  };

  const scrollToMonthDayOnMobile = (dateKey) => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 768px)").matches) return;

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const target = monthDayRefs.current[dateKey] || selectedDayDetailsRef.current;

        if (!target) return;

        const headerOffset = 96;
        const targetTop =
          target.getBoundingClientRect().top + window.scrollY - headerOffset;

        window.scrollTo({
          top: Math.max(0, targetTop),
          behavior: "smooth",
        });
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
  const formWarnings = getFormWarnings(form);
  const filteredChurchLocations = churchLocations.filter((location) => {
    const search = locationSearch.trim().toLowerCase();
    if (!search) return true;

    return `${location.name} ${location.address || ""}`
      .toLowerCase()
      .includes(search);
  });
  const upcomingEventsWithForm = [
    ...events.filter(
      (event) =>
        event.id !== selectedEventId &&
        !hasEventTimePassed(event, currentDateTime),
    ),
    ...(!hasEventTimePassed(form, currentDateTime)
      ? [{ ...form, id: selectedEventId || "form-preview" }]
      : []),
  ].sort(compareCalendarEvents);
  const willBeNextHomeEvent =
    Boolean(form.date) && upcomingEventsWithForm[0]?.id === (selectedEventId || "form-preview");
  const saveButtonLabel = selectedEventId ? "Atualizar evento" : "Salvar evento";
  const savingButtonLabel = selectedEventId ? "Atualizando..." : "Salvando...";

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

  const applyCategorySuggestion = () => {
    const suggestion = categorySuggestions[form.category];
    if (!suggestion) return;

    setForm((currentForm) => ({
      ...currentForm,
      title: currentForm.title.trim() ? currentForm.title : suggestion.title,
      time: currentForm.time || suggestion.time,
      description: currentForm.description.trim()
        ? currentForm.description
        : suggestion.description,
    }));
  };

  const cleanDescription = () => {
    const normalizedDescription = form.description.replace(/\s+/g, " ").trim();

    setForm({
      ...form,
      description: hasMeaningfulText(normalizedDescription)
        ? normalizedDescription
        : "",
    });
  };

  const normalizedPublicSearch = publicSearch.trim().toLocaleLowerCase("pt-BR");
  const filteredEvents = events.filter((event) => {
    const matchesText = !normalizedPublicSearch || `${event.title} ${event.description} ${event.location}`
      .toLocaleLowerCase("pt-BR").includes(normalizedPublicSearch);
    const matchesCategory = publicCategory === "all" || event.category === publicCategory;
    const matchesLocation = publicLocation === "all" || event.location === publicLocation;
    return matchesText && matchesCategory && matchesLocation;
  });
  const activePublicFilterCount = [normalizedPublicSearch, publicCategory !== "all", publicLocation !== "all"].filter(Boolean).length;
  const selectedEvent = events.find((event) => event.id === selectedEventId);
  const selectedEventLocation = selectedEvent
    ? churchLocations.find((location) =>
        location.name === selectedEvent.location || location.legacyNames?.includes(selectedEvent.location),
      )
    : null;
  const selectedEventWithAddress = selectedEvent
    ? { ...selectedEvent, address: selectedEventLocation?.address }
    : null;
  const selectedEventIsPast = selectedEvent
    ? hasEventTimePassed(selectedEvent, currentDateTime)
    : false;
  const nextUpcomingEvent = [...events]
    .filter((event) => !hasEventTimePassed(event, currentDateTime))
    .sort(compareCalendarEvents)[0];
  const canSelectEvent = (event) =>
    isAdmin || !hasEventTimePassed(event, currentDateTime);
  const selectedDateEvents = events.filter(
    (event) => event.date === selectedDate,
  );
  const selectedDateUpcomingEvents = selectedDateEvents.filter(
    (event) => !hasEventTimePassed(event, currentDateTime),
  );
  const selectedDateEndedEvents = selectedDateEvents.filter((event) =>
    hasEventTimePassed(event, currentDateTime),
  );
  const visibleMonthEvents = filteredEvents.filter((event) => {
    const [eventYear, eventMonth] = event.date.split("-").map(Number);
    return eventYear === year && eventMonth === month + 1;
  });
  const groupEventsByDate = (eventList) =>
    Object.values(
      eventList.reduce((days, event) => {
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
  const visibleMonthUpcomingEvents = visibleMonthEvents
    .filter((event) => !hasEventTimePassed(event, currentDateTime))
    .sort(compareCalendarEvents);
  const visibleMonthEndedEvents = visibleMonthEvents
    .filter((event) => hasEventTimePassed(event, currentDateTime))
    .sort(compareCalendarEvents);
  const visibleMonthUpcomingEventDays = groupEventsByDate(visibleMonthUpcomingEvents);
  const visibleMonthEndedEventDays = groupEventsByDate(visibleMonthEndedEvents);
  const nextVisibleMonthEvents = visibleMonthEvents
    .filter((event) => !hasEventTimePassed(event, currentDateTime))
    .sort(compareCalendarEvents)
    .slice(0, 3);
  const publicUpcomingEvents = filteredEvents
    .filter((event) => !hasEventTimePassed(event, currentDateTime))
    .sort(compareCalendarEvents)
    .slice(0, 12);
  const uniquePublicLocations = [...new Set(events.map((event) => event.location).filter(Boolean))].sort();
  const adminSummary = {
    upcoming: events.filter((event) => !hasEventTimePassed(event, currentDateTime)).length,
    incomplete: events.filter((event) => !hasEventTimePassed(event, currentDateTime) && (!event.description || !event.location || !event.time)).length,
    highlightsExpiring: events.filter((event) => event.highlightHome && event.highlightUntil && event.highlightUntil >= getTodayKey() && event.highlightUntil <= addDaysToDateKey(getTodayKey(), 7)).length,
    recent: [...events].sort((a, b) => (b.updatedAt || b.createdAt || "").localeCompare(a.updatedAt || a.createdAt || ""))[0],
  };
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

  const getEventStatusLabel = (event) => {
    if (hasEventTimePassed(event, currentDateTime)) {
      return event.date === getTodayKey() ? "Encerrado hoje" : "Encerrado";
    }

    if (nextUpcomingEvent?.id === event.id) return "Próximo evento";
    if (event.date === getTodayKey()) {
      return event.time ? `Hoje às ${event.time}` : "Acontece hoje";
    }

    return "Agendado";
  };

  const getEventStatusStyle = (event) => {
    if (hasEventTimePassed(event, currentDateTime)) {
      return "bg-muted text-muted-foreground";
    }

    if (nextUpcomingEvent?.id === event.id) {
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200";
    }

    if (event.date === getTodayKey()) {
      return "bg-primary text-primary-foreground";
    }

    return "bg-muted text-muted-foreground";
  };

  const renderMobileMonthEventDay = (eventDay, section = "upcoming") => {
    const isPastDay = isPastDate(eventDay.date);
    const isToday = eventDay.date === getTodayKey();
    const isSelectedEventDay = eventDay.date === selectedDate;
    const isEndedSection = section === "ended";

    return (
      <div
        key={`${section}-${eventDay.date}`}
        ref={(element) => {
          if (element) {
            monthDayRefs.current[eventDay.date] = element;
          } else {
            delete monthDayRefs.current[eventDay.date];
          }
        }}
        className={`rounded-2xl border p-3 shadow-sm ${
          isSelectedEventDay
            ? "border-primary/40 bg-primary/5"
            : isEndedSection
              ? "border-border/60 bg-muted/20"
              : "border-border bg-background"
        } ${isEndedSection ? "opacity-80" : ""}`}
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold capitalize text-foreground">
              {formatLongDate(eventDay.date)}
            </p>
            {(isPastDay && !isToday) || isEndedSection ? (
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                {isToday ? "Eventos de hoje que já passaram" : "Data já passou"}
              </p>
            ) : null}
          </div>
          {isToday && (
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
              Hoje
            </span>
          )}
        </div>

        <div className="space-y-2">
          {eventDay.events.map((event) => {
            const eventIsLocked = !canSelectEvent(event);

            return (
              <button
                key={event.id}
                type="button"
                disabled={eventIsLocked}
                onClick={() => selectEvent(event)}
                className={`w-full rounded-xl border px-3 py-2.5 text-left transition-all active:scale-[0.99] active:border-primary/60 disabled:cursor-not-allowed ${
                  selectedEventId === event.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : eventIsLocked
                      ? "border-border/70 bg-muted/10 opacity-75"
                      : "border-border bg-muted/30"
                }`}
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {categoryLabels[event.category] || "Evento"}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${getEventStatusStyle(event)}`}
                  >
                    {eventIsLocked ? (
                      <LockKeyhole className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {getEventStatusLabel(event)}
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
            );
          })}
        </div>
      </div>
    );
  };

  const renderSelectedDateEventButton = (event) => {
    const eventIsLocked = !canSelectEvent(event);

    return (
      <button
        key={`selected-${event.id}`}
        type="button"
        disabled={eventIsLocked}
        onClick={() => selectEvent(event)}
        className={`w-full rounded-xl border px-3 py-3 text-left transition-colors active:border-primary/60 active:bg-primary/5 disabled:cursor-not-allowed ${
          selectedEventId === event.id
            ? "border-primary bg-primary/5"
            : eventIsLocked
              ? "border-border/70 bg-muted/15 opacity-70"
              : "border-border bg-muted/25"
        }`}
      >
        <span className="mb-2 flex items-center justify-between gap-2">
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
              getEventColorStyle(event.id)
            }`}
          >
            {categoryLabels[event.category] || "Evento"}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] ${
              eventIsLocked ? "bg-muted text-muted-foreground" : getEventStatusStyle(event)
            }`}
          >
            {eventIsLocked ? (
              <LockKeyhole className="h-3 w-3" />
            ) : (
              <Clock className="h-3 w-3" />
            )}
            {getEventStatusLabel(event)}
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
    );
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

    if (typeof window !== "undefined" && !window.matchMedia("(min-width: 768px)").matches) {
      const dayHasVisibleEvents = filteredEvents.some(
        (event) => event.date === day.dateKey,
      );

      if (dayHasVisibleEvents) {
        scrollToMonthDayOnMobile(day.dateKey);
      }

      return;
    }

    if (!isAdmin) return;

    if (isPastDate(day.dateKey)) {
      setShowPastDateWarning(true);
      return;
    }

    setIsEditing(true);
  };

  const selectEvent = (event, eventObject) => {
    eventObject?.stopPropagation();
    if (!canSelectEvent(event)) return;

    setSelectedDate(event.date);
    setSelectedEventId(event.id);
    setIsEditing(false);
    scrollToEventEditorOnMobile();
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
    setRecurrence({ enabled: false, frequency: "weekly", occurrences: 4, endDate: "" });
    setIsEditing(true);
    scrollToEventEditorOnMobile();
  };

  const startEditing = () => {
    if (!selectedEvent) return;

    if (!isAdmin || isSavingEvent) return;

    if (isPastDate(selectedEvent.date)) {
      setShowPastDateWarning(true);
      return;
    }

    setForm({ ...selectedEvent });
    setIsEditing(true);
  };

  const duplicateSelectedEvent = () => {
    if (!selectedEvent || !isAdmin) return;

    setSelectedEventId(null);
    setSelectedDate(selectedEvent.date);
    setForm({
      ...selectedEvent,
      id: undefined,
      title: `${selectedEvent.title} (cópia)`,
      highlightHome: false,
      highlightUntil: "",
      highlightImageUrl: "",
      highlightSummary: "",
    });
    setRecurrence({ enabled: false, frequency: "weekly", occurrences: 4, endDate: "" });
    setIsEditing(true);
    scrollToEventEditorOnMobile();
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

    if (!isAdmin || isSavingEvent) return;

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
    setIsSavingEvent(true);

    try {
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
    } else if (recurrence.enabled) {
      const recurrenceDates = buildRecurrenceDates(form.date, recurrence);
      const recurringEvents = recurrenceDates.map((eventDate) => ({
        ...databaseEvent,
        event_date: eventDate,
        highlight_home: false,
        highlight_until: null,
        highlight_image_url: "",
        highlight_summary: "",
      }));

      const { data, error } = await supabase
        .from("calendar_events")
        .insert(recurringEvents)
        .select();

      if (error) {
        toast.error("Não foi possível adicionar os eventos recorrentes.");
        return;
      }

      const newEvents = data.map(fromDatabaseEvent);
      setEvents((currentEvents) =>
        [...currentEvents, ...newEvents].sort((first, second) =>
          `${first.date} ${first.time}`.localeCompare(`${second.date} ${second.time}`),
        ),
      );
      setSelectedEventId(newEvents[0]?.id || null);
      toast.success(`${newEvents.length} eventos recorrentes adicionados.`);
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
    } finally {
      setIsSavingEvent(false);
    }
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
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    forgetAdminDevice();
    setIsAdmin(false);
    setIsEditing(false);
    setShowLogoutWarning(false);
    setIsLoggingOut(false);
    toast.warning("Sessão administrativa encerrada.");
  };

  return (
    <>
      <Seo
        title="Calendário de cultos e eventos - Assembleia de Deus na Lapa"
        description="Consulte as datas, horários e locais dos próximos cultos e eventos da Assembleia de Deus na Lapa."
      />

      <Header />
      <main className="calendar-page-background min-h-screen min-w-0 overflow-x-hidden pb-14 pt-28 md:pb-20 md:pt-28">
        <div className="section-container min-w-0 max-w-full">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-background shadow-xl md:rounded-3xl"
          >
            <div className="flex flex-col gap-4 border-b border-border bg-background/95 p-4 backdrop-blur md:gap-5 md:p-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 md:h-11 md:w-11">
                    <CalendarDays className="h-5 w-5 text-primary md:h-6 md:w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="break-words text-xs font-semibold uppercase tracking-[0.1em] text-primary dark:text-white md:text-sm md:tracking-[0.18em]">
                      Agenda da Assembleia de Deus na Lapa
                    </p>
                    <h1 className="text-xl font-bold text-foreground md:text-3xl">
                      Calendário
                    </h1>
                  </div>
                </div>
              </div>

              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
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
                      onClick={() => setShowLogoutWarning(true)}
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

            <div className="min-w-0 border-b border-border bg-muted/10 p-3 sm:p-4 md:p-6">
              <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(240px,1fr)_220px_240px_auto]">
                <label className="relative block min-w-0">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={publicSearch} onChange={(event) => setPublicSearch(event.target.value)} placeholder="Buscar evento, descrição ou local..." className="h-11 min-w-0 w-full rounded-xl bg-background pl-10" />
                </label>
                <select value={publicCategory} onChange={(event) => setPublicCategory(event.target.value)} className="h-11 min-w-0 w-full max-w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold">
                  <option value="all">Todas as categorias</option>
                  {categoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <select value={publicLocation} onChange={(event) => setPublicLocation(event.target.value)} className="h-11 min-w-0 w-full max-w-full rounded-xl border border-input bg-background px-3 text-sm font-semibold">
                  <option value="all">Todas as congregações</option>
                  {uniquePublicLocations.map((location) => <option key={location} value={location}>{location}</option>)}
                </select>
                <Button type="button" variant={showAgendaList ? "default" : "outline"} onClick={() => setShowAgendaList((current) => !current)} className="h-11 min-w-0 w-full rounded-xl">
                  <List className="mr-2 h-4 w-4" />{showAgendaList ? "Ver calendário" : "Ver em lista"}
                </Button>
              </div>
              {activePublicFilterCount > 0 && (
                <div className="mt-3 flex items-center justify-between gap-3 text-xs font-semibold text-muted-foreground">
                  <span>{filteredEvents.length} resultado(s) · {activePublicFilterCount} filtro(s) ativo(s)</span>
                  <button type="button" className="text-primary hover:underline" onClick={() => { setPublicSearch(""); setPublicCategory("all"); setPublicLocation("all"); }}>Limpar filtros</button>
                </div>
              )}
            </div>

            {isAdmin && (
              <div className="border-b border-border bg-primary/5 p-4 md:p-6">
                <div className="mb-3 flex items-center gap-2"><LayoutDashboard className="h-5 w-5 text-primary" /><h2 className="font-bold text-foreground">Resumo administrativo</h2></div>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <div className="rounded-xl border border-border bg-background p-3"><p className="text-2xl font-black text-primary">{adminSummary.upcoming}</p><p className="text-xs text-muted-foreground">Próximos eventos</p></div>
                  <div className="rounded-xl border border-border bg-background p-3"><p className="text-2xl font-black text-amber-600">{adminSummary.incomplete}</p><p className="text-xs text-muted-foreground">Com dados incompletos</p></div>
                  <div className="rounded-xl border border-border bg-background p-3"><p className="text-2xl font-black text-violet-600">{adminSummary.highlightsExpiring}</p><p className="text-xs text-muted-foreground">Destaques vencendo em 7 dias</p></div>
                  <div className="rounded-xl border border-border bg-background p-3"><p className="truncate text-sm font-black text-foreground">{adminSummary.recent?.title || "Nenhum"}</p><p className="mt-1 text-xs text-muted-foreground">Alteração mais recente</p></div>
                </div>
              </div>
            )}

            {showAgendaList ? (
              <div className="p-4 md:p-8">
                <div className="mb-5 flex items-center gap-3"><List className="h-5 w-5 text-primary" /><div><h2 className="font-bold text-foreground">Próximos eventos</h2><p className="text-sm text-muted-foreground">Agenda em ordem cronológica</p></div></div>
                {publicUpcomingEvents.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{publicUpcomingEvents.map((event) => (
                  <button key={`agenda-${event.id}`} type="button" onClick={() => { selectEvent(event); setShowAgendaList(false); }} className="rounded-2xl border border-border bg-background p-4 text-left shadow-sm transition-colors hover:border-primary/50 hover:bg-primary/5">
                    <div className="mb-2 flex items-center justify-between gap-2"><span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-bold text-primary">{formatShortDate(event.date)}</span><span className="text-xs font-black text-muted-foreground">{event.time || "A definir"}</span></div>
                    <p className="font-bold text-foreground">{event.title}</p><p className="mt-1 truncate text-xs text-muted-foreground">{event.location || categoryLabels[event.category]}</p>
                  </button>
                ))}</div> : <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nenhum próximo evento corresponde aos filtros.</div>}
              </div>
            ) : <div className="grid min-w-0 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-w-0 border-b border-border bg-muted/20 p-3 sm:p-4 md:hidden">
                {isAdmin && (
                  <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-950/35 dark:text-emerald-100">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em]">
                          Modo admin ativo
                        </p>
                        <p className="mt-1 text-xs font-medium leading-relaxed">
                          Você está editando como administrador. As alterações
                          aparecem no calendário público.
                        </p>
                      </div>
                      <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" />
                    </div>
                  </div>
                )}

                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="font-bold text-foreground">
                    Agenda do mês
                  </h2>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {visibleMonthEvents.length} eventos
                  </span>
                </div>

                <div className="mb-4 min-w-0 max-w-full rounded-2xl border border-border bg-background p-2 shadow-sm sm:p-3">
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
                  <div className="grid min-w-0 grid-cols-7 gap-0.5 sm:gap-1">
                    {mobileCalendarDays.map((day) => {
                      if (!day.isCurrentMonth) {
                        return (
                          <span
                            key={`mobile-empty-${day.dateKey}`}
                            aria-hidden="true"
                            className="h-14"
                          />
                        );
                      }

                      const isSelected = selectedDate === day.dateKey;
                      const isToday = day.dateKey === getTodayKey();
                      const isPastDay = isPastDate(day.dateKey) && !isToday;
                      const mobileDayEvents = filteredEvents.filter(
                        (event) => event.date === day.dateKey,
                      );
                      const hasMobileDayEvents = mobileDayEvents.length > 0;

                      return (
                        <button
                          key={`mobile-${day.dateKey}`}
                          type="button"
                          onClick={() => selectDay(day)}
                          className={`relative flex h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg text-xs font-bold transition-all active:scale-95 sm:h-14 sm:gap-1 sm:rounded-xl sm:text-sm ${
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20"
                              : isToday
                                ? "border border-primary/50 bg-blue-100 text-primary dark:bg-primary/10"
                                : hasMobileDayEvents
                                  ? "border border-blue-200 bg-blue-50 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.08)] dark:border-primary/25 dark:bg-primary/5"
                                : isPastDay
                                  ? "bg-slate-100/70 text-muted-foreground/70 dark:bg-muted/30 dark:text-muted-foreground/60"
                                  : "bg-slate-100 text-foreground hover:bg-slate-200 dark:bg-muted/50 dark:hover:bg-muted/70"
                          }`}
                        >
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-full ${
                              isToday && !isSelected ? "bg-primary text-primary-foreground" : ""
                            }`}
                          >
                            {day.day}
                          </span>
                          {hasMobileDayEvents && (
                            <span className="flex items-center gap-1">
                              <span className="flex max-w-[2rem] gap-0.5">
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
                              {mobileDayEvents.length > 1 && (
                                <span
                                  className={`text-[10px] font-black ${
                                    isSelected ? "text-primary-foreground" : "text-primary"
                                  }`}
                                >
                                  {mobileDayEvents.length}
                                </span>
                              )}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {nextVisibleMonthEvents.length > 0 && (
                  <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                          Próximos eventos
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Acesse rapidamente os próximos compromissos.
                        </p>
                      </div>
                      <CalendarDays className="h-5 w-5 shrink-0 text-primary" />
                    </div>
                    <div className="space-y-2">
                      {nextVisibleMonthEvents.map((event) => (
                        <button
                          key={`next-mobile-${event.id}`}
                          type="button"
                          onClick={() => selectEvent(event)}
                          className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-left shadow-sm transition-colors active:border-primary/60 active:bg-primary/5"
                        >
                          <span className="rounded-lg bg-primary/10 px-2 py-1 text-xs font-black tabular-nums text-primary">
                            {formatShortDate(event.date)}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold text-foreground">
                              {event.title}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {event.location || categoryLabels[event.category] || "Evento"}
                            </span>
                          </span>
                          <span className="text-xs font-black tabular-nums text-primary">
                            {event.time || "--:--"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <motion.div
                  ref={selectedDayDetailsRef}
                  key={selectedDate}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
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
                    <div className="space-y-4">
                      {selectedDateUpcomingEvents.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.18 }}
                          className="space-y-2"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                              Ainda vai acontecer
                            </p>
                            <span className="text-xs font-semibold text-muted-foreground">
                              {selectedDateUpcomingEvents.length}
                            </span>
                          </div>
                          {selectedDateUpcomingEvents.map(renderSelectedDateEventButton)}
                        </motion.div>
                      )}

                      {selectedDateEndedEvents.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.18, delay: 0.03 }}
                          className="space-y-2"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                              Já passou
                            </p>
                            <span className="text-xs font-semibold text-muted-foreground">
                              {selectedDateEndedEvents.length}
                            </span>
                          </div>
                          {selectedDateEndedEvents.map(renderSelectedDateEventButton)}
                        </motion.div>
                      )}
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
                </motion.div>

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
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-bold text-foreground">
                        Próximos eventos
                      </h3>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {visibleMonthUpcomingEvents.length} neste mês
                      </span>
                    </div>
                    {visibleMonthUpcomingEventDays.length > 0 ? (
                      visibleMonthUpcomingEventDays.map((eventDay) => {
                      const isPastDay = isPastDate(eventDay.date);
                      const isToday = eventDay.date === getTodayKey();
                      const isSelectedEventDay = eventDay.date === selectedDate;

                      return (
                        <div
                          key={eventDay.date}
                          ref={(element) => {
                            if (element) {
                              monthDayRefs.current[eventDay.date] = element;
                            } else {
                              delete monthDayRefs.current[eventDay.date];
                            }
                          }}
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
                            {eventDay.events.map((event) => {
                              const eventIsLocked = !canSelectEvent(event);

                              return (
                              <button
                                key={event.id}
                                type="button"
                                disabled={eventIsLocked}
                                onClick={() => selectEvent(event)}
                                className={`w-full rounded-xl border px-3 py-2.5 text-left transition-all active:scale-[0.99] active:border-primary/60 disabled:cursor-not-allowed ${
                                  selectedEventId === event.id
                                    ? "border-primary bg-primary/5 shadow-sm"
                                    : eventIsLocked
                                      ? "border-border/70 bg-muted/10 opacity-75"
                                      : isPastDay && !isToday
                                        ? "border-border/70 bg-background/60"
                                        : "border-border bg-muted/30"
                                }`}
                              >
                                <div className="mb-1.5 flex items-center justify-between gap-2">
                                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                    {categoryLabels[event.category] || "Evento"}
                                  </span>
                                  {eventIsLocked ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                                      <LockKeyhole className="h-3 w-3" />
                                      {getEventStatusLabel(event)}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                                      <Clock className="h-3.5 w-3.5 text-primary" />
                                      {event.time || "A definir"}
                                    </span>
                                  )}
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
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                    ) : (
                      <div className="rounded-xl border border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
                        Não há próximos eventos neste mês.
                      </div>
                    )}
                    {visibleMonthEndedEvents.length > 0 && (
                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={() =>
                            setShowEndedMonthEvents((current) => !current)
                          }
                          className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3 text-left shadow-sm"
                        >
                          <span>
                            <span className="block text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                              Eventos encerrados
                            </span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {visibleMonthEndedEvents.length} evento(s) que já passaram
                            </span>
                          </span>
                          <ChevronRight
                            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                              showEndedMonthEvents ? "rotate-90" : ""
                            }`}
                          />
                        </button>

                        <AnimatePresence initial={false}>
                          {showEndedMonthEvents && (
                            <motion.div
                              key="ended-month-events"
                              initial={{ height: 0, opacity: 0, y: -6 }}
                              animate={{ height: "auto", opacity: 1, y: 0 }}
                              exit={{ height: 0, opacity: 0, y: -6 }}
                              transition={{
                                duration: 0.24,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-3 pt-0.5">
                                {visibleMonthEndedEventDays.map((eventDay) =>
                                  renderMobileMonthEventDay(eventDay, "ended"),
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
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
                  <motion.div
                    key={`${year}-${month}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="grid grid-cols-7 gap-2"
                  >
                    {calendarDays.map((day) => {
                      const dayEvents = filteredEvents.filter(
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
                        <motion.button
                          key={day.dateKey}
                          layout
                          type="button"
                          onClick={() => selectDay(day)}
                          whileTap={{ scale: 0.985 }}
                          transition={{ duration: 0.18 }}
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
                            {dayEvents.slice(0, 3).map((event) => {
                              const eventIsLocked = !canSelectEvent(event);

                              return (
                              <span
                                key={event.id}
                                onClick={(clickEvent) =>
                                  selectEvent(event, clickEvent)
                                }
                                className={`block rounded-lg border px-2 py-1.5 text-xs font-semibold ${
                                  getEventColorStyle(event.id)
                                } ${
                                  eventIsLocked
                                    ? "cursor-not-allowed opacity-55 saturate-50"
                                    : isPastDay
                                      ? "opacity-60 saturate-50"
                                      : ""
                                }`}
                              >
                                {eventIsLocked && !isAdmin ? (
                                  <LockKeyhole className="mr-1 inline h-3 w-3 align-[-2px]" />
                                ) : null}
                                <span className="block truncate">
                                  {event.time && `${event.time} · `}
                                  {event.title}
                                </span>
                                <span
                                  className={`mt-1 inline-flex max-w-full items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] ${
                                    eventIsLocked
                                      ? "bg-background/70 text-muted-foreground"
                                      : getEventStatusStyle(event)
                                  }`}
                                >
                                  {eventIsLocked ? (
                                    <LockKeyhole className="h-2.5 w-2.5" />
                                  ) : (
                                    <Clock className="h-2.5 w-2.5" />
                                  )}
                                  <span className="truncate">{getEventStatusLabel(event)}</span>
                                </span>
                              </span>
                              );
                            })}
                            {dayEvents.length > 3 && (
                              <span className="block px-2 text-xs font-medium text-muted-foreground">
                                + {dayEvents.length - 3} eventos
                              </span>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </motion.div>
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
                        disabled={isSavingEvent}
                        aria-label="Fechar formulário"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>

                    <form id="calendar-event-form" onSubmit={handleSubmit} className="space-y-4 pb-28 md:space-y-4 md:pb-0">
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/35 dark:text-emerald-100">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.16em]">
                              Modo admin ativo
                            </p>
                            <p className="mt-1 text-xs font-medium leading-relaxed">
                              {isSavingEvent
                                ? "Gravando as alterações no calendário..."
                                : "Revise os dados antes de publicar no calendário público."}
                            </p>
                          </div>
                          {isSavingEvent && (
                            <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 md:bg-background">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                          Dados básicos
                        </p>
                      </div>

                      {formWarnings.length > 0 && (
                        <div className="rounded-xl border border-amber-300/50 bg-amber-50 p-3 text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/35 dark:text-amber-100">
                          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em]">
                            <AlertTriangle className="h-4 w-4" />
                            Atenção antes de salvar
                          </p>
                          <ul className="mt-2 space-y-1 text-xs font-medium leading-relaxed">
                            {formWarnings.map((warning) => (
                              <li key={warning}>- {warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}

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

                      <div className="space-y-3 rounded-2xl border border-border bg-background p-4 shadow-sm md:border-0 md:bg-transparent md:p-0 md:shadow-none">
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

                      {!selectedEventId && (
                        <details className="group rounded-xl border border-border bg-background">
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                            <span>
                              <span className="block text-sm font-bold text-foreground">
                                Recorrência
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                Defina frequência, quantidade e data final.
                              </span>
                            </span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
                          </summary>
                          <div className="border-t border-border p-4">
                          <label className="flex cursor-pointer items-center justify-between gap-3">
                            <span>
                              <span className="block text-sm font-bold text-foreground">
                                Repetir este evento
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                Cria automaticamente as próximas ocorrências.
                              </span>
                            </span>
                            <input
                              type="checkbox"
                              checked={recurrence.enabled}
                              onChange={(event) =>
                                setRecurrence({
                                  ...recurrence,
                                  enabled: event.target.checked,
                                })
                              }
                              className="h-5 w-5 rounded border-input accent-primary"
                            />
                          </label>
                          {recurrence.enabled && (
                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                              <label className="text-xs font-bold text-muted-foreground">Frequência
                                <select value={recurrence.frequency} onChange={(event) => setRecurrence({ ...recurrence, frequency: event.target.value })} className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-2 text-sm text-foreground">
                                  <option value="weekly">Toda semana</option>
                                  <option value="biweekly">A cada 2 semanas</option>
                                  <option value="monthly">Todo mês, no mesmo dia</option>
                                  <option value="first-sunday">Primeiro domingo do mês</option>
                                </select>
                              </label>
                              <label className="text-xs font-bold text-muted-foreground">Ocorrências
                                <Input type="number" min="2" max="52" value={recurrence.occurrences} onChange={(event) => setRecurrence({ ...recurrence, occurrences: Math.min(52, Math.max(2, Number(event.target.value))) })} className="mt-1.5 h-10 bg-background" />
                              </label>
                              <label className="text-xs font-bold text-muted-foreground">Repetir até (opcional)
                                <Input type="date" min={form.date} value={recurrence.endDate} onChange={(event) => setRecurrence({ ...recurrence, endDate: event.target.value })} className="mt-1.5 h-10 bg-background" />
                              </label>
                              <p className="text-xs text-muted-foreground sm:col-span-3">Serão criadas até {recurrence.occurrences} ocorrências. A data final pode limitar essa quantidade.</p>
                            </div>
                          )}
                          </div>
                        </details>
                      )}

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
                        {categorySuggestions[form.category] && (
                          <div className="mt-2 rounded-xl border border-primary/15 bg-primary/5 p-3">
                            <p className="text-xs font-semibold leading-relaxed text-muted-foreground">
                              Sugestão: {categorySuggestions[form.category].title} às{" "}
                              {categorySuggestions[form.category].time}
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              className="mt-2 h-9 w-full rounded-lg text-xs font-bold"
                              onClick={applyCategorySuggestion}
                            >
                              Aplicar sugestão
                            </Button>
                          </div>
                        )}
                      </div>

                      {canHighlightEvent(form.category) && (
                        <details className="group rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background shadow-sm">
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                            <span>
                              <span className="block text-xs font-bold uppercase tracking-[0.16em] text-primary">
                                Destaque na Home
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                Banner, imagem e tempo de destaque.
                              </span>
                            </span>
                            <ChevronRight className="h-4 w-4 text-primary transition-transform group-open:rotate-90" />
                          </summary>
                          <div className="border-t border-primary/15">
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
                                  Mensagem do convite
                                </label>
                                <div className="mt-2 grid gap-2">
                                  {featuredInviteMessagePresets.map((message) => (
                                    <button
                                      key={message}
                                      type="button"
                                      disabled={!form.highlightHome}
                                      onClick={() =>
                                        setForm({
                                          ...form,
                                          highlightSummary: message,
                                        })
                                      }
                                      className={`rounded-xl border px-3 py-2 text-left text-xs font-semibold leading-relaxed transition-colors ${
                                        form.highlightSummary === message
                                          ? "border-primary bg-primary text-primary-foreground"
                                          : "border-border bg-background text-foreground hover:border-primary/50"
                                      } disabled:cursor-not-allowed disabled:opacity-50`}
                                    >
                                      {message}
                                    </button>
                                  ))}
                                </div>
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
                                    {form.highlightImageUrl && (
                                      <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/35 dark:text-emerald-100">
                                        Imagem pronta para aparecer no destaque da Home.
                                      </p>
                                    )}
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
                        </details>
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
                        <Input
                          type="search"
                          value={locationSearch}
                          onChange={(event) => setLocationSearch(event.target.value)}
                          placeholder="Buscar congregação..."
                          className="mt-1.5 bg-background"
                        />
                        <div className="mt-2 grid max-h-44 gap-2 overflow-y-auto rounded-xl border border-border bg-muted/20 p-2">
                          {filteredChurchLocations.slice(0, 6).map((location) => (
                            <button
                              key={location.id}
                              type="button"
                              onClick={() =>
                                setForm({
                                  ...form,
                                  location: location.name,
                                })
                              }
                              className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                                form.location === location.name
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-background hover:border-primary/40"
                              }`}
                            >
                              <span className="block text-xs font-bold text-foreground">
                                {location.name}
                              </span>
                              {location.address && (
                                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                                  {location.address}
                                </span>
                              )}
                            </button>
                          ))}
                          {filteredChurchLocations.length === 0 && (
                            <p className="px-2 py-3 text-center text-xs font-medium text-muted-foreground">
                              Nenhuma congregação encontrada.
                            </p>
                          )}
                        </div>
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

                      <details className="group rounded-xl border border-border bg-background">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                          <span>
                            <span className="block text-sm font-bold text-foreground">
                              Descrição
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              Texto opcional para explicar melhor o evento.
                            </span>
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
                        </summary>
                        <div className="border-t border-border p-4">
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
                        <div className="mt-1.5 flex items-center justify-between gap-3">
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-8 px-2 text-xs font-bold text-primary"
                            onClick={cleanDescription}
                            disabled={!form.description}
                          >
                            Limpar descrição
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            {form.description.length}/{MAX_DESCRIPTION_LENGTH}
                          </p>
                        </div>
                        </div>
                      </details>

                      <details className="group rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background shadow-sm">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                          <span>
                            <span className="block text-xs font-bold uppercase tracking-[0.16em] text-primary">
                              Prévia e impacto
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              Veja como o evento está ficando antes de salvar.
                            </span>
                          </span>
                          <ChevronRight className="h-4 w-4 text-primary transition-transform group-open:rotate-90" />
                        </summary>
                        <div className="space-y-4 border-t border-primary/15 p-4">
                      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-4 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                          Prévia do evento
                        </p>
                        <div className="mt-3 rounded-xl border border-border bg-background p-4">
                          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-primary">
                            <Clock className="h-3.5 w-3.5" />
                            {form.time || "Horário a definir"}
                          </div>
                          <h3 className="text-lg font-black leading-tight text-foreground">
                            {form.title.trim() || "Título do evento"}
                          </h3>
                          <p className="mt-1 text-sm font-medium capitalize text-muted-foreground">
                            {formatSelectedDate(form.date)}
                          </p>
                          {form.location && (
                            <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                              <span>{form.location}</span>
                            </p>
                          )}
                          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                            {hasMeaningfulText(form.description)
                              ? form.description
                              : "A descrição aparecerá aqui quando houver um texto de apoio."}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`rounded-xl border p-3 ${
                          willBeNextHomeEvent
                            ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/35 dark:text-emerald-100"
                            : "border-border bg-muted/25 text-muted-foreground"
                        }`}
                      >
                        <p className="text-xs font-bold uppercase tracking-[0.14em]">
                          Status na home
                        </p>
                        <p className="mt-1 text-xs font-medium leading-relaxed">
                          {willBeNextHomeEvent
                            ? "Este será o próximo evento destacado na programação semanal."
                            : "Existe outro evento antes deste na programação semanal."}
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
                        </div>
                      </details>

                      <Button
                        type="submit"
                        disabled={isSavingEvent}
                        className="hidden w-full rounded-xl md:inline-flex"
                      >
                        {isSavingEvent ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        {isSavingEvent ? savingButtonLabel : saveButtonLabel}
                      </Button>
                    </form>
                    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-3 pb-3 pt-2 shadow-[0_-12px_30px_-20px_rgba(15,23,42,0.45)] backdrop-blur md:hidden">
                      <div className="mx-auto max-w-md">
                        <div className="mb-2 grid grid-cols-[1fr_auto] items-center gap-3 px-1">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-foreground">
                              {form.title.trim() || "Novo evento"}
                            </p>
                            <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                              {formatShortDate(form.date)} · {form.time || "A definir"}
                            </p>
                          </div>
                          {isSavingEvent && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-bold text-primary">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Salvando
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-[0.7fr_1.3fr] gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={closeForm}
                          disabled={isSavingEvent}
                          className="h-11 rounded-xl px-3"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          form="calendar-event-form"
                          disabled={isSavingEvent}
                          className="h-11 rounded-xl px-3 font-bold"
                        >
                          {isSavingEvent ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          {isSavingEvent ? savingButtonLabel : saveButtonLabel}
                        </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : selectedEvent ? (
                  <motion.div
                    key={selectedEvent.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className={isAdmin ? "pb-28 md:pb-0" : ""}
                  >
                    <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary dark:text-white">
                      Evento selecionado
                    </p>
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                          getEventColorStyle(selectedEvent.id)
                        }`}
                      >
                        {categoryLabels[selectedEvent.category] || "Evento"}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${getEventStatusStyle(selectedEvent)}`}
                      >
                        {selectedEventIsPast && <LockKeyhole className="h-3.5 w-3.5" />}
                        {getEventStatusLabel(selectedEvent)}
                      </span>
                    </div>
                    <h2 className="mb-5 text-xl font-bold leading-tight text-foreground md:text-2xl">
                      {selectedEvent.title}
                    </h2>

                    {isAdmin && !isPastDate(selectedEvent.date) && (
                      <Button
                        type="button"
                        onClick={startEditing}
                        className="mb-5 h-11 w-full rounded-xl md:hidden"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Editar evento
                      </Button>
                    )}

                    <div className="grid gap-3 border-y border-border py-5 sm:grid-cols-2">
                      <div className="rounded-xl border border-border bg-muted/20 p-3">
                        <CalendarDays className="mb-2 h-5 w-5 text-primary" />
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                          Data
                        </p>
                        <p className="mt-1 text-sm font-semibold capitalize text-foreground">
                          {formatLongDate(selectedEvent.date)}
                        </p>
                      </div>
                      {selectedEvent.time && (
                        <div className="rounded-xl border border-border bg-muted/20 p-3">
                          <Clock className="mb-2 h-5 w-5 text-primary" />
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                            Horário
                          </p>
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {selectedEvent.time}
                          </p>
                        </div>
                      )}
                      {selectedEvent.location && (
                        <div className="rounded-xl border border-border bg-muted/20 p-3 sm:col-span-2">
                          <MapPin className="mb-2 h-5 w-5 text-primary" />
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                            Local
                          </p>
                          <p className="mt-1 text-sm font-semibold text-foreground [overflow-wrap:anywhere]">
                            {selectedEvent.location}
                          </p>
                        </div>
                      )}
                    </div>

                    <p className="my-6 rounded-xl border border-border bg-background p-4 leading-relaxed text-muted-foreground">
                      {selectedEvent.description || "Sem descrição adicional."}
                    </p>

                    {!selectedEventIsPast && (
                      <div className="mb-6">
                        <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-primary">Participar e compartilhar</p>
                        <div className="grid grid-cols-2 gap-2">
                          <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => downloadEventIcs(selectedEventWithAddress)}>
                            <Download className="mr-2 h-4 w-4" />Agenda
                          </Button>
                          <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => shareCalendarEvent(selectedEventWithAddress).catch(() => {})}>
                            <Share2 className="mr-2 h-4 w-4" />Compartilhar
                          </Button>
                          <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => copyEventLink(selectedEvent).then(() => toast.success("Link do evento copiado.")).catch(() => toast.error("Não foi possível copiar o link."))}>
                            <Copy className="mr-2 h-4 w-4" />Copiar link
                          </Button>
                          {getEventLocation(selectedEventWithAddress) && (
                            <Button type="button" variant="outline" className="h-11 rounded-xl" asChild>
                              <a href={selectedEventLocation?.mapUrl || `https://maps.google.com/?q=${encodeURIComponent(getEventLocation(selectedEventWithAddress))}`} target="_blank" rel="noreferrer">
                                <Navigation className="mr-2 h-4 w-4" />Como chegar
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {isAdmin && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2 md:hidden">
                          <Button
                            type="button"
                            onClick={startEditing}
                            className="h-11 rounded-xl px-2 text-xs font-bold"
                          >
                            Editar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={duplicateSelectedEvent}
                            className="h-11 rounded-xl px-2 text-xs font-bold"
                          >
                            Duplicar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={startNewEvent}
                            className="h-11 rounded-xl px-2 text-xs font-bold"
                          >
                            Novo
                          </Button>
                        </div>

                        <div className="rounded-xl border border-border bg-muted/25 p-3">
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                            Histórico
                          </p>
                          {selectedEvent.createdAt || selectedEvent.updatedAt ? (
                            <div className="mt-2 space-y-1 text-xs font-medium text-muted-foreground">
                              {selectedEvent.createdAt && (
                                <p>Criado em {formatDateTime(selectedEvent.createdAt)}</p>
                              )}
                              {selectedEvent.updatedAt && (
                                <p>Atualizado em {formatDateTime(selectedEvent.updatedAt)}</p>
                              )}
                            </div>
                          ) : (
                            <p className="mt-2 text-xs font-medium text-muted-foreground">
                              Metadados ainda não disponíveis para este evento.
                            </p>
                          )}
                        </div>

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
                          <Button
                            type="button"
                            variant="outline"
                            onClick={duplicateSelectedEvent}
                            className="col-start-1 w-full rounded-xl"
                          >
                            Duplicar evento
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

                    {isAdmin && (
                      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-3 pb-3 pt-2 shadow-[0_-12px_30px_-20px_rgba(15,23,42,0.45)] backdrop-blur md:hidden">
                        <div className="mx-auto max-w-md">
                          <div className="mb-2 grid grid-cols-[1fr_auto] items-center gap-3 px-1">
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold text-foreground">
                                {selectedEvent.title}
                              </p>
                              <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                                {formatShortDate(selectedEvent.date)} · {selectedEvent.time || "A definir"}
                              </p>
                            </div>
                            <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-bold text-primary">
                              Admin
                            </span>
                          </div>
                          <div className="grid grid-cols-[0.8fr_1.2fr] gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={duplicateSelectedEvent}
                              className="h-11 rounded-xl px-3"
                            >
                              Duplicar
                            </Button>
                            <Button
                              type="button"
                              onClick={startEditing}
                              className="h-11 rounded-xl px-3 font-bold"
                            >
                              <Save className="mr-2 h-4 w-4" />
                              Editar evento
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
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
                        {selectedDateEvents.map((event) => {
                          const eventIsLocked = !canSelectEvent(event);

                          return (
                          <button
                            key={event.id}
                            type="button"
                            disabled={eventIsLocked}
                            onClick={() => selectEvent(event)}
                            className={`w-full rounded-xl border p-4 text-left transition-colors disabled:cursor-not-allowed ${
                              eventIsLocked
                                ? "border-border/70 bg-muted/15 opacity-70"
                                : "border-border bg-background hover:border-primary/50"
                            }`}
                          >
                            {eventIsLocked && (
                              <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                                <LockKeyhole className="h-3 w-3" />
                                {getEventStatusLabel(event)}
                              </span>
                            )}
                            <p className="font-semibold text-foreground">
                              {event.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {event.time || "Horário não informado"}
                            </p>
                          </button>
                          );
                        })}
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
            </div>}
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

      {showLogoutWarning && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-title"
          onClick={() => {
            if (!isLoggingOut) setShowLogoutWarning(false);
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-border bg-background p-7 text-center shadow-2xl"
          >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <LogOut className="h-8 w-8 text-primary" />
            </div>
            <h2
              id="logout-title"
              className="text-2xl font-bold text-foreground"
            >
              Sair da conta administrativa?
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Ao sair, será necessário acessar novamente a área administrativa
              para criar, editar ou remover eventos.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowLogoutWarning(false)}
                disabled={isLoggingOut}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="rounded-xl"
              >
                {isLoggingOut ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                {isLoggingOut ? "Saindo..." : "Sair da conta"}
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
