import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Status = "active" | "paused" | "done";
export type Priority = "high" | "normal" | "low";

export interface Task { id: string; title: string; done: boolean; priority: Priority; createdAt: number }
export interface Project { id: string; name: string; about: string; status: Status; tasks: Task[]; createdAt: number; updatedAt: number }
export interface Idea { id: string; text: string; state: "new" | "kept" | "dropped"; projectId?: string; createdAt: number }

interface State {
  projects: Project[];
  ideas: Idea[];
  updatedAt: number;
  addProject: (name: string, about?: string) => string;
  updateProject: (id: string, change: Partial<Pick<Project, "name" | "about" | "status">>) => void;
  removeProject: (id: string) => void;
  addTask: (projectId: string, title: string, priority?: Priority) => void;
  toggleTask: (projectId: string, taskId: string) => void;
  removeTask: (projectId: string, taskId: string) => void;
  addIdea: (text: string) => void;
  judgeIdea: (id: string, keep: boolean) => void;
  ideaToProject: (id: string) => string | undefined;
  replaceAll: (data: { projects: Project[]; ideas: Idea[]; updatedAt: number }) => void;
}

const id = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const touch = () => ({ updatedAt: Date.now() });
      const editProject = (pid: string, f: (p: Project) => Project) =>
        set(s => ({ projects: s.projects.map(p => (p.id === pid ? { ...f(p), updatedAt: Date.now() } : p)), ...touch() }));
      return {
        projects: [],
        ideas: [],
        updatedAt: 0,
        addProject: (name, about = "") => {
          const p: Project = { id: id(), name: name.trim(), about: about.trim(), status: "active", tasks: [], createdAt: Date.now(), updatedAt: Date.now() };
          set(s => ({ projects: [p, ...s.projects], ...touch() }));
          return p.id;
        },
        updateProject: (pid, change) => editProject(pid, p => ({ ...p, ...change })),
        removeProject: pid => set(s => ({ projects: s.projects.filter(p => p.id !== pid), ...touch() })),
        addTask: (pid, title, priority = "normal") =>
          editProject(pid, p => ({ ...p, tasks: [...p.tasks, { id: id(), title: title.trim(), done: false, priority, createdAt: Date.now() }] })),
        toggleTask: (pid, tid) => editProject(pid, p => ({ ...p, tasks: p.tasks.map(t => (t.id === tid ? { ...t, done: !t.done } : t)) })),
        removeTask: (pid, tid) => editProject(pid, p => ({ ...p, tasks: p.tasks.filter(t => t.id !== tid) })),
        addIdea: text => set(s => ({ ideas: [{ id: id(), text: text.trim(), state: "new", createdAt: Date.now() }, ...s.ideas], ...touch() })),
        judgeIdea: (iid, keep) => set(s => ({ ideas: s.ideas.map(i => (i.id === iid ? { ...i, state: keep ? "kept" : "dropped" } : i)), ...touch() })),
        ideaToProject: iid => {
          const idea = get().ideas.find(i => i.id === iid);
          if (!idea) return undefined;
          const name = idea.text.split(/[.:\n]/)[0].slice(0, 60);
          const pid = get().addProject(name, idea.text);
          set(s => ({ ideas: s.ideas.map(i => (i.id === iid ? { ...i, state: "kept", projectId: pid } : i)), ...touch() }));
          return pid;
        },
        replaceAll: data => set({ projects: data.projects, ideas: data.ideas, updatedAt: data.updatedAt }),
      };
    },
    { name: "devspace-v2" },
  ),
);

export const openTasks = (p: Project) => p.tasks.filter(t => !t.done).length;
export const progress = (p: Project) => (p.tasks.length ? Math.round((100 * p.tasks.filter(t => t.done).length) / p.tasks.length) : 0);
