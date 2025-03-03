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
      status: vi.fn(() => mockRes),
      json: vi.fn(() => mockRes),
      end: vi.fn(() => mockRes),
    };
    
    // ネクスト関数モックの設定
    mockNext = vi.fn();
    
    // 各テスト前にモックをリセット
    vi.resetAllMocks();
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('getPersons', () => {
    it('正しいステータスコード（200）とレスポンス形式を返す', async () => {
      // モックの設定
      const mockPersons = testPersons.slice(0, 2);
      const mockTotal = 5;
      
      vi.mocked(personsService.findPersons).mockResolvedValue({
        persons: mockPersons,
        total: mockTotal,
      });
      
      mockReq = {
        query: {},
      };
      
      // 関数の実行
      await personsController.getPersons(
        mockReq as Request,
        mockRes as unknown as Response,
        mockNext
      );
      
      // 検証
      expect(personsService.findPersons).toHaveBeenCalledWith({
        skip: 0, // (1-1) * 10
        take: 10,
        searchQuery: undefined,
      });
      
      expect(mockRes.json).toHaveBeenCalledWith({
        items: mockPersons,
        pagination: {
          total_items: mockTotal,
          current_page: 1,
          items_per_page: 10,
          total_pages: 1, // Math.ceil(5/10)
        },
      });
    });
    
    it('クエリパラメータを正しく処理する', async () => {
      // モックの設定
      const mockPersons = testPersons.slice(0, 2);
      const mockTotal = 5;
      
      vi.mocked(personsService.findPersons).mockResolvedValue({
        persons: mockPersons,
        total: mockTotal,
      });
      
      mockReq = {
        query: {
          page: '2',
          limit: '5',
          q: '山田',
        },
      };
      
      // 関数の実行
      await personsController.getPersons(
        mockReq as Request,
        mockRes as unknown as Response,
        mockNext
      );
      
      // 検証
      expect(personsService.findPersons).toHaveBeenCalledWith({
        skip: 5, // (2-1) * 5
        take: 5,
        searchQuery: '山田',
      });
      
      expect(mockRes.json).toHaveBeenCalledWith({
        items: mockPersons,
        pagination: {
          total_items: mockTotal,
          current_page: 2,
          items_per_page: 5,
          total_pages: 1, // Math.ceil(5/5)
        },
      });
    });
    
    it('エラーが発生した場合にnext関数を呼び出す', async () => {
      // モックの設定
      const mockError = new Error('テストエラー');
      
      vi.mocked(personsService.findPersons).mockRejectedValue(mockError);
      
      mockReq = {
        query: {},
      };
      
      // 関数の実行
      await personsController.getPersons(
        mockReq as Request,
        mockRes as unknown as Response,
        mockNext
      );
      
      // 検証
      expect(mockNext).toHaveBeenCalledWith(mockError);
      expect(mockRes.json).not.toHaveBeenCalled();
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
      
      mockReq = {
        params: { id: 'non-existent-id' },
      } as MockRequest<IdParam>;
      
      // 関数の実行
      await personsController.getPersonById(
        mockReq as Request<IdParam>,
        mockRes as unknown as Response,
        mockNext
      );
      
      // 検証
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        code: 'PERSON_NOT_FOUND',
        message: '指定された著者が見つかりません',
      });
    });
  });
  
  describe('createPerson', () => {
    it('有効なデータの場合に正しいステータスコード（201）とレスポンスを返す', async () => {
      // モックの設定
      const mockPerson = testPersons[0];
      const createData = {
        last_name: mockPerson.last_name,
        first_name: mockPerson.first_name || undefined,
      };
      
      vi.mocked(personsService.createPerson).mockResolvedValue(mockPerson);
      
      mockReq = {
        body: createData,
      } as MockRequest<{}, typeof createData>;
      
      // 関数の実行
      await personsController.createPerson(
        mockReq as Request<{}, {}, typeof createData>,
        mockRes as unknown as Response,
        mockNext
      );
      
      // 検証
      expect(personsService.createPerson).toHaveBeenCalledWith(createData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockPerson);
    });
  });
  
  describe('updatePerson', () => {
    it('存在するIDと有効なデータの場合に正しいステータスコード（200）とレスポンスを返す', async () => {
      // モックの設定
      const mockPerson = testPersons[0];
      const updateData = {
        last_name: '新姓',
        first_name: '新名',
      };
      const updatedPerson = {
        ...mockPerson,
        ...updateData,
      };
      
      vi.mocked(personsService.updatePerson).mockResolvedValue(updatedPerson);
      
      mockReq = {
        params: { id: mockPerson.id },
        body: updateData,
      } as MockRequest<IdParam, typeof updateData>;
      
      // 関数の実行
      await personsController.updatePerson(
        mockReq as Request<IdParam, {}, typeof updateData>,
        mockRes as unknown as Response,
        mockNext
      );
      
      // 検証
      expect(personsService.updatePerson).toHaveBeenCalledWith(mockPerson.id, updateData);
      expect(mockRes.json).toHaveBeenCalledWith(updatedPerson);
    });
    
    it('存在しないIDの場合に正しいステータスコード（404）とエラーレスポンスを返す', async () => {
      // モックの設定
      const updateData = {
        last_name: '新姓',
      };
      
      // nullを返すようにモックを設定
      vi.mocked(personsService.updatePerson).mockResolvedValue(null as unknown as Person);
      
      mockReq = {
        params: { id: 'non-existent-id' },
        body: updateData,
      } as MockRequest<IdParam, typeof updateData>;
      
      // 関数の実行
      await personsController.updatePerson(
        mockReq as Request<IdParam, {}, typeof updateData>,
        mockRes as unknown as Response,
        mockNext
      );
      
      // 検証
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        code: 'PERSON_NOT_FOUND',
        message: '指定された著者が見つかりません',
      });
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
      expect(mockRes.end).toHaveBeenCalled();
    });
    
    it('存在しないIDの場合に正しいステータスコード（404）とエラーレスポンスを返す', async () => {
      // モックの設定
      // nullを返すようにモックを設定
      vi.mocked(personsService.deletePerson).mockResolvedValue(null as unknown as Person);
      
      mockReq = {
        params: { id: 'non-existent-id' },
      } as MockRequest<IdParam>;
      
      // 関数の実行
      await personsController.deletePerson(
        mockReq as Request<IdParam>,
        mockRes as unknown as Response,
        mockNext
      );
      
      // 検証
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        code: 'PERSON_NOT_FOUND',
        message: '指定された著者が見つかりません',
      });
    });
  });
  
  describe('getPersonDocuments', () => {
    it('存在する著者IDの場合に正しいステータスコード（200）とレスポンスを返す', async () => {
      // モックの設定
      const mockPerson = testPersons[0];
      const mockDocumentAuthors = [
        {
          document_id: randomUUID(),
          person_id: mockPerson.id,
          order: 1,
          document: {
            id: randomUUID(),
            title: 'テスト文書1',
            type: 'paper',
            created_at: new Date(),
            updated_at: new Date(),
          },
        },
      ];
      const mockTotal = 1;
      
      vi.mocked(personsService.findPersonDocuments).mockResolvedValue({
        documents: mockDocumentAuthors,
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
        items: mockDocumentAuthors,
        pagination: {
          total_items: mockTotal,
          current_page: 1,
          items_per_page: 10,
          total_pages: 1,
        },
      });
    });
  });
  
  describe('associateDocument', () => {
    it('有効なデータの場合に正しいステータスコード（201）とレスポンスを返す', async () => {
      // モックの設定
      const mockPerson = testPersons[0];
      const documentId = randomUUID();
      const order = 1;
      const mockDocumentAuthor = {
        document_id: documentId,
        person_id: mockPerson.id,
        order,
      };
      
      vi.mocked(personsService.associatePersonWithDocument).mockResolvedValue(mockDocumentAuthor);
      
      // リクエストボディを作成
      const bodyData = {
        document_id: documentId,
        order,
        person_id: mockPerson.id, // これはコントローラーで上書きされるが、型のために必要
      };
      
      mockReq = {
        params: { id: mockPerson.id },
        body: bodyData,
      } as MockRequest<IdParam, DocumentAuthorDto>;
      
      // 関数の実行
      await personsController.associateDocument(
        mockReq as Request<IdParam, {}, DocumentAuthorDto>,
        mockRes as unknown as Response,
        mockNext
      );
      
      // 検証
      expect(personsService.associatePersonWithDocument).toHaveBeenCalledWith({
        person_id: mockPerson.id,
        document_id: documentId,
        order,
      });
      
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockDocumentAuthor);
    });
  });
  
  describe('dissociateDocument', () => {
    it('存在する関連付けの場合に正しいステータスコード（204）を返す', async () => {
      // モックの設定
      const mockPerson = testPersons[0];
      const documentId = randomUUID();
      
      vi.mocked(personsService.dissociatePersonFromDocument).mockResolvedValue();
      
      // dissociateDocumentのパラメータ型を定義
      type DissociateParams = {
        id: string;
        document_id: string;
      };
      
      mockReq = {
        params: { 
          id: mockPerson.id,
          document_id: documentId 
        },
      } as MockRequest<DissociateParams>;
      
      // 関数の実行
      await personsController.dissociateDocument(
        mockReq as Request<DissociateParams>,
        mockRes as unknown as Response,
        mockNext
      );
      
      // 検証
      expect(personsService.dissociatePersonFromDocument).toHaveBeenCalledWith({
        person_id: mockPerson.id,
        document_id: documentId,
      });
      
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.end).toHaveBeenCalled();
    });
  });
}); 