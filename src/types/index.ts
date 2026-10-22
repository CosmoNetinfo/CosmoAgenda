import { TaskKindId, TaskPriorityId, TaskStatusId } from "../config/app";

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface TaskFile {
  id: string;
  task_id: string;
  name: string; // Deve terminare con .md
  content_md: string;
  created_by: "user" | "claude";
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  notes?: string | null;
  date: string; // Formato YYYY-MM-DD
  time?: string | null; // Formato HH:MM
  kind: TaskKindId;
  project?: string | null;
  priority: TaskPriorityId;
  repeat_rule?: string | null;
  subtasks: Subtask[];
  task_files?: TaskFile[];
  status: TaskStatusId;
  done_at?: string | null;
  created_by: string; // 'user' | 'claude' | 'assistant'
  created_at: string;
  updated_at: string;
}

export type IdeaProject = "articolo-cosmonet" | "vignetta" | "lo-sapevi-che" | "altro";
export type IdeaStatus = "nuova" | "in_lavorazione" | "pronta" | "scartata";

export interface Idea {
  id: string;
  user_id: string;
  url: string;
  title?: string | null;
  note?: string | null;
  project: IdeaProject;
  status: IdeaStatus;
  task_id?: string | null;
  created_by: "user" | "claude";
  created_at: string;
  updated_at: string;
}

export interface CreateTaskInput {
  title: string;
  notes?: string | null;
  date: string;
  time?: string | null;
  kind?: TaskKindId;
  project?: string | null;
  priority?: TaskPriorityId;
  repeat_rule?: string | null;
  subtasks?: Subtask[];
  status?: TaskStatusId;
  created_by?: string;
}

export interface UpdateTaskInput {
  title?: string;
  notes?: string | null;
  date?: string;
  time?: string | null;
  kind?: TaskKindId;
  project?: string | null;
  priority?: TaskPriorityId;
  repeat_rule?: string | null;
  subtasks?: Subtask[];
  status?: TaskStatusId;
  done_at?: string | null;
  created_by?: string;
}

export type ViewMode = "day" | "week" | "month" | "ideas";
