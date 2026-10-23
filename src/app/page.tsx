"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Task, ViewMode, CreateTaskInput, UpdateTaskInput, Idea } from "@/types";
import { TaskStatusId } from "@/config/app";
import { createClient } from "@/lib/supabase/client";
import { offlineStorage } from "@/lib/offline-storage";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { DayView } from "@/components/DayView";
import { WeekView } from "@/components/WeekView";
import { MonthView } from "@/components/MonthView";
import { IdeasView } from "@/components/IdeasView";
import { TaskModal } from "@/components/TaskModal";
import { VoiceModal } from "@/components/VoiceModal";
import { InfoModal } from "@/components/InfoModal";
import { SettingsModal } from "@/components/SettingsModal";
import { MascotCosmino } from "@/components/MascotCosmino";
import { Loader2, AlertCircle, WifiOff } from "lucide-react";
import { getTodayString } from "@/lib/date-utils";

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();

  const [currentView, setCurrentView] = useState<ViewMode>("day");
  const [todayStr, setTodayStr] = useState<string>(() => getTodayString());
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayString());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Monitoraggio passaggio mezzanotte e cambio data automatico
  useEffect(() => {
    const checkDateChange = () => {
      const actualToday = getTodayString();
      setTodayStr((prevToday) => {
        if (actualToday !== prevToday) {
          // Se la data odierna è cambiata (è passata la mezzanotte):
          // se l'utente stava guardando la data di ieri che era "oggi", avanziamo automaticamente ad "oggi"
          setSelectedDate((prevSelected) => (prevSelected === prevToday ? actualToday : prevSelected));
          return actualToday;
        }
        return prevToday;
      });
    };

    const interval = setInterval(checkDateChange, 15000); // Controllo ogni 15 secondi
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkDateChange();
      }
    };

    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, []);

  // Filtri e ricerca
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // Modali
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [modalDefaultDate, setModalDefaultDate] = useState<string>(selectedDate);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Monitoraggio connessione
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Controllo autenticazione e caricamento attività
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        // Controlla prima la cache locale per mostrare subito i dati (PWA offline)
        const cachedTasks = offlineStorage.getTasks();
        if (cachedTasks.length > 0) {
          setTasks(cachedTasks);
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          // Reindirizza a login se non autenticato
          router.push("/login");
          return;
        }

        setUserEmail(session.user.email || null);

        // Fetch attività da Supabase con i rispettivi file Markdown allegati
        const { data: tasksData, error: tasksError } = await supabase
          .from("tasks")
          .select("*, task_files(*)")
          .eq("user_id", session.user.id)
          .order("date", { ascending: true })
          .order("time", { ascending: true, nullsFirst: false });

        if (tasksError) {
          console.warn("Errore fetch Supabase:", tasksError);
        } else if (tasksData) {
          setTasks(tasksData as Task[]);
          offlineStorage.saveTasks(tasksData as Task[]);
        }

        // Fetch idee da Supabase
        const { data: ideasData } = await supabase
          .from("ideas")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

        if (ideasData) {
          setIdeas(ideasData as Idea[]);
        }

        // Controllo se aperto da Web Share Target o parametro view=ideas
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          if (params.get("view") === "ideas") {
            setCurrentView("ideas");
          }
        }
      } catch (err) {
        console.warn("Errore inizializzazione:", err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [router, supabase]);

  // Lista progetti unici disponibili nelle attività caricate
  const availableProjects = useMemo(() => {
    const projects = new Set<string>();
    tasks.forEach((t) => {
      if (t.project?.trim()) projects.add(t.project.trim());
    });
    return Array.from(projects);
  }, [tasks]);

  // Filtra per ricerca e progetto
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedProject && t.project !== selectedProject) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = t.title.toLowerCase().includes(q);
        const inNotes = t.notes?.toLowerCase().includes(q);
        const inKind = t.kind.toLowerCase().includes(q);
        const inProject = t.project?.toLowerCase().includes(q);
        if (!inTitle && !inNotes && !inKind && !inProject) return false;
      }
      return true;
    });
  }, [tasks, selectedProject, searchQuery]);

  // Attività del giorno selezionato
  const dayTasks = useMemo(() => {
    return filteredTasks.filter((t) => t.date === selectedDate);
  }, [filteredTasks, selectedDate]);

  // Attività passate non completate ("Da recuperare")
  const overdueTasks = useMemo(() => {
    return filteredTasks.filter((t) => t.date < todayStr && t.status === "todo");
  }, [filteredTasks, todayStr]);

  // Conteggio compiti oggi per badge nav
  const todayCount = useMemo(() => {
    return tasks.filter((t) => t.date === todayStr && t.status === "todo").length;
  }, [tasks, todayStr]);

  // Toggle stato (todo <-> done) con aggiornamento ottimistico
  const handleToggleStatus = async (task: Task) => {
    const nextStatus: TaskStatusId = task.status === "done" ? "todo" : "done";
    const doneAt = nextStatus === "done" ? new Date().toISOString() : null;

    const updatedTasks: Task[] = tasks.map((t) =>
      t.id === task.id ? { ...t, status: nextStatus, done_at: doneAt } : t
    );
    setTasks(updatedTasks);
    offlineStorage.saveTasks(updatedTasks);

    try {
      await supabase
        .from("tasks")
        .update({ status: nextStatus, done_at: doneAt })
        .eq("id", task.id);
    } catch (err) {
      console.error("Errore sincronizzazione status:", err);
    }
  };

  // Sposta attività arretrata a oggi
  const handleMoveToToday = async (task: Task) => {
    const currentToday = getTodayString();
    const updatedTasks = tasks.map((t) =>
      t.id === task.id ? { ...t, date: currentToday } : t
    );
    setTasks(updatedTasks);
    offlineStorage.saveTasks(updatedTasks);

    try {
      await supabase.from("tasks").update({ date: currentToday }).eq("id", task.id);
    } catch (err) {
      console.error("Errore spostamento a oggi:", err);
    }
  };

  // Salvataggio attività (Crea o Aggiorna)
  const handleSaveTask = async (data: CreateTaskInput | UpdateTaskInput) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert("Sessione scaduta. Effettua nuovamente l'accesso.");
      router.push("/login");
      return;
    }

    if (editingTask) {
      // Aggiornamento
      const updatedItem: Task = {
        ...editingTask,
        ...data,
        kind: data.kind || editingTask.kind,
        priority: data.priority || editingTask.priority,
        status: data.status || editingTask.status,
        subtasks: data.subtasks || editingTask.subtasks,
        updated_at: new Date().toISOString(),
      };
      const updatedList: Task[] = tasks.map((t) => (t.id === editingTask.id ? updatedItem : t));
      setTasks(updatedList);
      offlineStorage.saveTasks(updatedList);

      await supabase
        .from("tasks")
        .update(data)
        .eq("id", editingTask.id)
        .eq("user_id", session.user.id);

      return updatedItem;
    } else {
      // Creazione nuovo
      const tempId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
      const newItem: Task = {
        id: tempId,
        user_id: session.user.id,
        title: data.title!,
        date: data.date!,
        time: data.time || null,
        kind: data.kind || "altro",
        project: data.project || null,
        priority: data.priority || "normale",
        repeat_rule: data.repeat_rule || null,
        subtasks: data.subtasks || [],
        task_files: [],
        notes: data.notes || null,
        status: data.status || "todo",
        created_by: data.created_by || "user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedList = [...tasks, newItem];
      setTasks(updatedList);
      offlineStorage.saveTasks(updatedList);

      const { data: inserted, error } = await supabase
        .from("tasks")
        .insert({
          user_id: session.user.id,
          title: newItem.title,
          date: newItem.date,
          time: newItem.time,
          kind: newItem.kind,
          project: newItem.project,
          priority: newItem.priority,
          repeat_rule: newItem.repeat_rule,
          subtasks: newItem.subtasks,
          notes: newItem.notes,
          status: newItem.status,
          created_by: newItem.created_by,
        })
        .select("*, task_files(*)")
        .single();

      if (!error && inserted) {
        setTasks((prev) => prev.map((t) => (t.id === tempId ? (inserted as Task) : t)));
        return inserted as Task;
      }
      return newItem;
    }
  };

  // Eliminazione attività
  const handleDeleteTask = async (id: string) => {
    const updatedList = tasks.filter((t) => t.id !== id);
    setTasks(updatedList);
    offlineStorage.saveTasks(updatedList);

    await supabase.from("tasks").delete().eq("id", id);
  };

  const refreshTasks = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from("tasks")
        .select("*, task_files(*)")
        .eq("user_id", session.user.id)
        .order("date", { ascending: true })
        .order("time", { ascending: true, nullsFirst: false });
      if (data) {
        setTasks(data as Task[]);
        offlineStorage.saveTasks(data as Task[]);
      }
    } catch (e) {
      console.warn("Errore aggiornamento task:", e);
    }
  };

  const refreshIdeas = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from("ideas")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      if (data) {
        setIdeas(data as Idea[]);
      }
    } catch (e) {
      console.warn("Errore aggiornamento idee:", e);
    }
  };

  const handleCreateTaskFromIdea = async (idea: Idea) => {
    const todayStr = getTodayString();
    const taskKind =
      idea.project === "vignetta"
        ? "vignetta"
        : idea.project === "lo-sapevi-che"
        ? "lo-sapevi-che"
        : "articolo";

    const savedTask = await handleSaveTask({
      title: idea.title || idea.url,
      date: todayStr,
      notes: `Idea / Link: ${idea.url}${idea.note ? `\n\nNote: ${idea.note}` : ""}`,
      kind: taskKind,
      project: "Cosmonet",
      priority: "normale",
      status: "todo",
    });

    if (savedTask && savedTask.id) {
      await supabase
        .from("ideas")
        .update({
          task_id: savedTask.id,
          status: "in_lavorazione",
          updated_at: new Date().toISOString(),
        })
        .eq("id", idea.id);

      await refreshIdeas();
    }
  };

  // Apertura modale nuovo compito
  const handleOpenNewTask = (date?: string) => {
    setEditingTask(null);
    setModalDefaultDate(date || selectedDate);
    setIsTaskModalOpen(true);
  };

  // Apertura modale modifica
  const handleClickTask = (task: Task) => {
    setEditingTask(task);
    setModalDefaultDate(task.date);
    setIsTaskModalOpen(true);
  };

  // Salvataggio da dettatura vocale IA (Fase 5)
  const handleConfirmVoiceTask = async (voiceInput: CreateTaskInput) => {
    await handleSaveTask(voiceInput);
  };

  // Logout
  const handleLogout = async () => {
    if (confirm("Vuoi davvero uscire dall'agenda?")) {
      await supabase.auth.signOut();
      router.push("/login");
    }
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="min-h-screen bg-cream-100 flex flex-col items-center justify-center p-4">
        <MascotCosmino mood="thinking" size={96} animate={true} />
        <p className="text-sm font-bold text-plum-800 mt-4 flex items-center gap-2">
          <Loader2 size={16} className="animate-spin text-cosmo-alien" />
          Caricamento della tua orbita...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100 text-plum-800 flex flex-col">
      {/* Indicatore modalità offline */}
      {isOffline && (
        <div className="bg-pastel-butter text-[#554316] px-4 py-1.5 text-xs font-bold text-center flex items-center justify-center gap-1.5 border-b border-cream-300">
          <WifiOff size={14} /> Modalità offline: stai consultando le attività in memoria locale
        </div>
      )}

      {/* Intestazione */}
      <Header
        onOpenVoice={() => setIsVoiceModalOpen(true)}
        onOpenInfo={() => setIsInfoModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedProject={selectedProject}
        onSelectProject={setSelectedProject}
        availableProjects={availableProjects}
      />

      {/* Contenuto principale secondo la vista attiva */}
      <main className="flex-1 max-w-md w-full mx-auto p-4">
        {currentView === "day" && (
          <DayView
            currentDate={selectedDate}
            onDateChange={setSelectedDate}
            tasks={dayTasks}
            overdueTasks={overdueTasks}
            onToggleStatus={handleToggleStatus}
            onClickTask={handleClickTask}
            onMoveToToday={handleMoveToToday}
            onOpenNewTask={() => handleOpenNewTask(selectedDate)}
          />
        )}

        {currentView === "week" && (
          <WeekView
            currentDate={selectedDate}
            onSelectDate={setSelectedDate}
            tasks={filteredTasks}
            onToggleStatus={handleToggleStatus}
            onClickTask={handleClickTask}
            onOpenNewTaskForDate={(d) => handleOpenNewTask(d)}
          />
        )}

        {currentView === "month" && (
          <MonthView
            currentDate={selectedDate}
            onSelectDateAndSwitchToDay={(d) => {
              setSelectedDate(d);
              setCurrentView("day");
            }}
            tasks={filteredTasks}
          />
        )}

        {currentView === "ideas" && (
          <IdeasView
            ideas={ideas}
            tasks={tasks}
            onRefreshIdeas={refreshIdeas}
            onCreateTaskFromIdea={handleCreateTaskFromIdea}
          />
        )}
      </main>

      {/* Barra di navigazione in basso (Oggi, Settimana, Mese, Idee) */}
      <BottomNav
        currentView={currentView}
        onChangeView={(view) => {
          if (view === "day") {
            setSelectedDate(getTodayString());
          }
          setCurrentView(view);
        }}
        todayCount={todayCount}
        ideasCount={ideas.filter((i) => i.status === "nuova").length}
      />

      {/* Modale Aggiungi / Modifica Attività */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        initialTask={editingTask}
        defaultDate={modalDefaultDate}
        onRefreshTasks={refreshTasks}
      />

      {/* Modale Dettatura Vocale (Fase 5) */}
      <VoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onConfirmTask={handleConfirmVoiceTask}
      />

      {/* Modale Info & Connettori (Fase 4 & PWA) */}
      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        userEmail={userEmail}
      />

      {/* Modale Impostazioni & Diagnostica (Notifiche & Microfono) */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        userEmail={userEmail}
        onRefreshData={refreshTasks}
      />
    </div>
  );
}
