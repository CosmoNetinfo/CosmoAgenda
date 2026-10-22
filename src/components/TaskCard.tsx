"use client";

import React from "react";
import { Task } from "@/types";
import { APP_CONFIG } from "@/config/app";
import {
  Clock,
  CheckCircle2,
  Circle,
  FileText,
  Smile,
  Lightbulb,
  Sparkles,
  Zap,
  PhoneCall,
  Smartphone,
  Globe,
  Share2,
  CheckSquare,
  Bot,
  ListTodo,
} from "lucide-react";

interface TaskCardProps {
  task: Task;
  onToggleStatus: (task: Task) => void;
  onClick: (task: Task) => void;
  onMoveToToday?: (task: Task) => void;
  isOverdue?: boolean;
}

export function TaskCard({
  task,
  onToggleStatus,
  onClick,
  onMoveToToday,
  isOverdue = false,
}: TaskCardProps) {
  const isDone = task.status === "done";
  const kindConfig =
    APP_CONFIG.kinds.find((k) => k.id === task.kind) || APP_CONFIG.kinds[APP_CONFIG.kinds.length - 1];
  const priorityConfig =
    APP_CONFIG.priorities.find((p) => p.id === task.priority) || APP_CONFIG.priorities[1];

  const subtasksCount = task.subtasks?.length || 0;
  const subtasksDoneCount = task.subtasks?.filter((s) => s.done).length || 0;

  // Icona per il tipo
  const renderKindIcon = () => {
    const props = { size: 12, className: "mr-1 stroke-[2.5]" };
    switch (task.kind) {
      case "articolo":
        return <FileText {...props} />;
      case "vignetta":
        return <Smile {...props} />;
      case "lo-sapevi-che":
        return <Lightbulb {...props} />;
      case "consiglio-rapido":
        return <Sparkles {...props} />;
      case "flash-news":
        return <Zap {...props} />;
      case "call":
        return <PhoneCall {...props} />;
      case "app":
        return <Smartphone {...props} />;
      case "sito":
        return <Globe {...props} />;
      case "social":
        return <Share2 {...props} />;
      default:
        return <CheckSquare {...props} />;
    }
  };

  return (
    <div
      onClick={() => onClick(task)}
      className={`group relative flex items-start gap-3 p-4 rounded-3xl transition-all duration-200 border cursor-pointer select-none active:scale-[0.99] ${
        isDone
          ? "bg-white/60 border-plum-200/50 opacity-60 hover:opacity-80"
          : isOverdue
          ? "bg-gradient-to-r from-[#FFF5F2] to-white border-[#FFD5C8] shadow-sm hover:shadow-md"
          : "bg-white border-cream-300/80 shadow-soft hover:shadow-card hover:border-plum-200"
      }`}
    >
      {/* Bottone Spunta Puccioso */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleStatus(task);
        }}
        className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-2xl flex items-center justify-center transition-transform active:scale-90 ${
          isDone
            ? "text-[#4F75FF] hover:text-[#2563EB]"
            : "text-plum-400 hover:text-plum-600"
        }`}
        title={isDone ? "Segna come da fare" : "Segna come completato"}
      >
        {isDone ? (
          <CheckCircle2 size={26} className="fill-[#D6ECFF] stroke-[#4F75FF] stroke-[2.2]" />
        ) : (
          <Circle size={26} className="stroke-plum-300 hover:stroke-[#4F75FF] stroke-[2]" />
        )}
      </button>

      {/* Contenuto Attività */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          {/* Badge Tipo con colore pastello */}
          <span
            className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border shadow-2xs"
            style={{
              backgroundColor: kindConfig.bgColor,
              color: kindConfig.textColor,
              borderColor: kindConfig.borderColor,
            }}
          >
            {renderKindIcon()}
            {kindConfig.label}
          </span>

          {/* Allegati Markdown se presenti (Requisito 3) */}
          {task.task_files && task.task_files.length > 0 && (
            <span className="text-xs font-semibold text-plum-600">
              · {task.task_files.length} {task.task_files.length === 1 ? "file .md" : "file .md"}
            </span>
          )}

          {/* Badge Progetto */}
          {task.project && (
            <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-cream-200 text-plum-700 border border-cream-300">
              #{task.project}
            </span>
          )}

          {/* Badge Orario */}
          {task.time && (
            <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-pastel-lavender/40 text-plum-800 border border-pastel-lavender">
              <Clock size={11} className="mr-1 stroke-[2.5]" />
              {task.time.slice(0, 5)}
            </span>
          )}

          {/* Indicatore Priorità se alta */}
          {task.priority === "alta" && (
            <span
              className="inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full bg-[#FFE5E5] text-[#D32F2F] border border-[#FFCDD2]"
              title="Priorità alta"
            >
              Alta
            </span>
          )}

          {/* Badge creato da AI (Claude/Assistant) */}
          {task.created_by && task.created_by !== "user" && (
            <span
              className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-cosmo-light text-cosmo-alien border border-cosmo-accent/30"
              title={`Aggiunto da ${task.created_by}`}
            >
              <Bot size={11} className="mr-0.5" />
              {task.created_by}
            </span>
          )}
        </div>

        {/* Titolo */}
        <h4
          className={`text-base font-semibold leading-snug break-words ${
            isDone ? "line-through text-plum-500" : "text-plum-800"
          }`}
        >
          {task.title}
        </h4>

        {/* Note (anteprima) */}
        {task.notes && (
          <p className="text-xs text-plum-600 line-clamp-1 mt-1 font-normal">
            {task.notes}
          </p>
        )}

        {/* Sottoattività checklist badge */}
        {subtasksCount > 0 && (
          <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-plum-600">
            <ListTodo size={13} className="text-plum-500" />
            <span>
              {subtasksDoneCount}/{subtasksCount} sotto-attività
            </span>
            <div className="w-16 h-1.5 bg-cream-200 rounded-full overflow-hidden ml-1">
              <div
                className="h-full bg-cosmo-alien rounded-full transition-all duration-300"
                style={{
                  width: `${(subtasksDoneCount / subtasksCount) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tasto "Sposta a oggi" se l'attività è arretrata */}
      {isOverdue && onMoveToToday && !isDone && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMoveToToday(task);
          }}
          className="self-center flex-shrink-0 px-3 py-1.5 rounded-2xl bg-pastel-peach text-[#5C3A20] hover:bg-[#FFD7BC] text-xs font-bold border border-pastel-peach transition-all active:scale-95 shadow-2xs whitespace-nowrap"
        >
          Sposta a oggi
        </button>
      )}
    </div>
  );
}
