import React, { useEffect, useMemo, useState } from "react";
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
  MapPin,
  Plus,
  Save,
  Trash2,
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
import { Link } from "react-router-dom";

const MAX_DESCRIPTION_LENGTH = 180;
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

const toDateKey = (year, month, day) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const getTodayKey = () => {
  const today = new Date();
  return toDateKey(today.getFullYear(), today.getMonth(), today.getDate());
};

const isPastDate = (dateKey) => Boolean(dateKey && dateKey < getTodayKey());

const emptyForm = (date = "") => ({
  title: "",
  date,
  time: "19:00",
  location: "",
  description: "",
  category: "especial",
});

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

const categoryLabels = {
  especial: "Evento especial",
  culto: "Culto",
  jovens: "Jovens",
  reuniao: "Reunião",
};

const fromDatabaseEvent = (event) => ({
  id: event.id,
  title: event.title,
  date: event.event_date,
  time: event.event_time?.slice(0, 5) || "",
  location: event.location || "",
  description: event.description || "",
  category: event.category,
});

const toDatabaseEvent = (event) => ({
  title: event.title.trim(),
  event_date: event.date,
  event_time: event.time || null,
  location: event.location.trim(),
  description: event.description.trim(),
  category: event.category,
});

const CalendarPage = () => {
  const today = useMemo(() => new Date(), []);
  const [visibleDate, setVisibleDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [events, setEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    toDateKey(today.getFullYear(), today.getMonth(), today.getDate()),
  );
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPastDateWarning, setShowPastDateWarning] = useState(false);
  const [showMobileGrid, setShowMobileGrid] = useState(false);
  const [form, setForm] = useState(() => emptyForm(selectedDate));

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
        toast.error("Não foi possível carregar a agenda.");
      } else {
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

  const selectedEvent = events.find((event) => event.id === selectedEventId);
  const selectedDateEvents = events.filter(
    (event) => event.date === selectedDate,
  );
  const visibleMonthEvents = events.filter((event) => {
    const [eventYear, eventMonth] = event.date.split("-").map(Number);
    return eventYear === year && eventMonth === month + 1;
  });

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
  };

  const deleteEvent = async () => {
    if (!selectedEventId || !isAdmin) return;

    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", selectedEventId);

    if (error) {
      toast.error("Não foi possível remover o evento.");
      return;
    }

    setEvents((currentEvents) =>
      currentEvents.filter((event) => event.id !== selectedEventId),
    );
    setSelectedEventId(null);
    setIsEditing(false);
    toast.success("Evento removido.");
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
      <main className="min-h-screen bg-muted pt-24 md:pt-28 pb-14 md:pb-20">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-background border border-border rounded-xl md:rounded-3xl shadow-xl overflow-hidden"
          >
            <div className="flex flex-col gap-5 p-4 md:p-8 border-b border-border lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CalendarDays className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs md:text-sm font-semibold uppercase tracking-[0.14em] md:tracking-[0.18em] text-primary dark:text-white">
                      Agenda da Assembleia de Deus da Lapa
                    </p>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                      Calendário
                    </h1>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="flex w-full items-center justify-between bg-muted rounded-xl border border-border p-1 sm:w-auto">
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

                {isAdmin && (
                  <>
                    <Button
                      type="button"
                      onClick={startNewEvent}
                      className="rounded-xl shadow-md"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Novo evento
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
              <div className="border-b border-border p-4 md:hidden">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="font-bold text-foreground">
                    Eventos do mês
                  </h2>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {visibleMonthEvents.length} eventos
                  </span>
                </div>

                {isLoadingEvents ? (
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Carregando agenda...
                  </div>
                ) : visibleMonthEvents.length > 0 ? (
                  <div className="space-y-2">
                    {visibleMonthEvents.slice(0, 6).map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => {
                          setSelectedDate(event.date);
                          setSelectedEventId(event.id);
                          setIsEditing(false);
                        }}
                        className="w-full rounded-xl border border-border bg-background p-4 text-left transition-colors hover:border-primary/50"
                      >
                        <p className="font-semibold text-foreground">
                          {event.title}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatLongDate(event.date)} · {event.time || "A definir"}
                        </p>
                      </button>
                    ))}
                    {visibleMonthEvents.length > 6 && (
                      <p className="pt-1 text-center text-xs font-medium text-muted-foreground">
                        Role o calendário para ver mais eventos.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                    Nenhum evento cadastrado neste mês.
                  </div>
                )}
              </div>

              <div className="p-3 md:p-8 overflow-x-auto">
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

                      return (
                        <button
                          key={day.dateKey}
                          type="button"
                          onClick={() => selectDay(day)}
                          className={`min-h-28 md:min-h-32 rounded-xl md:rounded-2xl border p-2 text-left align-top transition-all hover:border-primary/50 hover:shadow-md ${
                            isSelected
                              ? "border-primary bg-primary/5 ring-2 ring-primary/15 dark:bg-primary/10 dark:ring-primary/30"
                              : "border-border bg-card"
                          } ${day.isCurrentMonth ? "" : "opacity-45"}`}
                        >
                          <span
                            className={`inline-flex w-8 h-8 items-center justify-center rounded-full text-sm font-semibold ${
                              isToday
                                ? "bg-primary text-primary-foreground"
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
                                }`}
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

              <aside className="border-t xl:border-t-0 xl:border-l border-border bg-muted/35 p-4 md:p-7">
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

                    <form onSubmit={handleSubmit} className="space-y-4">
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

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-sm font-semibold text-foreground">
                            Data
                          </label>
                          <Input
                            type="date"
                            min={getTodayKey()}
                            value={form.date}
                            onChange={(event) =>
                              setForm({ ...form, date: event.target.value })
                            }
                            className="mt-1.5 bg-background"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-foreground">
                            Horário
                          </label>
                          <Input
                            type="time"
                            value={form.time}
                            onChange={(event) =>
                              setForm({ ...form, time: event.target.value })
                            }
                            className="mt-1.5 bg-background"
                          />
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
                          <option value="reuniao">Reunião</option>
                        </select>
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

                      <Button type="submit" className="w-full rounded-xl">
                        <Save className="w-4 h-4 mr-2" />
                        Salvar evento
                      </Button>
                    </form>
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
                        onClick={deleteEvent}
                        className="rounded-xl border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive"
                        aria-label="Excluir evento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
                        Adicionar evento nesta data
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 backdrop-blur-sm p-4"
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

      <Footer />
    </>
  );
};

export default CalendarPage;
