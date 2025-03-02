/**
 * テスト用の文書データ
 */

// 文書作成リクエスト用データ
export const validDocumentCreateRequest = {
  title: "テスト論文",
  type: "paper",
  abstract: "これはテスト用の論文要約です。",
  year: 2025,
  month: 3,
  day: 3,
  pages: "1-15",
  volume: "26",
  issue: "5",
  source: "テストジャーナル",
  publisher: "テスト出版社",
  language: "ja",
  identifiers: JSON.stringify({ doi: "10.1234/5678", isbn: "978-4-1234-5678-9" }),
  urls: JSON.stringify({ publisher: "https://example.com/paper" }),
  keywords: JSON.stringify({ keywords: ["テスト", "論文", "自動化"] }),
  ai_keywords: JSON.stringify({ keywords: ["AI", "自動生成"] })
};

// 不正な文書作成リクエスト（タイトルなし）
export const invalidDocumentCreateRequest = {
  // titleフィールドがない - 必須フィールド
  type: "paper",
  abstract: "これはテスト用の論文要約です。",
  year: 2025
};

// 不正な文書作成リクエスト（無効なタイプ）
export const invalidTypeDocumentCreateRequest = {
  title: "テスト論文",
  type: "invalid_type", // 許可されていないタイプ
  abstract: "これはテスト用の論文要約です。",
  year: 2025
};

// 文書更新リクエスト用データ
export const validDocumentUpdateRequest = {
  title: "更新されたテスト論文",
  abstract: "これは更新された論文要約です。",
  year: 2025,
  keywords: JSON.stringify({ keywords: ["更新", "テスト"] })
};

// DBからのレスポンス用サンプルデータ
export const mockDocumentResponse = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  title: "テスト論文",
  type: "paper",
  abstract: "これはテスト用の論文要約です。",
  ai_summary: "AIが生成した要約です。",
  year: 2025,
  month: 3,
  day: 3,
  pages: "1-15",
  volume: "26",
  issue: "5",
  source: "テストジャーナル",
  publisher: "テスト出版社",
  language: "ja",
  identifiers: JSON.stringify({ doi: "10.1234/5678", isbn: "978-4-1234-5678-9" }),
  urls: JSON.stringify({ publisher: "https://example.com/paper" }),
  keywords: JSON.stringify({ keywords: ["テスト", "論文", "自動化"] }),
  ai_keywords: JSON.stringify({ keywords: ["AI", "自動生成"] }),
  created_at: new Date("2025-03-03T09:00:00.000Z"),
  updated_at: new Date("2025-03-03T09:00:00.000Z")
};

// 複数の文書データ（一覧取得テスト用）
export const mockMultipleDocuments = [
  {
    id: "123e4567-e89b-12d3-a456-426614174000",
    title: "テスト論文1",
    type: "paper",
    year: 2025,
    language: "ja",
    created_at: new Date("2025-03-03T09:00:00.000Z"),
    updated_at: new Date("2025-03-03T09:00:00.000Z")
  },
  {
    id: "223e4567-e89b-12d3-a456-426614174001",
    title: "テスト論文2",
    type: "paper",
    year: 2025,
    language: "ja",
    created_at: new Date("2025-03-03T10:00:00.000Z"),
    updated_at: new Date("2025-03-03T10:00:00.000Z")
  },
  {
    id: "323e4567-e89b-12d3-a456-426614174002",
    title: "テスト書籍",
    type: "book",
    year: 2024,
    language: "en",
    created_at: new Date("2025-03-02T09:00:00.000Z"),
    updated_at: new Date("2025-03-02T09:00:00.000Z")
  }
]; 