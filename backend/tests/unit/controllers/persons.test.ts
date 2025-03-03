/**
 * 著者リソースのコントローラーテスト
 * 
 * 著者リソースに関連するコントローラー関数をテストします
 */
import { describe, it, expect, beforeEach, vi, afterEach, type Mock } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import * as personsController from '../../../src/api/controllers/persons';
import * as personsService from '../../../src/services/persons';
import { testPersons } from '../../fixtures/persons';
import { randomUUID } from 'crypto';
import { Person } from '@prisma/client';
import { IdParam } from '../../../src/schemas/params';
import { DocumentAuthorDto } from '../../../src/schemas/persons';
import { PersonNotFoundError } from '../../../src/api/controllers/persons';

// personsServiceのモック
vi.mock('../../../src/services/persons', () => ({
  findPersons: vi.fn(),
  findPersonById: vi.fn(),
  createPerson: vi.fn(),
  updatePerson: vi.fn(),
  deletePerson: vi.fn(),
  findPersonDocuments: vi.fn(),
  associatePersonWithDocument: vi.fn(),
  dissociatePersonFromDocument: vi.fn(),
}));

// 型定義
type MockRequest<T = any, U = any> = Partial<Request<T, any, U>>;
type MockResponse = {
  status: Mock;
  json: Mock;
  end: Mock;
};

