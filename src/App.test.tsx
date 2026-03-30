import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

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

let uuidCounter = 0;
vi.stubGlobal('crypto', {
  randomUUID: () => `test-uuid-${++uuidCounter}`,
});

describe('App', () => {
  beforeEach(() => {
    localStorageMock.clear();
    uuidCounter = 0;
  });

  describe('初期表示', () => {
    it('ヘッダータイトルが表示される', () => {
      render(<App />);
      expect(screen.getByRole('heading', { name: 'Todo' })).toBeInTheDocument();
    });

    it('Todoが0件の場合、空の状態メッセージが表示される', () => {
      render(<App />);
      expect(screen.getByText('タスクがありません')).toBeInTheDocument();
      expect(screen.getByText('上のフォームから追加してください')).toBeInTheDocument();
    });

    it('入力フォームが表示される', () => {
      render(<App />);
      expect(screen.getByPlaceholderText('新しいタスクを入力...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '追加' })).toBeInTheDocument();
    });

    it('追加ボタンは空入力時に無効化されている', () => {
      render(<App />);
      expect(screen.getByRole('button', { name: '追加' })).toBeDisabled();
    });
  });

  describe('Todoの追加', () => {
    it('テキストを入力して追加ボタンを押すとTodoが追加される', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.type(screen.getByPlaceholderText('新しいタスクを入力...'), '買い物');
      await user.click(screen.getByRole('button', { name: '追加' }));

      expect(screen.getByText('買い物')).toBeInTheDocument();
    });

    it('Enterキーでもtodoが追加される', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.type(screen.getByPlaceholderText('新しいタスクを入力...'), '掃除{Enter}');

      expect(screen.getByText('掃除')).toBeInTheDocument();
    });

    it('追加後に入力フィールドがクリアされる', async () => {
      const user = userEvent.setup();
      render(<App />);

      const input = screen.getByPlaceholderText('新しいタスクを入力...');
      await user.type(input, '洗濯');
      await user.click(screen.getByRole('button', { name: '追加' }));

      expect(input).toHaveValue('');
    });

    it('空白のみの入力ではTodoが追加されない', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.type(screen.getByPlaceholderText('新しいタスクを入力...'), '   ');

      expect(screen.getByRole('button', { name: '追加' })).toBeDisabled();
    });

    it('Todoを追加するとリストとフッターが表示される', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.type(screen.getByPlaceholderText('新しいタスクを入力...'), 'タスク{Enter}');

      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getByText('残り 1 件')).toBeInTheDocument();
    });
  });

  describe('Todoの完了切り替え', () => {
    it('チェックボタンを押すとTodoが完了になる', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.type(screen.getByPlaceholderText('新しいタスクを入力...'), 'タスク{Enter}');

      const checkBtn = screen.getByRole('button', { name: '完了にする' });
      await user.click(checkBtn);

      expect(screen.getByRole('button', { name: '未完了に戻す' })).toBeInTheDocument();
      expect(screen.getByText('すべて完了！')).toBeInTheDocument();
    });

    it('完了済みのTodoをクリックすると未完了に戻る', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.type(screen.getByPlaceholderText('新しいタスクを入力...'), 'タスク{Enter}');
      await user.click(screen.getByRole('button', { name: '完了にする' }));
      await user.click(screen.getByRole('button', { name: '未完了に戻す' }));

      expect(screen.getByRole('button', { name: '完了にする' })).toBeInTheDocument();
      expect(screen.getByText('残り 1 件')).toBeInTheDocument();
    });
  });

  describe('Todoの削除', () => {
    it('削除ボタンを押すとTodoが削除される', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.type(screen.getByPlaceholderText('新しいタスクを入力...'), '削除するタスク{Enter}');
      await user.click(screen.getByRole('button', { name: '削除' }));

      expect(screen.queryByText('削除するタスク')).not.toBeInTheDocument();
    });

    it('全件削除すると空の状態に戻る', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.type(screen.getByPlaceholderText('新しいタスクを入力...'), 'タスク{Enter}');
      await user.click(screen.getByRole('button', { name: '削除' }));

      expect(screen.getByText('タスクがありません')).toBeInTheDocument();
    });
  });

  describe('Todoの編集', () => {
    it('編集ボタンを押すと編集モードになる', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.type(screen.getByPlaceholderText('新しいタスクを入力...'), '元のテキスト{Enter}');
      await user.click(screen.getByRole('button', { name: '編集' }));

      expect(screen.getByDisplayValue('元のテキスト')).toBeInTheDocument();
    });

    it('テキストをダブルクリックすると編集モードになる', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.type(screen.getByPlaceholderText('新しいタスクを入力...'), 'ダブルクリック{Enter}');
      await user.dblClick(screen.getByText('ダブルクリック'));

      expect(screen.getByDisplayValue('ダブルクリック')).toBeInTheDocument();
    });

    it('編集してEnterキーで確定できる', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.type(screen.getByPlaceholderText('新しいタスクを入力...'), '元のテキスト{Enter}');
      await user.click(screen.getByRole('button', { name: '編集' }));

      const editInput = screen.getByDisplayValue('元のテキスト');
      await user.clear(editInput);
      await user.type(editInput, '変更後{Enter}');

      expect(screen.getByText('変更後')).toBeInTheDocument();
      expect(screen.queryByText('元のテキスト')).not.toBeInTheDocument();
    });

    it('Escapeキーで編集をキャンセルできる', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.type(screen.getByPlaceholderText('新しいタスクを入力...'), '元のテキスト{Enter}');
      await user.click(screen.getByRole('button', { name: '編集' }));

      const editInput = screen.getByDisplayValue('元のテキスト');
      await user.clear(editInput);
      await user.type(editInput, '途中の入力{Escape}');

      expect(screen.getByText('元のテキスト')).toBeInTheDocument();
    });
  });

  describe('フィルター', () => {
    it('デフォルトは「すべて」フィルターでアクティブ', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.type(screen.getByPlaceholderText('新しいタスクを入力...'), 'タスク{Enter}');

      const allBtn = screen.getByRole('button', { name: 'すべて' });
      expect(allBtn).toHaveClass('active');
    });

    it('「未完了」フィルターで未完了のTodoのみ表示される', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.type(screen.getByPlaceholderText('新しいタスクを入力...'), '未完了{Enter}');
      await user.type(screen.getByPlaceholderText('新しいタスクを入力...'), '完了済み{Enter}');

      // 完了済みのTodoをトグル（先頭＝完了済み）
      const checkBtns = screen.getAllByRole('button', { name: '完了にする' });
      await user.click(checkBtns[0]);

      await user.click(screen.getByRole('button', { name: '未完了' }));

      const list = screen.getByRole('list');
      expect(within(list).getByText('未完了')).toBeInTheDocument();
      expect(within(list).queryByText('完了済み')).not.toBeInTheDocument();
    });

    it('「完了済み」フィルターで完了済みのTodoのみ表示される', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.type(screen.getByPlaceholderText('新しいタスクを入力...'), '未完了{Enter}');
      await user.type(screen.getByPlaceholderText('新しいタスクを入力...'), '完了済み{Enter}');

      const checkBtns = screen.getAllByRole('button', { name: '完了にする' });
      await user.click(checkBtns[0]);

      await user.click(screen.getByRole('button', { name: '完了済み' }));

      const list = screen.getByRole('list');
      expect(within(list).getByText('完了済み')).toBeInTheDocument();
      expect(within(list).queryByText('未完了')).not.toBeInTheDocument();
    });
  });

  describe('完了済みを削除', () => {
    it('完了済みのTodoがある場合、「完了済みを削除」ボタンが表示される', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.type(screen.getByPlaceholderText('新しいタスクを入力...'), 'タスク{Enter}');
      await user.click(screen.getByRole('button', { name: '完了にする' }));

      expect(screen.getByRole('button', { name: '完了済みを削除' })).toBeInTheDocument();
    });

    it('「完了済みを削除」ボタンで完了済みTodoが削除される', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.type(screen.getByPlaceholderText('新しいタスクを入力...'), '残るタスク{Enter}');
      await user.type(screen.getByPlaceholderText('新しいタスクを入力...'), '削除されるタスク{Enter}');

      const checkBtns = screen.getAllByRole('button', { name: '完了にする' });
      await user.click(checkBtns[0]);

      await user.click(screen.getByRole('button', { name: '完了済みを削除' }));

      expect(screen.queryByText('削除されるタスク')).not.toBeInTheDocument();
      expect(screen.getByText('残るタスク')).toBeInTheDocument();
    });

    it('完了済みがない場合、「完了済みを削除」ボタンが表示されない', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.type(screen.getByPlaceholderText('新しいタスクを入力...'), 'タスク{Enter}');

      expect(screen.queryByRole('button', { name: '完了済みを削除' })).not.toBeInTheDocument();
    });
  });

  describe('すべて切り替えボタン', () => {
    it('Todoが1件以上ある場合、切り替えボタンが表示される', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.type(screen.getByPlaceholderText('新しいタスクを入力...'), 'タスク{Enter}');

      expect(screen.getByRole('button', { name: 'すべて完了/未完了' })).toBeInTheDocument();
    });

    it('ボタンを押すと全件完了になる', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.type(screen.getByPlaceholderText('新しいタスクを入力...'), 'A{Enter}');
      await user.type(screen.getByPlaceholderText('新しいタスクを入力...'), 'B{Enter}');

      await user.click(screen.getByRole('button', { name: 'すべて完了/未完了' }));

      expect(screen.getAllByRole('button', { name: '未完了に戻す' })).toHaveLength(2);
    });

    it('全件完了の状態でボタンを押すと全件未完了になる', async () => {
      const user = userEvent.setup();
      render(<App />);

      await user.type(screen.getByPlaceholderText('新しいタスクを入力...'), 'A{Enter}');
      await user.type(screen.getByPlaceholderText('新しいタスクを入力...'), 'B{Enter}');

      // 全件完了
      await user.click(screen.getByRole('button', { name: 'すべて完了/未完了' }));
      // 全件未完了に戻す
      await user.click(screen.getByRole('button', { name: 'すべて完了/未完了' }));

      expect(screen.getAllByRole('button', { name: '完了にする' })).toHaveLength(2);
    });
  });
});
