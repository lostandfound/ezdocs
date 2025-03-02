/**
 * ドキュメントサービスの単体テスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { DocumentsService, DocumentNotFoundError } from '../../../src/services/documents';
import { CreateDocumentDto, UpdateDocumentDto } from '../../../src/schemas/documents';
import { PaginationQuery } from '../../../src/schemas/common';

// PrismaClientのモック
vi.mock('@prisma/client', () => {
  const PrismaClient = vi.fn();
  PrismaClient.prototype.document = {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn()
  };
  return { PrismaClient };
});

describe('DocumentsService', () => {
  let documentsService: DocumentsService;
  let mockPrismaClient: PrismaClient;
  
  // テスト用のモックデータ
  const mockDocuments = [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'テスト論文1',
      type: 'paper',
      year: 2025,
      language: 'ja',
      created_at: new Date('2025-01-01'),
      updated_at: new Date('2025-01-01')
    },
    {
      id: '223e4567-e89b-12d3-a456-426614174001',
      title: 'テスト書籍1',
      type: 'book',
      year: 2024,
      language: 'en',
      created_at: new Date('2024-12-31'),
      updated_at: new Date('2024-12-31')
    }
  ];
  
  const mockDocument = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'テスト論文1',
    type: 'paper',
    abstract: 'これはテスト用の論文です',
    ai_summary: null,
    year: 2025,
    month: 1,
    day: 1,
    pages: '1-10',
    volume: '1',
    issue: '1',
    source: 'テストジャーナル',
    publisher: 'テスト出版社',
    language: 'ja',
    identifiers: '{"doi":"10.1234/test"}',
    urls: '{"test":"https://example.com"}',
    keywords: '{"keywords":["テスト","論文"]}',
    ai_keywords: null,
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01')
  };
  
  beforeEach(() => {
    // モックのリセット
    vi.clearAllMocks();
    
    // Prismaクライアントの初期化
    mockPrismaClient = new PrismaClient();
    documentsService = new DocumentsService(mockPrismaClient);
  });
  
  describe('findAll', () => {
    it('ページネーションを適用して全ドキュメントを取得する', async () => {
      // モックの設定
      const paginationQuery: PaginationQuery = { page: 2, limit: 10 };
      const mockCount = 25; // 全25件
      const mockSkip = (paginationQuery.page - 1) * paginationQuery.limit; // 10
      
      // モックの振る舞いを設定
      mockPrismaClient.document.count = vi.fn().mockResolvedValue(mockCount);
      mockPrismaClient.document.findMany = vi.fn().mockResolvedValue(mockDocuments);
      
      // テスト実行
      const result = await documentsService.findAll(paginationQuery);
      
      // 検証
      expect(mockPrismaClient.document.count).toHaveBeenCalledTimes(1);
      expect(mockPrismaClient.document.findMany).toHaveBeenCalledWith({
        skip: mockSkip,
        take: paginationQuery.limit,
        orderBy: { updated_at: 'desc' },
        select: {
          id: true,
          title: true,
          type: true,
          year: true,
          language: true,
          created_at: true,
          updated_at: true,
        },
      });
      
      // 結果の検証
      expect(result).toEqual({
        data: mockDocuments,
        pagination: {
          total: mockCount,
          page: paginationQuery.page,
          limit: paginationQuery.limit,
          pages: Math.ceil(mockCount / paginationQuery.limit),
        },
      });
    });
    
    it('空のリストを返す場合もページネーション情報を正しく設定する', async () => {
      // モックの設定
      const paginationQuery: PaginationQuery = { page: 1, limit: 20 };
      const mockCount = 0; // 0件
      
      // モックの振る舞いを設定
      mockPrismaClient.document.count = vi.fn().mockResolvedValue(mockCount);
      mockPrismaClient.document.findMany = vi.fn().mockResolvedValue([]);
      
      // テスト実行
      const result = await documentsService.findAll(paginationQuery);
      
      // 検証
      expect(result).toEqual({
        data: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          pages: 0,
        },
      });
    });
  });
  
  describe('findById', () => {
    it('存在するIDの場合、ドキュメントを返す', async () => {
      // モックの設定
      const documentId = mockDocument.id;
      
      // モックの振る舞いを設定
      mockPrismaClient.document.findUnique = vi.fn().mockResolvedValue(mockDocument);
      
      // テスト実行
      const result = await documentsService.findById(documentId);
      
      // 検証
      expect(mockPrismaClient.document.findUnique).toHaveBeenCalledWith({
        where: { id: documentId },
      });
      expect(result).toEqual(mockDocument);
    });
    
    it('存在しないIDの場合、DocumentNotFoundErrorをスローする', async () => {
      // モックの設定
      const nonExistentId = 'non-existent-id';
      
      // モックの振る舞いを設定
      mockPrismaClient.document.findUnique = vi.fn().mockResolvedValue(null);
      
      // テスト実行と検証
      await expect(documentsService.findById(nonExistentId))
        .rejects.toThrow(DocumentNotFoundError);
      
      // エラーメッセージの検証
      await expect(documentsService.findById(nonExistentId))
        .rejects.toThrow(`Document with ID ${nonExistentId} not found`);
    });
  });
  
  describe('create', () => {
    it('有効なデータで新規ドキュメントを作成する', async () => {
      // モックの設定
      const createDto: CreateDocumentDto = {
        title: 'テスト論文1',
        type: 'paper',
        abstract: 'これはテスト用の論文です',
        year: 2025,
        month: 1,
        day: 1,
        pages: '1-10',
        volume: '1',
        issue: '1',
        source: 'テストジャーナル',
        publisher: 'テスト出版社',
        language: 'ja',
        identifiers: '{"doi":"10.1234/test"}',
        urls: '{"test":"https://example.com"}',
        keywords: '{"keywords":["テスト","論文"]}',
        ai_keywords: undefined,
      };
      
      // モックの振る舞いを設定
      mockPrismaClient.document.create = vi.fn().mockResolvedValue({
        ...mockDocument,
        ...createDto
      });
      
      // テスト実行
      const result = await documentsService.create(createDto);
      
      // 検証
      expect(mockPrismaClient.document.create).toHaveBeenCalledWith({
        data: expect.objectContaining(createDto),
      });
      expect(result).toEqual(expect.objectContaining(createDto));
    });
    
    it('JSONフィールドがオブジェクトの場合、文字列に変換する', async () => {
      // モックの設定
      const createDto: any = {
        title: 'テスト論文2',
        type: 'paper',
        language: 'ja',
        identifiers: { doi: '10.1234/test' },  // オブジェクト形式
        urls: { test: 'https://example.com' }, // オブジェクト形式
        keywords: { keywords: ['テスト', '論文'] } // オブジェクト形式
      };
      
      // モックの振る舞いを設定
      mockPrismaClient.document.create = vi.fn().mockImplementation(({ data }) => {
        return Promise.resolve({
          id: 'new-id',
          ...data,
          created_at: new Date(),
          updated_at: new Date()
        });
      });
      
      // テスト実行
      await documentsService.create(createDto);
      
      // 検証
      expect(mockPrismaClient.document.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          identifiers: JSON.stringify(createDto.identifiers),
          urls: JSON.stringify(createDto.urls),
          keywords: JSON.stringify(createDto.keywords)
        }),
      });
    });
  });
  
  describe('update', () => {
    it('存在するドキュメントを更新する', async () => {
      // モックの設定
      const documentId = mockDocument.id;
      const updateDto: UpdateDocumentDto = {
        title: '更新されたテスト論文',
        abstract: '更新された要約',
      };
      
      // モックの振る舞いを設定
      mockPrismaClient.document.update = vi.fn().mockResolvedValue({
        ...mockDocument,
        ...updateDto
      });
      
      // テスト実行
      const result = await documentsService.update(documentId, updateDto);
      
      // 検証
      expect(mockPrismaClient.document.update).toHaveBeenCalledWith({
        where: { id: documentId },
        data: expect.objectContaining(updateDto),
      });
      expect(result).toEqual(expect.objectContaining(updateDto));
    });
    
    it('存在しないドキュメントの更新はDocumentNotFoundErrorをスローする', async () => {
      // モックの設定
      const nonExistentId = 'non-existent-id';
      const updateDto: UpdateDocumentDto = {
        title: '更新されたテスト論文',
      };
      
      // モックの振る舞いを設定
      const error = new Error('Record to update not found');
      mockPrismaClient.document.update = vi.fn().mockRejectedValue(error);
      
      // テスト実行と検証
      await expect(documentsService.update(nonExistentId, updateDto))
        .rejects.toThrow(DocumentNotFoundError);
    });
    
    it('データベースエラーは適切に再スローされる', async () => {
      // モックの設定
      const documentId = mockDocument.id;
      const updateDto: UpdateDocumentDto = {
        title: '更新されたテスト論文',
      };
      
      // モックの振る舞いを設定
      const dbError = new Error('Database connection error');
      mockPrismaClient.document.update = vi.fn().mockRejectedValue(dbError);
      
      // テスト実行と検証
      await expect(documentsService.update(documentId, updateDto))
        .rejects.toThrow('Database connection error');
    });
  });
  
  describe('delete', () => {
    it('存在するドキュメントを削除する', async () => {
      // モックの設定
      const documentId = mockDocument.id;
      
      // モックの振る舞いを設定
      mockPrismaClient.document.delete = vi.fn().mockResolvedValue(undefined);
      
      // テスト実行
      await documentsService.delete(documentId);
      
      // 検証
      expect(mockPrismaClient.document.delete).toHaveBeenCalledWith({
        where: { id: documentId },
      });
    });
    
    it('存在しないドキュメントの削除はDocumentNotFoundErrorをスローする', async () => {
      // モックの設定
      const nonExistentId = 'non-existent-id';
      
      // モックの振る舞いを設定
      const error = new Error('Record to delete does not exist');
      mockPrismaClient.document.delete = vi.fn().mockRejectedValue(error);
      
      // テスト実行と検証
      await expect(documentsService.delete(nonExistentId))
        .rejects.toThrow(DocumentNotFoundError);
    });
    
    it('データベースエラーは適切に再スローされる', async () => {
      // モックの設定
      const documentId = mockDocument.id;
      
      // モックの振る舞いを設定
      const dbError = new Error('Database connection error');
      mockPrismaClient.document.delete = vi.fn().mockRejectedValue(dbError);
      
      // テスト実行と検証
      await expect(documentsService.delete(documentId))
        .rejects.toThrow('Database connection error');
    });
  });
}); 