import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // グローバルなテスト設定
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['./tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    
    // テスト実行前に環境変数をテスト用に設定
    env: {
      NODE_ENV: 'test',
    },
    
    // カバレッジ設定
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'tests/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/types/**',
      ],
    },
  },
  resolve: {
    // TypeScriptのパス解決を設定
    alias: {
      '@': path.resolve(__dirname, './src')
    },
  },
}); 