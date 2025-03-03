/**
 * 著者リソースのテスト用フィクスチャ
 * 
 * テストで使用する著者データと文書-著者関連データを定義します
 */
import { randomUUID } from 'crypto';
import { Person } from '@prisma/client';

/**
 * テスト用の著者データ
 */
export const testPersons: Person[] = [
  {
    id: randomUUID(),
    last_name: '山田',
    first_name: '太郎',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: randomUUID(),
    last_name: '佐藤',
    first_name: '花子',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: randomUUID(),
    last_name: '鈴木',
    first_name: '一郎',
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: randomUUID(),
    last_name: '田中',
    first_name: null,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: randomUUID(),
    last_name: '高橋',
    first_name: '次郎',
    created_at: new Date(),
    updated_at: new Date(),
  },
];

/**
 * 有効な著者作成リクエストデータ
 */
export const validPersonCreateRequest = {
  last_name: '山田',
  first_name: '太郎',
};

/**
 * 無効な著者作成リクエストデータ（必須フィールドなし）
 */
export const invalidPersonCreateRequest = {
  first_name: '太郎',
};

/**
 * 有効な著者更新リクエストデータ
 */
export const validPersonUpdateRequest = {
  last_name: '新山田',
  first_name: '新太郎',
};

/**
 * 部分的な著者更新リクエストデータ
 */
export const partialPersonUpdateRequest = {
  last_name: '新山田',
};

/**
 * 著者レスポンスのモック
 */
export const mockPersonResponse = {
  id: randomUUID(),
  last_name: '山田',
  first_name: '太郎',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * 複数の著者レスポンスのモック
 */
export const mockMultiplePersons = Array.from({ length: 5 }, (_, i) => ({
  id: randomUUID(),
  last_name: `テスト${i + 1}`,
  first_name: `太郎${i + 1}`,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));

/**
 * テスト用の文書-著者関連データ
 */
export const testDocumentAuthors = (documentIds: string[]) => {
  return testPersons.slice(0, 3).map((person, index) => ({
    person_id: person.id,
    document_id: documentIds[index % documentIds.length],
    order: index + 1,
    person,
    document: {
      id: documentIds[index % documentIds.length],
      title: `テスト文書 ${index + 1}`,
      type: 'paper',
      created_at: new Date(),
      updated_at: new Date(),
    },
  }));
};

/**
 * 有効な文書-著者関連リクエストデータ
 */
export const validDocumentAuthorData = (documentId: string) => ({
  document_id: documentId,
  order: 1,
});

/**
 * 無効な文書-著者関連リクエストデータ（必須フィールドなし）
 */
export const invalidDocumentAuthorData = {
  order: 1,
};

/**
 * 無効な文書-著者関連リクエストデータ（無効な順序）
 */
export const invalidOrderDocumentAuthorData = (documentId: string) => ({
  document_id: documentId,
  order: 0,
}); 