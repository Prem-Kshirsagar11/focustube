"use client";
const SLIDE_STYLE = `
  @keyframes taskSlide {
    from { opacity: 0; transform: translateY(-12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;
import { useState } from "react";
import { loadTodos, saveTodos, createTodo, Todo, SubTask, Priority } from "@/lib/todos";

const PRIORITY_COLOR: Record<Priority, { bg: string; text: string; border: string; label: string }> = {
  high:   { bg: "#2d0a0a", text: "#f87171", border: "#f8717144", label: "High" },
  medium: { bg: "#1a1500", text: "#fbbf24", border: "#fbbf2444", label: "Medium" },
  low:    { bg: "#001a0d", text: "#34d399", border: "#34d39944", label: "Low" },
};


const EMPTY_FORM = {
  text: "", priority: "medium" as Priority,
  dueDate: "", notes: "", lectureUrl: "", lectureTitle: "",
  subtasks: [] as SubTask[],
};

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>(() => loadTodos());
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addingTask, setAddingTask] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [newSubText, setNewSubText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  function save(updated: Todo[]) { setTodos(updated); saveTodos(updated); }

  function toggleComplete(id: string) {
    save(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }

  function toggleSubtask(todoId: string, subId: string) {
    save(todos.map(t => t.id === todoId
      ? { ...t, subtasks: t.subtasks.map(s => s.id === subId ? { ...s, completed: !s.completed } : s) }
      : t
    ));
  }

  function deleteTodo(id: string) {
    save(todos.filter(t => t.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  function handleAddSubtask() {
    if (!newSubText.trim()) return;
    setForm(f => ({ ...f, subtasks: [...f.subtasks, { id: crypto.randomUUID(), text: newSubText.trim(), completed: false }] }));
    setNewSubText("");
  }

  function handleSubmit() {
    if (!form.text.trim()) return;
    if (editingId) {
      save(todos.map(t => t.id === editingId ? { ...t, ...form } : t));
      setEditingId(null);
    } else {
      const todo = createTodo({ ...form, completed: false }, todos.length);
      save([...todos, todo]);
    }
    setForm({ ...EMPTY_FORM });
    setAddingTask(false);
    setNewSubText("");
  }

  function startEdit(todo: Todo) {
    setForm({ text: todo.text, priority: todo.priority, dueDate: todo.dueDate ?? "", notes: todo.notes ?? "", lectureUrl: todo.lectureUrl ?? "", lectureTitle: todo.lectureTitle ?? "", subtasks: todo.subtasks });
    setEditingId(todo.id);
    setAddingTask(true);
  }

  function handleCancel() {
    setAddingTask(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setNewSubText("");
  }

  // Drag handlers
  function onDragStart(e: React.DragEvent, id: string) {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    if (id !== dragId) setDragOverId(id);
  }

  function onDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    if (!dragId || dragId === targetId) { setDragId(null); setDragOverId(null); return; }
    const from = todos.findIndex(t => t.id === dragId);
    const to = todos.findIndex(t => t.id === targetId);
    const reordered = [...todos];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    save(reordered.map((t, i) => ({ ...t, order: i })));
    setDragId(null);
    setDragOverId(null);
  }

  function onDragEnd() { setDragId(null); setDragOverId(null); }

  const filtered = todos.sort((a, b) => {
    if (a.completed === b.completed) return a.order - b.order;
    return a.completed ? 1 : -1;
  });

  const completedCount = todos.filter(t => t.completed).length;

  function isOverdue(dueDate?: string) {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date(new Date().toDateString());
  }

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
<style>{SLIDE_STYLE}</style>
      {/* TOP BAR */}
      <div style={{ padding: "24px 32px 0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#4ea8de" }}>To-Do List</h2>
            <p style={{ fontSize: 12, color: "#5390d966", marginTop: 2 }}>
              {completedCount}/{todos.length} tasks completed
            </p>
          </div>
          <button
            onClick={() => { setAddingTask(true); setEditingId(null); setForm({ ...EMPTY_FORM }); }}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#0077b6", border: "none", borderRadius: 10,
              padding: "9px 18px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer"
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Task
          </button>
        </div>

      
      </div>

      {/* ADD / EDIT FORM */}
      {addingTask && (
        <div style={{
          margin: "0 32px 16px", flexShrink: 0,
          background: "#000d1a",
          border: "1px solid #0077b633",
          borderTop: "2px solid #0077b6",
          borderRadius: 14, padding: "20px 22px",
          boxShadow: "0 4px 24px rgba(0,119,182,0.1)"
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#00b4d8", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.12em" }}>
            {editingId ? "✏ Edit Task" : "+ New Task"}
          </p>

          {/* Title */}
          <input
            autoFocus
            value={form.text}
            onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder="Task title..."
            style={{
              width: "100%", background: "#001529",
              border: "1px solid #0077b644", borderRadius: 10,
              padding: "11px 14px", color: "#fff", fontSize: 14,
              fontFamily: "inherit", marginBottom: 10,
              boxSizing: "border-box"
            }}
          />

          {/* Priority + Date row */}
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            {/* Custom priority buttons */}
            <div style={{ display: "flex", gap: 6, flex: 1 }}>
              {(["high", "medium", "low"] as Priority[]).map(p => {
                const c = PRIORITY_COLOR[p];
                const active = form.priority === p;
                return (
                  <button key={p} onClick={() => setForm(f => ({ ...f, priority: p }))}
                    style={{
                      flex: 1, padding: "9px 6px", borderRadius: 8, cursor: "pointer",
                      fontSize: 12, fontWeight: 600, textTransform: "capitalize",
                      border: `1px solid ${active ? c.border : "#002855"}`,
                      background: active ? c.bg : "#001529",
                      color: active ? c.text : "#5390d966",
                      transition: "all .2s"
                    }}>
                    {p === "high" ? "🔴" : p === "medium" ? "🟡" : "🟢"} {c.label}
                  </button>
                );
              })}
            </div>
            <input
              type="date"
              value={form.dueDate}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              style={{
                background: "#001529", border: "1px solid #0077b644",
                borderRadius: 10, padding: "9px 12px", color: "#fff", fontSize: 13,
                fontFamily: "inherit", cursor: "pointer", colorScheme: "dark"
              }}
            />
          </div>

          {/* Notes */}
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Notes (optional)..."
            rows={2}
            style={{
              width: "100%", background: "#001529",
              border: "1px solid #0077b644", borderRadius: 10,
              padding: "10px 14px", color: "#fff", fontSize: 13,
              fontFamily: "inherit", resize: "none", marginBottom: 10,
              boxSizing: "border-box"
            }}
          />

          {/* Lecture URL */}
          <div style={{ position: "relative", marginBottom: 12 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5390d9" strokeWidth="2" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
              <polygon points="23,7 16,12 23,17"/>
              <rect x="1" y="5" width="15" height="14" rx="2"/>
            </svg>
            <input
              value={form.lectureUrl}
              onChange={e => setForm(f => ({ ...f, lectureUrl: e.target.value }))}
              placeholder="Link a YouTube lecture (optional)..."
              style={{
                width: "100%", background: "#001529",
                border: "1px solid #0077b644", borderRadius: 10,
                padding: "10px 14px 10px 32px", color: "#fff", fontSize: 13,
                fontFamily: "inherit", boxSizing: "border-box"
              }}
            />
          </div>

          {/* Subtasks */}
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 10, color: "#5390d9", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.12em" }}>Subtasks</p>
            {form.subtasks.map((s, i) => (
              <div key={s.id} style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 6,
                background: "#001529", borderRadius: 8, padding: "7px 10px",
                border: "1px solid #002855"
              }}>
                <span style={{ fontSize: 13, color: "#4ea8de", flex: 1 }}>{s.text}</span>
                <button onClick={() => setForm(f => ({ ...f, subtasks: f.subtasks.filter((_, j) => j !== i) }))}
                  style={{ background: "none", border: "none", color: "#f8717166", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={newSubText}
                onChange={e => setNewSubText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddSubtask()}
                placeholder="Add subtask and press Enter..."
                style={{
                  flex: 1, background: "#001529", border: "1px solid #002855",
                  borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 12, fontFamily: "inherit"
                }}
              />
              <button onClick={handleAddSubtask} style={{
                background: "#002855", border: "1px solid #0077b644", borderRadius: 8,
                padding: "8px 14px", color: "#4ea8de", fontSize: 16, cursor: "pointer", fontWeight: 700
              }}>+</button>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 4, borderTop: "1px solid #00285544" }}>
            <button onClick={handleCancel} style={{
              background: "transparent", border: "1px solid #002855", borderRadius: 8,
              padding: "9px 20px", color: "#5390d966", fontSize: 13, cursor: "pointer"
            }}>Cancel</button>
            <button onClick={handleSubmit} style={{
              background: "linear-gradient(135deg, #0077b6, #005a8e)", border: "none", borderRadius: 8,
              padding: "9px 24px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 2px 12px rgba(0,119,182,0.4)"
            }}>{editingId ? "Save Changes" : "Add Task"}</button>
          </div>
        </div>
      )}

      {/* TASK LIST */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 32px 24px" }}>
        {filtered.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: 0.3, marginTop: 60, textAlign: "center" }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#4ea8de" strokeWidth="1.5" style={{ marginBottom: 12 }}>
              <rect x="3" y="3" width="18" height="18" rx="3"/>
              <line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/>
            </svg>
            <p style={{ fontSize: 14, color: "#5390d9" }}>No tasks found</p>
          </div>
        ) : filtered.map(todo => {
          const p = PRIORITY_COLOR[todo.priority];
          const isExpanded = expandedId === todo.id;
          const isDragging = dragId === todo.id;
          const isDragOver = dragOverId === todo.id;
          const completedSubs = todo.subtasks.filter(s => s.completed).length;
          const overdue = isOverdue(todo.dueDate) && !todo.completed;

          return (
            <div
              key={`${todo.id}-${todo.completed}`}
              draggable
              onDragStart={e => onDragStart(e, todo.id)}
              onDragOver={e => onDragOver(e, todo.id)}
              onDrop={e => onDrop(e, todo.id)}
              onDragEnd={onDragEnd}
              style={{
                background: isDragOver ? "#001d33" : "linear-gradient(135deg, #000d1a 0%, #001222 100%)",
                border: `1px solid ${isDragOver ? "#0077b6" : p.border}`,
                borderLeft: `3px solid ${p.text}`,
                borderRadius: 12, marginBottom: 10,
                opacity: isDragging ? 0.4 : 1,
                transition: "all .2s",
                cursor: "grab",
                boxShadow: `0 2px 12px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.02)`,
                transform: todo.completed ? "translateY(0)" : "translateY(0)",
                animation: "taskSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
              }}
            > 
              {/* MAIN ROW */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px" }}>

                {/* Drag handle */}
                <div style={{ display: "flex", flexDirection: "column", gap: 3, flexShrink: 0, opacity: 0.3 }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ display: "flex", gap: 3 }}>
                      <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#5390d9" }}/>
                      <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#5390d9" }}/>
                    </div>
                  ))}
                </div>

                {/* Checkbox */}
                <button onClick={() => toggleComplete(todo.id)} style={{
                  width: 20, height: 20, flexShrink: 0, borderRadius: 6, cursor: "pointer",
                  border: `2px solid ${todo.completed ? "#0077b6" : "#0077b644"}`,
                  background: todo.completed
                    ? "linear-gradient(135deg, #0077b6, #00b4d8)"
                    : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all .2s"
                }}>
                  {todo.completed && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><polyline points="20,6 9,17 4,12"/></svg>}
                </button>

                {/* Title */}
                <p style={{
                  flex: 1, fontSize: 14, fontWeight: 600,
                  color: todo.completed ? "#5390d944" : "#e8f4fd",
                  textDecoration: todo.completed ? "line-through" : "none",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                }}>{todo.text}</p>

                {/* Due date */}
                {todo.dueDate && (
                  <span style={{
                    fontSize: 11, fontWeight: 500, flexShrink: 0, padding: "3px 8px",
                    borderRadius: 6, background: overdue ? "#2d0a0a" : "#001529",
                    color: overdue ? "#f87171" : "#5390d9",
                    border: `1px solid ${overdue ? "#f8717133" : "#002855"}`
                  }}>
                    {overdue ? "⚠ " : "📅 "}{new Date(todo.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                )}

                {/* Subtask count */}
                {todo.subtasks.length > 0 && (
                  <span style={{
                    fontSize: 11, color: "#4ea8de", flexShrink: 0,
                    background: "#002855", padding: "3px 8px", borderRadius: 6,
                    border: "1px solid #0077b633"
                  }}>
                    {completedSubs}/{todo.subtasks.length} sub
                  </span>
                )}

                {/* Priority badge */}
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: "4px 10px", borderRadius: 20,
                  background: p.bg, color: p.text, border: `1px solid ${p.border}`,
                  textTransform: "uppercase", letterSpacing: "0.08em", flexShrink: 0
                }}>{p.label}</span>

                {/* Delete */}
                <button
                  onClick={e => { e.stopPropagation(); deleteTodo(todo.id); }}
                  title="Delete task"
                  style={{
                    flexShrink: 0, width: 28, height: 28, borderRadius: 8, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "#2d0a0a", border: "1px solid #f8717133",
                    color: "#f87171", transition: "all .25s"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = "0 0 10px #f8717166, 0 0 20px #f8717122";
                    e.currentTarget.style.borderColor = "#f87171";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = "#f8717133";
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"/>
                    <path d="M8 6V4h8v2"/>
                    <rect x="5" y="6" width="14" height="14" rx="2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                </button>

                {/* Expand toggle */}
                <button onClick={() => setExpandedId(isExpanded ? null : todo.id)} style={{
                  background: "#001529", border: "1px solid #002855", borderRadius: 8,
                  cursor: "pointer", color: "#5390d9", width: 28, height: 28,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s"
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6,9 12,15 18,9"/></svg>
                </button>
              </div>

              {/* EXPANDED */}
              {isExpanded && (
                <div style={{ padding: "0 16px 16px", borderTop: "1px solid #00255544" }}>

                  {/* Notes */}
                  {todo.notes && (
                    <div style={{ marginTop: 12, marginBottom: 12 }}>
                      <p style={{ fontSize: 10, color: "#5390d9", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Notes</p>
                      <p style={{ fontSize: 13, color: "#5390d9cc", lineHeight: 1.6 }}>{todo.notes}</p>
                    </div>
                  )}

                  {/* Lecture link */}
                  {todo.lectureUrl && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, marginTop: todo.notes ? 0 : 12 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 5,
                        background: "#002855", color: "#4ea8de", border: "1px solid #0077b633", flexShrink: 0
                      }}>Lecture</span>
                      <a href={todo.lectureUrl} target="_blank" rel="noopener noreferrer" style={{
                        fontSize: 12, color: "#00b4d8", overflow: "hidden",
                        textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: "none"
                      }} onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
                        onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}>
                        {todo.lectureUrl}
                      </a>
                    </div>
                  )}

                  {/* Subtasks */}
                  {todo.subtasks.length > 0 && (
                    <div style={{ marginBottom: 12, marginTop: (!todo.notes && !todo.lectureUrl) ? 12 : 0 }}>
                      <p style={{ fontSize: 10, color: "#5390d9", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Subtasks</p>
                      {todo.subtasks.map(s => (
                        <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <button onClick={() => toggleSubtask(todo.id, s.id)} style={{
                            width: 15, height: 15, flexShrink: 0, borderRadius: 4, cursor: "pointer",
                            border: `2px solid ${s.completed ? "#0077b6" : "#002855"}`,
                            background: s.completed ? "#0077b6" : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center"
                          }}>
                            {s.completed && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>}
                          </button>
                          <span style={{
                            fontSize: 13, color: s.completed ? "#5390d966" : "#fff",
                            textDecoration: s.completed ? "line-through" : "none"
                          }}>{s.text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <button onClick={() => startEdit(todo)} style={{
                      display: "flex", alignItems: "center", gap: 5,
                      background: "#002855", border: "none", borderRadius: 8,
                      padding: "7px 14px", color: "#4ea8de", fontSize: 12, cursor: "pointer"
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit
                    </button>
                    
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}