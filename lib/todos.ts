export type Priority = "high" | "medium" | "low";

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  dueDate?: string;
  notes?: string;
  lectureUrl?: string;
  lectureTitle?: string;
  subtasks: SubTask[];
  createdAt: string;
  order: number;
}

const KEY = "focustube_todos";

function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e instanceof DOMException && (e.code === 22 || e.name === "QuotaExceededError")) {
      console.error("localStorage quota exceeded");
    }
    return false;
  }
}

export function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Todo[];
  } catch { return []; }
}

export function saveTodos(todos: Todo[]): void {
  safeSetItem(KEY, JSON.stringify(todos));
}

export function createTodo(partial: Omit<Todo, "id" | "createdAt" | "order">, order: number): Todo {
  return {
    ...partial,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    order,
  };
}