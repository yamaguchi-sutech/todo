import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTodos } from './useTodos';

// localStorage をモック
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// crypto.randomUUID をモック（テスト用の決定論的な値）
let uuidCounter = 0;
vi.stubGlobal('crypto', {
  randomUUID: () => `test-id-${++uuidCounter}`,
});

describe('useTodos', () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  describe('addTodo', () => {
    it('テキストを渡すとTodoが追加される', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo('買い物');
      });

      expect(result.current.todos).toHaveLength(1);
      expect(result.current.todos[0].text).toBe('買い物');
      expect(result.current.todos[0].completed).toBe(false);
    });

    it('前後の空白はトリムされる', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo('  タスク  ');
      });

      expect(result.current.todos[0].text).toBe('タスク');
    });

    it('空文字列ではTodoが追加されない', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo('');
      });

      expect(result.current.todos).toHaveLength(0);
    });

    it('空白のみの文字列ではTodoが追加されない', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo('   ');
      });

      expect(result.current.todos).toHaveLength(0);
    });

    it('追加したTodoは先頭に追加される', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo('最初');
      });
      act(() => {
        result.current.addTodo('最後');
      });

      expect(result.current.todos[0].text).toBe('最後');
      expect(result.current.todos[1].text).toBe('最初');
    });
  });

  describe('toggleTodo', () => {
    it('未完了のTodoを完了にできる', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo('タスク');
      });
      const id = result.current.todos[0].id;

      act(() => {
        result.current.toggleTodo(id);
      });

      expect(result.current.todos[0].completed).toBe(true);
    });

    it('完了済みのTodoを未完了に戻せる', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo('タスク');
      });
      const id = result.current.todos[0].id;

      act(() => {
        result.current.toggleTodo(id);
      });
      act(() => {
        result.current.toggleTodo(id);
      });

      expect(result.current.todos[0].completed).toBe(false);
    });

    it('対象のTodoのみ変更される', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo('タスクA');
        result.current.addTodo('タスクB');
      });
      const idB = result.current.todos[0].id; // 先頭がB（後に追加）

      act(() => {
        result.current.toggleTodo(idB);
      });

      expect(result.current.todos[0].completed).toBe(true);
      expect(result.current.todos[1].completed).toBe(false);
    });
  });

  describe('deleteTodo', () => {
    it('指定したTodoが削除される', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo('削除するタスク');
      });
      const id = result.current.todos[0].id;

      act(() => {
        result.current.deleteTodo(id);
      });

      expect(result.current.todos).toHaveLength(0);
    });

    it('対象のTodoのみ削除される', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo('残るタスク');
        result.current.addTodo('削除するタスク');
      });
      const deleteId = result.current.todos[0].id; // 先頭（削除するタスク）

      act(() => {
        result.current.deleteTodo(deleteId);
      });

      expect(result.current.todos).toHaveLength(1);
      expect(result.current.todos[0].text).toBe('残るタスク');
    });
  });

  describe('editTodo', () => {
    it('テキストを編集できる', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo('元のテキスト');
      });
      const id = result.current.todos[0].id;

      act(() => {
        result.current.editTodo(id, '変更後のテキスト');
      });

      expect(result.current.todos[0].text).toBe('変更後のテキスト');
    });

    it('編集テキストの前後空白はトリムされる', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo('タスク');
      });
      const id = result.current.todos[0].id;

      act(() => {
        result.current.editTodo(id, '  新しいテキスト  ');
      });

      expect(result.current.todos[0].text).toBe('新しいテキスト');
    });

    it('空文字列では更新されない', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo('元のテキスト');
      });
      const id = result.current.todos[0].id;

      act(() => {
        result.current.editTodo(id, '');
      });

      expect(result.current.todos[0].text).toBe('元のテキスト');
    });
  });

  describe('clearCompleted', () => {
    it('完了済みのTodoがすべて削除される', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo('未完了タスク');
        result.current.addTodo('完了タスク');
      });
      const completedId = result.current.todos[0].id;

      act(() => {
        result.current.toggleTodo(completedId);
      });
      act(() => {
        result.current.clearCompleted();
      });

      expect(result.current.todos).toHaveLength(1);
      expect(result.current.todos[0].text).toBe('未完了タスク');
    });

    it('完了済みがない場合は何も変わらない', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo('タスクA');
        result.current.addTodo('タスクB');
      });

      act(() => {
        result.current.clearCompleted();
      });

      expect(result.current.todos).toHaveLength(2);
    });
  });

  describe('toggleAll', () => {
    it('すべて未完了の場合、全件完了になる', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo('タスクA');
        result.current.addTodo('タスクB');
      });

      act(() => {
        result.current.toggleAll();
      });

      expect(result.current.todos.every(t => t.completed)).toBe(true);
    });

    it('すべて完了の場合、全件未完了になる', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo('タスクA');
        result.current.addTodo('タスクB');
      });

      // 全件完了にする
      act(() => {
        result.current.toggleAll();
      });
      // 全件未完了に戻す
      act(() => {
        result.current.toggleAll();
      });

      expect(result.current.todos.every(t => !t.completed)).toBe(true);
    });

    it('一部完了の場合、全件完了になる', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo('タスクA');
        result.current.addTodo('タスクB');
      });
      const firstId = result.current.todos[0].id;

      act(() => {
        result.current.toggleTodo(firstId);
      });
      act(() => {
        result.current.toggleAll();
      });

      expect(result.current.todos.every(t => t.completed)).toBe(true);
    });
  });

  describe('フィルター', () => {
    it('allフィルターではすべてのTodoが表示される', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo('未完了');
        result.current.addTodo('完了済み');
      });
      const completedId = result.current.todos[0].id;

      act(() => {
        result.current.toggleTodo(completedId);
        result.current.setFilter('all');
      });

      expect(result.current.todos).toHaveLength(2);
    });

    it('activeフィルターでは未完了のTodoのみ表示される', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo('未完了');
        result.current.addTodo('完了済み');
      });
      const completedId = result.current.todos[0].id;

      act(() => {
        result.current.toggleTodo(completedId);
        result.current.setFilter('active');
      });

      expect(result.current.todos).toHaveLength(1);
      expect(result.current.todos[0].text).toBe('未完了');
    });

    it('completedフィルターでは完了済みのTodoのみ表示される', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo('未完了');
        result.current.addTodo('完了済み');
      });
      const completedId = result.current.todos[0].id;

      act(() => {
        result.current.toggleTodo(completedId);
        result.current.setFilter('completed');
      });

      expect(result.current.todos).toHaveLength(1);
      expect(result.current.todos[0].text).toBe('完了済み');
    });
  });

  describe('カウント', () => {
    it('activeCountは未完了のTodo数を返す', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo('A');
        result.current.addTodo('B');
        result.current.addTodo('C');
      });
      const idA = result.current.todos[2].id;

      act(() => {
        result.current.toggleTodo(idA);
      });

      expect(result.current.activeCount).toBe(2);
    });

    it('completedCountは完了済みのTodo数を返す', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo('A');
        result.current.addTodo('B');
      });
      const idB = result.current.todos[0].id;

      act(() => {
        result.current.toggleTodo(idB);
      });

      expect(result.current.completedCount).toBe(1);
    });

    it('totalCountはフィルターに関わらず全件数を返す', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo('A');
        result.current.addTodo('B');
        result.current.addTodo('C');
      });
      const idA = result.current.todos[2].id;

      act(() => {
        result.current.toggleTodo(idA);
        result.current.setFilter('active');
      });

      expect(result.current.totalCount).toBe(3);
    });
  });

  describe('localStorage連携', () => {
    it('Todoの追加がlocalStorageに保存される', () => {
      const { result } = renderHook(() => useTodos());

      act(() => {
        result.current.addTodo('保存テスト');
      });

      const stored = JSON.parse(localStorageMock.getItem('todos') ?? '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0].text).toBe('保存テスト');
    });

    it('ページロード時にlocalStorageからTodoが復元される', () => {
      const initial = [
        { id: 'saved-id', text: '保存済みタスク', completed: false, createdAt: 1000 },
      ];
      localStorageMock.setItem('todos', JSON.stringify(initial));

      const { result } = renderHook(() => useTodos());

      expect(result.current.todos[0].text).toBe('保存済みタスク');
    });
  });
});
