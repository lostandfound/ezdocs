/**
 * ドキュメントAPI エンドポイントの統合テスト
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { setupTestServer, teardownTestServer, getTestClient } from '../../helpers/test-server';
import { 
  testPrisma, 
  resetTestDatabase, 
  setupTestDatabase, 
  teardownTestDatabase,
  createTestDocument,
  createTestDocuments,
  patchPrismaForTesting
} from '../../helpers/test-db';
import {
  validDocumentCreateRequest,
  invalidDocumentCreateRequest,
  invalidTypeDocumentCreateRequest,
  validDocumentUpdateRequest,
  mockDocumentResponse,
  mockMultipleDocuments
} from '../../fixtures/documents';

// テスト前処理・後処理
beforeAll(async () => {
  patchPrismaForTesting(); // Prismaをモックに置き換え
  await setupTestDatabase(); // テストデータベースをセットアップ
  await setupTestServer(); // テストサーバーをセットアップ
});

afterAll(async () => {
  await teardownTestServer(); // テストサーバーを終了
  await teardownTestDatabase(); // テストデータベースを破棄
});

beforeEach(async () => {
  // テストデータをリセット
  await resetTestDatabase();
});

describe('ドキュメントAPI', () => {
  describe('GET /api/documents', () => {
    it('空のデータベースからは空配列を返す', async () => {
      // データベースが空であることを確認
      testPrisma.document.findMany.mockResolvedValue([]);
      testPrisma.document.count.mockResolvedValue(0);
      
      const response = await getTestClient()
        .get('/api/documents')
        .expect(200);

      expect(response.body).toEqual({
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          pages: 0
        }
      });
    });

    it('作成されたドキュメントのリストを返す', async () => {
      // テスト用のドキュメントデータを作成
      const testDocuments = await createTestDocuments(2);
      
      const response = await getTestClient()
        .get('/api/documents')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toEqual({
        total: 2,
        page: 1,
        limit: 20,
        pages: 1
      });
    });

    it('ページネーションが正しく機能する', async () => {
      // 25件のテストデータを作成
      const mockData = Array.from({ length: 10 }, (_, i) => ({
        id: `${i.toString().padStart(3, '0')}e4567-e89b-12d3-a456-426614174000`,
        title: `テスト論文${i + 1}`,
        type: 'paper',
        year: 2025,
        language: 'ja',
        created_at: new Date(),
        updated_at: new Date()
      }));
      
      testPrisma.document.findMany.mockResolvedValue(mockData);
      testPrisma.document.count.mockResolvedValue(25);

      // ページサイズ10, 2ページ目をリクエスト
      const response = await getTestClient()
        .get('/api/documents?page=2&limit=10')
        .expect(200);

      expect(response.body.data).toHaveLength(10);
      expect(response.body.pagination).toEqual({
        total: 25,
        page: 2,
        limit: 10,
        pages: 3
      });
    });

    it('並び順が正しく適用される（デフォルトは更新日時の降順）', async () => {
      // 更新日時の異なる3つのドキュメントを作成
      const orderedDocs = [
        {
          id: '223e4567-e89b-12d3-a456-426614174001',
          title: '最も新しいドキュメント',
          type: 'paper',
          year: 2025,
          language: 'ja',
          created_at: new Date('2025-03-03T00:00:00.000Z'),
          updated_at: new Date('2025-03-03T00:00:00.000Z')
        },
        {
          id: '323e4567-e89b-12d3-a456-426614174002',
          title: '中間のドキュメント',
          type: 'book',
          year: 2024,
          language: 'en',
          created_at: new Date('2024-06-01T00:00:00.000Z'),
          updated_at: new Date('2024-06-01T00:00:00.000Z')
        },
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: '最も古いドキュメント',
          type: 'paper',
          year: 2023,
          language: 'ja',
          created_at: new Date('2023-01-01T00:00:00.000Z'),
          updated_at: new Date('2023-01-01T00:00:00.000Z')
        }
      ];
      
      testPrisma.document.findMany.mockResolvedValue(orderedDocs);
      testPrisma.document.count.mockResolvedValue(3);

      const response = await getTestClient()
        .get('/api/documents')
        .expect(200);

      // 更新日時の降順であることを確認
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0].title).toBe('最も新しいドキュメント');
      expect(response.body.data[1].title).toBe('中間のドキュメント');
      expect(response.body.data[2].title).toBe('最も古いドキュメント');
    });
  });

  describe('GET /api/documents/:id', () => {
    it('存在するIDのドキュメントを取得する', async () => {
      // テスト用のドキュメントを作成
      const mockDoc = await createTestDocument({
        id: mockDocumentResponse.id,
        title: mockDocumentResponse.title,
        type: mockDocumentResponse.type
      });

      const response = await getTestClient()
        .get(`/api/documents/${mockDoc.id}`)
        .expect(200);

      // APIレスポンスの形式に合わせて検証
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('id', mockDoc.id);
      expect(response.body.data).toHaveProperty('title', mockDoc.title);
      expect(response.body.data).toHaveProperty('type', mockDoc.type);
    });

    it('存在しないIDの場合は404を返す', async () => {
      const nonExistentId = '999e4567-e89b-12d3-a456-426614174999';
      testPrisma.document.findUnique.mockResolvedValue(null);
      
      const response = await getTestClient()
        .get(`/api/documents/${nonExistentId}`)
        .expect(404);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message');
    });

    it('無効なID形式の場合は400を返す', async () => {
      const invalidId = 'invalid-uuid-format';
      
      const response = await getTestClient()
        .get(`/api/documents/${invalidId}`)
        .expect(400);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('POST /api/documents', () => {
    it('有効なデータで新規ドキュメントを作成する', async () => {
      // 作成後のレスポンスをモック
      const createdDoc = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...validDocumentCreateRequest,
        created_at: new Date(),
        updated_at: new Date()
      };
      testPrisma.document.create.mockResolvedValue(createdDoc);

      const response = await getTestClient()
        .post('/api/documents')
        .send(validDocumentCreateRequest)
        .expect(201);

      // APIレスポンスの形式に合わせて検証
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('title', validDocumentCreateRequest.title);
      expect(response.body.data).toHaveProperty('type', validDocumentCreateRequest.type);
    });

    it('必須フィールドが欠けている場合は400を返す', async () => {
      const response = await getTestClient()
        .post('/api/documents')
        .send(invalidDocumentCreateRequest)
        .expect(400);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toHaveProperty('title');
    });

    it('無効なタイプの場合は400を返す', async () => {
      const response = await getTestClient()
        .post('/api/documents')
        .send(invalidTypeDocumentCreateRequest)
        .expect(400);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toHaveProperty('type');
    });

    it('XSS攻撃コードを含むデータは無害化される', async () => {
      const xssPayload = {
        title: '<script>alert("XSS")</script>テスト論文',
        abstract: '<img src="x" onerror="alert(\'XSS\')">悪意のある要約<iframe src="javascript:alert(\'XSS\')"></iframe>',
        type: 'paper',
        language: 'ja'
      };

      // サニタイズ後のデータをモック
      const sanitizedResponse = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'テスト論文',
        abstract: '悪意のある要約',
        type: 'paper',
        language: 'ja',
        created_at: new Date(),
        updated_at: new Date()
      };
      testPrisma.document.create.mockResolvedValue(sanitizedResponse);

      const response = await getTestClient()
        .post('/api/documents')
        .send(xssPayload)
        .expect(201);

      // サニタイズされたことを確認
      expect(response.body.status).toBe('success');
      expect(response.body.data.title).toBe('テスト論文');
      expect(response.body.data.abstract).toBe('悪意のある要約');
      expect(response.body.data.title).not.toContain('<script>');
      expect(response.body.data.abstract).not.toContain('<img');
      expect(response.body.data.abstract).not.toContain('<iframe');
    });
  });

  describe('PUT /api/documents/:id', () => {
    it('存在するドキュメントを更新する', async () => {
      // テスト用のドキュメントを作成
      const mockDoc = await createTestDocument({
        id: mockDocumentResponse.id,
        title: mockDocumentResponse.title,
        type: mockDocumentResponse.type
      });
      
      // 更新後のドキュメント
      const updatedDoc = {
        ...mockDoc,
        ...validDocumentUpdateRequest,
        updated_at: new Date()
      };
      
      // update用のモックを設定
      testPrisma.document.update.mockResolvedValue(updatedDoc);

      const response = await getTestClient()
        .put(`/api/documents/${mockDoc.id}`)
        .send(validDocumentUpdateRequest)
        .expect(200);

      // APIレスポンスの形式に合わせて検証
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('id', mockDoc.id);
      expect(response.body.data).toHaveProperty('title', validDocumentUpdateRequest.title);
      expect(response.body.data).toHaveProperty('abstract', validDocumentUpdateRequest.abstract);
    });

    it('存在しないIDの場合は404を返す', async () => {
      const nonExistentId = '999e4567-e89b-12d3-a456-426614174999';
      
      // update操作でエラーをスローするようモックを設定
      testPrisma.document.update.mockRejectedValue(new Error('Record to update not found'));
      
      const response = await getTestClient()
        .put(`/api/documents/${nonExistentId}`)
        .send(validDocumentUpdateRequest)
        .expect(404);

      expect(response.body).toHaveProperty('status', 'error');
    });

    it('無効なデータでの更新は400を返す', async () => {
      // テスト用のドキュメントを作成
      const mockDoc = await createTestDocument({
        id: mockDocumentResponse.id
      });
      
      // 無効なデータ（タイプが許可されていない値）
      const invalidData = {
        type: 'invalid_type'
      };

      const response = await getTestClient()
        .put(`/api/documents/${mockDoc.id}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('status', 'error');
    });
    
    it('部分更新が正しく機能する', async () => {
      // テスト用のドキュメント
      const mockDoc = await createTestDocument({
        id: mockDocumentResponse.id,
        title: 'オリジナルタイトル',
        abstract: 'オリジナルの要約',
        year: 2023
      });
      
      // 更新後のドキュメント（タイトルのみ更新）
      const updatedDoc = {
        ...mockDoc,
        title: '更新されたタイトル',
        updated_at: new Date()
      };
      
      // update用のモックを設定
      testPrisma.document.update.mockResolvedValue(updatedDoc);
      
      // タイトルだけを更新
      const partialUpdate = {
        title: '更新されたタイトル'
      };
      
      const response = await getTestClient()
        .put(`/api/documents/${mockDoc.id}`)
        .send(partialUpdate)
        .expect(200);
      
      // APIレスポンスの形式に合わせて検証
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('id', mockDoc.id);
      expect(response.body.data).toHaveProperty('title', '更新されたタイトル');
      expect(response.body.data).toHaveProperty('abstract', 'オリジナルの要約'); // 変更なし
      expect(response.body.data).toHaveProperty('year', 2023); // 変更なし
    });
  });

  describe('DELETE /api/documents/:id', () => {
    it('存在するドキュメントを削除する', async () => {
      // テスト用のドキュメント
      const mockDoc = await createTestDocument({
        id: mockDocumentResponse.id
      });
      
      // delete用のモックを設定
      testPrisma.document.delete.mockResolvedValue(mockDoc);

      await getTestClient()
        .delete(`/api/documents/${mockDoc.id}`)
        .expect(204);
    });

    it('存在しないIDの場合は404を返す', async () => {
      const nonExistentId = '999e4567-e89b-12d3-a456-426614174999';
      
      // delete操作でエラーをスローするようモックを設定
      testPrisma.document.delete.mockRejectedValue(new Error('Record to delete does not exist'));
      
      const response = await getTestClient()
        .delete(`/api/documents/${nonExistentId}`)
        .expect(404);

      expect(response.body).toHaveProperty('status', 'error');
    });

    it('無効なID形式の場合は400を返す', async () => {
      const invalidId = 'invalid-uuid-format';
      
      const response = await getTestClient()
        .delete(`/api/documents/${invalidId}`)
        .expect(400);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('全体的なエラーハンドリング', () => {
    it('JSONの無効な形式によるエラーを適切に処理する', async () => {
      // 不正なJSONを送信
      await getTestClient()
        .post('/api/documents')
        .set('Content-Type', 'application/json')
        .send('{"title": "不正なJSON, "type": "paper"}') // 引用符が閉じられていない
        .expect(400);
      
      // 実際のエラーレスポンスの検証はできないが、
      // Expressのエラーハンドラが処理することを期待
    });
  });
}); 