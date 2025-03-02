/**
 * テスト全体の初期設定を行うファイル
 * Vitestがテスト実行前に自動的にこのファイルを読み込みます
 */
import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import { setupTestDatabase, teardownTestDatabase, resetTestDatabase } from './helpers/test-db';

// 環境変数を設定
process.env.NODE_ENV = 'test';

// console.logなどをモック化（必要に応じてコメントアウトを外す）
// vi.spyOn(console, 'log').mockImplementation(() => undefined);
// vi.spyOn(console, 'error').mockImplementation(() => undefined);

// 時間関連の関数をモック化
vi.mock('node:timers', () => ({
  setTimeout: vi.fn((cb) => cb()),
  setInterval: vi.fn(),
  clearTimeout: vi.fn(),
  clearInterval: vi.fn()
}));

// APIミドルウェアをモック化
vi.mock('../src/middleware/validate', () => ({
  validate: () => (req, res, next) => next()
}));

vi.mock('../src/middleware/sanitize', () => ({
  sanitize: () => (req, res, next) => next()
}));

// テスト全体の前処理（一度だけ実行）
beforeAll(async () => {
  // テスト用データベースのセットアップ
  await setupTestDatabase();
});

// 各テスト後の処理
afterEach(async () => {
  // テストごとにデータベースをリセット
  await resetTestDatabase();
  
  // すべてのモックをリセット
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

// テスト全体の後処理（一度だけ実行）
afterAll(async () => {
  // テスト用データベースの破棄
  await teardownTestDatabase();
}); 