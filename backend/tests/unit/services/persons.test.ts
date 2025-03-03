/**
 * 著者リソースのサービス層テスト
 * 
 * 著者リソースに関連するサービス関数をテストします
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  findPersons,
  findPersonById,
  createPerson,
  updatePerson,
  deletePerson,
  findPersonDocuments,
  associatePersonWithDocument,
  dissociatePersonFromDocument
} from '../../../src/services/persons';
import prisma from '../../../src/db/prisma';
import { testPersons } from '../../fixtures/persons';
import { randomUUID } from 'crypto';

// Prismaクライアントのモック
vi.mock('../../../src/db/prisma', () => {
  return {
    default: {
      person: {
        findMany: vi.fn(),
        count: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      documentAuthor: {
        findMany: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(prisma)),
    },
  };
});

describe('著者サービス', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('findPersons', () => {
    it('ページネーションパラメータを正しく処理する', async () => {
      // モックの設定
      const mockPersons = testPersons.slice(0, 2);
      const mockTotal = 5;
      
      vi.mocked(prisma.person.findMany).mockResolvedValue(mockPersons);
      vi.mocked(prisma.person.count).mockResolvedValue(mockTotal);
      
      // 関数の実行
      const result = await findPersons({ skip: 0, take: 2 });
      
      // 検証
      expect(prisma.person.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 2,
          orderBy: { last_name: 'asc' },
        })
      );
      expect(result).toEqual({
        persons: mockPersons,
        total: mockTotal,
      });
    });
    
    it('検索クエリを正しく処理する', async () => {
      // モックの設定
      const mockPersons = [testPersons[0]];
      const mockTotal = 1;
      
      vi.mocked(prisma.person.findMany).mockResolvedValue(mockPersons);
      vi.mocked(prisma.person.count).mockResolvedValue(mockTotal);
      
      // 関数の実行
      const result = await findPersons({ searchQuery: '山田' });
      
      // 検証
      expect(prisma.person.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { last_name: { contains: '山田' } },
              { first_name: { contains: '山田' } },
            ],
          },
        })
      );
      expect(result).toEqual({
        persons: mockPersons,
        total: mockTotal,
      });
    });
  });
  
  describe('findPersonById', () => {
    it('存在するIDの場合に正しい著者データを返す', async () => {
      // モックの設定
      const mockPerson = testPersons[0];
      
      vi.mocked(prisma.person.findUnique).mockResolvedValue(mockPerson);
      
      // 関数の実行
      const result = await findPersonById(mockPerson.id);
      
      // 検証
      expect(prisma.person.findUnique).toHaveBeenCalledWith({
        where: { id: mockPerson.id },
      });
      expect(result).toEqual(mockPerson);
    });
    
    it('存在しないIDの場合にnullを返す', async () => {
      // モックの設定
      vi.mocked(prisma.person.findUnique).mockResolvedValue(null);
      
      // 関数の実行
      const result = await findPersonById('non-existent-id');
      
      // 検証
      expect(prisma.person.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
      });
      expect(result).toBeNull();
    });
  });
  
  describe('createPerson', () => {
    it('有効なデータで著者を作成する', async () => {
      // モックの設定
      const mockPerson = testPersons[0];
      const createData = {
        last_name: mockPerson.last_name,
        first_name: mockPerson.first_name === null ? undefined : mockPerson.first_name,
      };
      
      vi.mocked(prisma.person.create).mockResolvedValue(mockPerson);
      
      // 関数の実行
      const result = await createPerson(createData);
      
      // 検証
      expect(prisma.person.create).toHaveBeenCalledWith({
        data: createData,
      });
      expect(result).toEqual(mockPerson);
    });
  });
  
  describe('updatePerson', () => {
    it('存在するIDの場合に著者データを更新する', async () => {
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
      
      vi.mocked(prisma.person.update).mockResolvedValue(updatedPerson);
      
      // 関数の実行
      const result = await updatePerson(mockPerson.id, updateData);
      
      // 検証
      expect(prisma.person.update).toHaveBeenCalledWith({
        where: { id: mockPerson.id },
        data: updateData,
      });
      expect(result).toEqual(updatedPerson);
    });
    
    it('部分的な更新が正しく機能する', async () => {
      // モックの設定
      const mockPerson = testPersons[0];
      const updateData = {
        first_name: '新名',
      };
      const updatedPerson = {
        ...mockPerson,
        ...updateData,
      };
      
      vi.mocked(prisma.person.update).mockResolvedValue(updatedPerson);
      
      // 関数の実行
      const result = await updatePerson(mockPerson.id, updateData);
      
      // 検証
      expect(prisma.person.update).toHaveBeenCalledWith({
        where: { id: mockPerson.id },
        data: updateData,
      });
      expect(result).toEqual(updatedPerson);
    });
  });
  
  describe('deletePerson', () => {
    it('存在するIDの場合に著者を削除する', async () => {
      // モックの設定
      const mockPerson = testPersons[0];
      
      vi.mocked(prisma.person.delete).mockResolvedValue(mockPerson);
      
      // 関数の実行
      const result = await deletePerson(mockPerson.id);
      
      // 検証
      expect(prisma.person.delete).toHaveBeenCalledWith({
        where: { id: mockPerson.id },
      });
      expect(result).toEqual(mockPerson);
    });
  });
  
  describe('findPersonDocuments', () => {
    it('著者に関連する文書を正しく取得する', async () => {
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
        {
          document_id: randomUUID(),
          person_id: mockPerson.id,
          order: 2,
          document: {
            id: randomUUID(),
            title: 'テスト文書2',
            type: 'book',
            created_at: new Date(),
            updated_at: new Date(),
          },
        },
      ];
      const mockTotal = 2;
      
      vi.mocked(prisma.documentAuthor.findMany).mockResolvedValue(mockDocumentAuthors);
      vi.mocked(prisma.documentAuthor.count).mockResolvedValue(mockTotal);
      
      // 関数の実行
      const result = await findPersonDocuments(mockPerson.id, { page: 1, perPage: 10 });
      
      // 検証
      expect(prisma.documentAuthor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          where: { person_id: mockPerson.id },
          include: { document: true },
          orderBy: { order: 'asc' },
        })
      );
      expect(result).toEqual({
        documents: mockDocumentAuthors,
        total: mockTotal,
      });
    });
    
    it('ページネーションが正しく機能する', async () => {
      // モックの設定
      const mockPerson = testPersons[0];
      const mockDocumentAuthors = [];
      const mockTotal = 0;
      
      vi.mocked(prisma.documentAuthor.findMany).mockResolvedValue(mockDocumentAuthors);
      vi.mocked(prisma.documentAuthor.count).mockResolvedValue(mockTotal);
      
      // 関数の実行
      const result = await findPersonDocuments(mockPerson.id, { page: 2, perPage: 5 });
      
      // 検証
      expect(prisma.documentAuthor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (2-1) * 5
          take: 5,
          where: { person_id: mockPerson.id },
        })
      );
      expect(result).toEqual({
        documents: mockDocumentAuthors,
        total: mockTotal,
      });
    });
  });
  
  describe('associatePersonWithDocument', () => {
    it('著者と文書を正しく関連付ける', async () => {
      // モックの設定
      const mockPerson = testPersons[0];
      const documentId = randomUUID();
      const order = 1;
      const mockDocumentAuthor = {
        document_id: documentId,
        person_id: mockPerson.id,
        order,
      };
      
      vi.mocked(prisma.documentAuthor.create).mockResolvedValue(mockDocumentAuthor);
      
      // 関数の実行
      const result = await associatePersonWithDocument({
        person_id: mockPerson.id,
        document_id: documentId,
        order,
      });
      
      // 検証
      expect(prisma.documentAuthor.create).toHaveBeenCalledWith({
        data: {
          person_id: mockPerson.id,
          document_id: documentId,
          order,
        },
      });
      expect(result).toEqual(mockDocumentAuthor);
    });
  });
  
  describe('dissociatePersonFromDocument', () => {
    it('著者と文書の関連付けを正しく解除する', async () => {
      // モックの設定
      const mockPerson = testPersons[0];
      const documentId = randomUUID();
      
      vi.mocked(prisma.documentAuthor.delete).mockResolvedValue({} as any);
      
      // 関数の実行
      await dissociatePersonFromDocument({
        person_id: mockPerson.id,
        document_id: documentId,
      });
      
      // 検証
      expect(prisma.documentAuthor.delete).toHaveBeenCalledWith({
        where: {
          document_id_person_id: {
            document_id: documentId,
            person_id: mockPerson.id,
          },
        },
      });
    });
  });
}); 