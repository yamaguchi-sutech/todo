import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { useTodos } from './useTodos';
import type { Todo, Filter } from './types';
import './App.css';

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function TodoItem({
  todo,
  onToggle,
  onDelete,
  onEdit,
}: {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commitEdit = () => {
    if (editText.trim()) {
      onEdit(todo.id, editText);
    } else {
      setEditText(todo.text);
    }
    setEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') {
      setEditText(todo.text);
      setEditing(false);
    }
  };

  return (
    <li className={`todo-item${todo.completed ? ' completed' : ''}${editing ? ' editing' : ''}`}>
      {editing ? (
        <input
          ref={inputRef}
          className="edit-input"
          value={editText}
          onChange={e => setEditText(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <>
          <button
            className={`check-btn${todo.completed ? ' checked' : ''}`}
            onClick={() => onToggle(todo.id)}
            aria-label={todo.completed ? '未完了に戻す' : '完了にする'}
          >
            {todo.completed && <CheckIcon />}
          </button>
          <span className="todo-text" onDoubleClick={() => setEditing(true)}>
            {todo.text}
          </span>
          <div className="todo-actions">
            <button className="icon-btn edit-btn" onClick={() => setEditing(true)} aria-label="編集">
              <EditIcon />
            </button>
            <button className="icon-btn delete-btn" onClick={() => onDelete(todo.id)} aria-label="削除">
              <TrashIcon />
            </button>
          </div>
        </>
      )}
    </li>
  );
}

const FILTER_LABELS: Record<Filter, string> = {
  all: 'すべて',
  active: '未完了',
  completed: '完了済み',
};

export default function App() {
  const {
    todos,
    filter,
    setFilter,
    addTodo,
    toggleTodo,
    deleteTodo,
    editTodo,
    clearCompleted,
    toggleAll,
    activeCount,
    completedCount,
    totalCount,
  } = useTodos();

  const [input, setInput] = useState('');

  const handleAdd = () => {
    addTodo(input);
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleAdd();
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Todo</h1>
        <p className="subtitle">シンプルなタスク管理</p>
      </header>

      <main className="main">
        <div className="input-row">
          {totalCount > 0 && (
            <button
              className={`toggle-all-btn${activeCount === 0 ? ' all-done' : ''}`}
              onClick={toggleAll}
              title="すべて切り替え"
              aria-label="すべて完了/未完了"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          )}
          <input
            className="add-input"
            placeholder="新しいタスクを入力..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="add-btn" onClick={handleAdd} disabled={!input.trim()}>
            追加
          </button>
        </div>

        {totalCount > 0 && (
          <>
            <ul className="todo-list">
              {todos.map(todo => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={toggleTodo}
                  onDelete={deleteTodo}
                  onEdit={editTodo}
                />
              ))}
              {todos.length === 0 && (
                <li className="empty-state">該当するタスクはありません</li>
              )}
            </ul>

            <footer className="footer">
              <span className="count">
                {activeCount > 0 ? `残り ${activeCount} 件` : 'すべて完了！'}
              </span>
              <div className="filters">
                {(Object.keys(FILTER_LABELS) as Filter[]).map(f => (
                  <button
                    key={f}
                    className={`filter-btn${filter === f ? ' active' : ''}`}
                    onClick={() => setFilter(f)}
                  >
                    {FILTER_LABELS[f]}
                  </button>
                ))}
              </div>
              {completedCount > 0 && (
                <button className="clear-btn" onClick={clearCompleted}>
                  完了済みを削除
                </button>
              )}
            </footer>
          </>
        )}

        {totalCount === 0 && (
          <div className="empty-screen">
            <div className="empty-icon">✓</div>
            <p>タスクがありません</p>
            <p className="empty-hint">上のフォームから追加してください</p>
          </div>
        )}
      </main>
    </div>
  );
}