describe('著者コントローラー', () => {
  // モックリクエスト、レスポンス、ネクスト関数
  let mockReq: MockRequest;
  let mockRes: MockResponse;
  let mockNext: Mock;
  
  beforeEach(() => {
    // レスポンスモックの設定
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      end: vi.fn().mockReturnThis(),
    };
    
    // ネクスト関数モックの設定
    mockNext = vi.fn();
    
    // リクエストモックの初期化
    mockReq = {};
    
    // すべてのモックをリセット
    vi.resetAllMocks();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  describe('getPersons', () => {
    it('正しいステータスコード（200）とレスポンス形式を返す', async () => {
      // モックの設定
      const mockPersons = testPersons;
      const mockTotal = mockPersons.length;
      
      vi.mocked(personsService.findPersons).mockResolvedValue({
        persons: mockPersons,
        total: mockTotal,
      });
      
      mockReq = {
        query: {},
      } as MockRequest;
      
      // 関数の実行
      await personsController.getPersons(
        mockReq as Request,
        mockRes as unknown as Response,
        mockNext
      );
      
      // 検証
      expect(mockRes.json).toHaveBeenCalledWith({
        items: mockPersons,
        pagination: {
          total: mockTotal,
          page: 1,
          limit: 10,
          pages: 1,
        },
      });
    });
    
    it('クエリパラメータを正しく処理する', async () => {
      // モックの設定
      const page = 2;
      const limit = 5;
      const search = 'test';
      const mockPersons = testPersons.slice(0, limit);
      const mockTotal = testPersons.length;
      
      vi.mocked(personsService.findPersons).mockResolvedValue({
        persons: mockPersons,
        total: mockTotal,
      });
      
      mockReq = {
        query: { page: page.toString(), limit: limit.toString(), search },
      } as MockRequest;
      
      // 関数の実行
      await personsController.getPersons(
        mockReq as Request,
        mockRes as unknown as Response,
        mockNext
      );
      
      // 検証
      expect(personsService.findPersons).toHaveBeenCalledWith({
        skip: (page - 1) * limit,
        take: limit,
        searchQuery: search,
      });
      
      expect(mockRes.json).toHaveBeenCalledWith({
        items: mockPersons,
        pagination: {
          total: mockTotal,
          page: page,
          limit: limit,
          pages: Math.ceil(mockTotal / limit),
        },
      });
    });
    
    it('エラーが発生した場合にnext関数を呼び出す', async () => {
      // モックの設定
      const mockError = new Error('テストエラー');
      vi.mocked(personsService.findPersons).mockRejectedValue(mockError);
      
      mockReq = {
        query: {},
      } as MockRequest;
      
      // 関数の実行
      await personsController.getPersons(
        mockReq as Request,
        mockRes as unknown as Response,
        mockNext
      );
      
      // 検証
      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });
  
  describe('getPersonById', () => {
    it('存在するIDの場合に正しいステータスコード（200）とレスポンスを返す', async () => {
      // モックの設定
      const mockPerson = testPersons[0];
      vi.mocked(personsService.findPersonById).mockResolvedValue(mockPerson);
      
      mockReq = {
        params: { id: mockPerson.id },
      } as MockRequest<IdParam>;
      
      // 関数の実行
      await personsController.getPersonById(
        mockReq as Request<IdParam>,
        mockRes as unknown as Response,
        mockNext
      );
      
      // 検証
      expect(personsService.findPersonById).toHaveBeenCalledWith(mockPerson.id);
      expect(mockRes.json).toHaveBeenCalledWith(mockPerson);
    });
    
    it('存在しないIDの場合に正しいステータスコード（404）とエラーレスポンスを返す', async () => {
      // モックの設定
      vi.mocked(personsService.findPersonById).mockResolvedValue(null);
      
      const nonExistentId = 'non-existent-id';
      mockReq = {
        params: { id: nonExistentId },
      } as MockRequest<IdParam>;
      
      // 関数の実行
      await personsController.getPersonById(
        mockReq as Request<IdParam>,
        mockRes as unknown as Response,
        mockNext
      );
      
      // 検証
      expect(personsService.findPersonById).toHaveBeenCalledWith(nonExistentId);
      
      // エラーハンドリングがミドルウェアに委譲されることを検証
      expect(mockNext).toHaveBeenCalledWith(expect.any(PersonNotFoundError));
      // mockRes.statusは呼ばれないはず
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
  
  describe('createPerson', () => {
    it('有効なデータの場合に正しいステータスコード（201）とレスポンスを返す', async () => {
      // モックの設定
      const mockPerson = testPersons[0];
      const createData = {
        last_name: 'テスト',
        first_name: '太郎',
        email: 'test@example.com',
        affiliation: '株式会社テスト',
        role: 'AUTHOR',
      };
      
      vi.mocked(personsService.createPerson).mockResolvedValue(mockPerson);
      
      mockReq = {
        body: createData,
      } as MockRequest<any, typeof createData>;
      
      // 関数の実行
      await personsController.createPerson(
        mockReq as Request,
        mockRes as unknown as Response,
        mockNext
      );
      
      // 検証
      expect(personsService.createPerson).toHaveBeenCalledWith(createData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      // jsonは検証しない
    });
  });
  
  describe('updatePerson', () => {
    it('存在するIDと有効なデータの場合に正しいステータスコード（200）とレスポンスを返す', async () => {
      // モックの設定
      const mockPerson = testPersons[0];
      const updateData = {
        last_name: '更新',
        first_name: '次郎',
        email: 'updated@example.com',
        affiliation: '株式会社更新',
        role: 'AUTHOR',
      };
      
      const updatedPerson = {
        ...mockPerson,
        ...updateData,
      };
      
      vi.mocked(personsService.updatePerson).mockResolvedValue(updatedPerson as Person);
      
      mockReq = {
        params: { id: mockPerson.id },
        body: updateData,
      } as MockRequest<IdParam, typeof updateData>;
      
      // 関数の実行
      await personsController.updatePerson(
        mockReq as Request<IdParam>,
        mockRes as unknown as Response,
        mockNext
      );
      
      // 検証
      expect(personsService.updatePerson).toHaveBeenCalledWith(mockPerson.id, updateData);
      expect(mockRes.json).toHaveBeenCalledWith(updatedPerson);
    });
    
    it('存在しないIDの場合に正しいステータスコード（404）とエラーレスポンスを返す', async () => {
      // モックの設定
      vi.mocked(personsService.updatePerson).mockRejectedValue({
        code: 'P2025',
        isPrismaError: true,
        message: 'Record not found'
      });
      
      const nonExistentId = 'non-existent-id';
      const updateData = {
        last_name: '更新',
        first_name: '次郎',
      };
      
      mockReq = {
        params: { id: nonExistentId },
        body: updateData,
      } as MockRequest<IdParam, typeof updateData>;
      
      // 関数の実行
      await personsController.updatePerson(
        mockReq as Request<IdParam>,
        mockRes as unknown as Response,
        mockNext
      );
      
      // エラーハンドリングがミドルウェアに委譲されることを検証
      expect(mockNext).toHaveBeenCalledWith(expect.any(PersonNotFoundError));
      // mockRes.statusは呼ばれないはず
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
  
  describe('deletePerson', () => {
    it('存在するIDの場合に正しいステータスコード（204）を返す', async () => {
      // モックの設定
      const mockPerson = testPersons[0];
      vi.mocked(personsService.deletePerson).mockResolvedValue(mockPerson);
      
      mockReq = {
        params: { id: mockPerson.id },
      } as MockRequest<IdParam>;
      
      // 関数の実行
      await personsController.deletePerson(
        mockReq as Request<IdParam>,
        mockRes as unknown as Response,
        mockNext
      );
      
      // 検証
      expect(personsService.deletePerson).toHaveBeenCalledWith(mockPerson.id);
      expect(mockRes.status).toHaveBeenCalledWith(204);
      // endは検証しない
    });
    
    it('存在しないIDの場合に正しいステータスコード（404）とエラーレスポンスを返す', async () => {
      // モックの設定
      vi.mocked(personsService.deletePerson).mockRejectedValue({
        code: 'P2025',
        isPrismaError: true,
        message: 'Record not found'
      });
      
      const nonExistentId = 'non-existent-id';
      mockReq = {
        params: { id: nonExistentId },
      } as MockRequest<IdParam>;
      
      // 関数の実行
      await personsController.deletePerson(
        mockReq as Request<IdParam>,
        mockRes as unknown as Response,
        mockNext
      );
      
      // エラーハンドリングがミドルウェアに委譲されることを検証
      expect(mockNext).toHaveBeenCalledWith(expect.any(PersonNotFoundError));
      // mockRes.statusは呼ばれないはず
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
  
  describe('getPersonDocuments', () => {
    it('存在する著者IDの場合に正しいステータスコード（200）とレスポンスを返す', async () => {
      // モックの設定
      const mockPerson = testPersons[0];
      const mockDocuments = [
        { 
          document_id: randomUUID(),
          person_id: mockPerson.id,
          order: 1,
          document: {
            id: randomUUID(),
            title: 'テストドキュメント1'
          }
        },
        { 
          document_id: randomUUID(),
          person_id: mockPerson.id,
          order: 2,
          document: {
            id: randomUUID(),
            title: 'テストドキュメント2'
          }
        }
      ];
      const mockTotal = mockDocuments.length;
      
      vi.mocked(personsService.findPersonDocuments).mockResolvedValue({
        documents: mockDocuments,
        total: mockTotal,
      });
      
      mockReq = {
        params: { id: mockPerson.id },
        query: {},
      } as MockRequest<IdParam>;
      
      // 関数の実行
      await personsController.getPersonDocuments(
        mockReq as Request<IdParam>,
        mockRes as unknown as Response,
        mockNext
      );
      
      // 検証
      expect(personsService.findPersonDocuments).toHaveBeenCalledWith(
        mockPerson.id,
        { page: 1, perPage: 10 }
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        items: mockDocuments,
        pagination: {
          total: mockTotal,
          page: 1,
          limit: 10,
          pages: 1,
        },
      });
    });
  });
  
  describe('associateDocument', () => {
    it('有効なデータの場合に正しいステータスコード（201）とレスポンスを返す', async () => {
      // モックの設定
      const mockPerson = testPersons[0];
      const documentId = randomUUID();
      const mockDocumentAuthor = {
        person_id: mockPerson.id,
        document_id: documentId,
        order: 1,
      };
      
      vi.mocked(personsService.associatePersonWithDocument).mockResolvedValue(mockDocumentAuthor as any);
      
      mockReq = {
        params: { id: mockPerson.id },
        body: {
          document_id: documentId,
          order: 1,
        },
      } as MockRequest<IdParam>;
      
      // 関数の実行
      await personsController.associateDocument(
        mockReq as Request<IdParam>,
        mockRes as unknown as Response,
        mockNext
      );
      
      // 検証
      expect(mockRes.status).toHaveBeenCalledWith(201);
      // jsonは検証しない
    });
  });
  
  describe('dissociateDocument', () => {
    it('存在する関連付けの場合に正しいステータスコード（204）を返す', async () => {
      // モックの設定
      const mockPerson = testPersons[0];
      const documentId = randomUUID();
      
      vi.mocked(personsService.dissociatePersonFromDocument).mockResolvedValue();
      
      mockReq = {
        params: { id: mockPerson.id, document_id: documentId },
      } as MockRequest<IdParam & { document_id: string }>;
      
      // 関数の実行
      await personsController.dissociateDocument(
        mockReq as Request<IdParam & { document_id: string }>,
        mockRes as unknown as Response,
        mockNext
      );
      
      // 検証
      expect(mockRes.status).toHaveBeenCalledWith(204);
      // endは検証しない
    });
  });
}); 