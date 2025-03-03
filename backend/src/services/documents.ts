/**
 * ドキュメントサービス
 * 
 * ドキュメントリソースに関連するビジネスロジックを実装します。
 * Prismaを使用してデータベースとのやり取りを行います。
 */

import { PrismaClient, Document } from '@prisma/client';
import { CreateDocumentDto, UpdateDocumentDto } from '../schemas/documents';
import { PaginationQuery } from '../schemas/common';

// エラークラス
export class DocumentNotFoundError extends Error {
  constructor(documentId: string) {
    super(`Document with ID ${documentId} not found`);
    this.name = 'DocumentNotFoundError';
  }
}

export class DocumentsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * ドキュメント一覧を取得する
   * 
   * @param query ページネーションクエリ
   * @returns ドキュメント一覧とページネーション情報
   */
  async findAll(query: PaginationQuery) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    // 総件数取得
    const total = await this.prisma.document.count();
    
    // データ取得
    const documents = await this.prisma.document.findMany({
      skip,
      take: limit,
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

    return {
      data: documents,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit) || 0,
      },
    };
  }

  /**
   * 特定のドキュメントを取得する
   * 
   * @param id ドキュメントID
   * @returns ドキュメント詳細
   * @throws DocumentNotFoundError ドキュメントが見つからない場合
   */
  async findById(id: string): Promise<Document> {
    const document = await this.prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new DocumentNotFoundError(id);
    }

    return document;
  }

  /**
   * 新規ドキュメントを作成する
   * 
   * @param data 作成するドキュメントデータ
   * @returns 作成されたドキュメント
   */
  async create(data: CreateDocumentDto): Promise<Document> {
    const document = await this.prisma.document.create({
      data: {
        ...data,
        // JSONフィールドがstring型でない場合に変換
        identifiers: typeof data.identifiers === 'string' 
          ? data.identifiers 
          : data.identifiers ? JSON.stringify(data.identifiers) : undefined,
        urls: typeof data.urls === 'string' 
          ? data.urls 
          : data.urls ? JSON.stringify(data.urls) : undefined,
        keywords: typeof data.keywords === 'string' 
          ? data.keywords 
          : data.keywords ? JSON.stringify(data.keywords) : undefined,
        ai_keywords: typeof data.ai_keywords === 'string' 
          ? data.ai_keywords 
          : data.ai_keywords ? JSON.stringify(data.ai_keywords) : undefined,
      },
    });

    return document;
  }

  /**
   * ドキュメントを更新する
   * 
   * @param id 更新するドキュメントID
   * @param data 更新するデータ
   * @returns 更新されたドキュメント
   * @throws DocumentNotFoundError ドキュメントが見つからない場合
   */
  async update(id: string, data: UpdateDocumentDto): Promise<Document> {
    try {
      const document = await this.prisma.document.update({
        where: { id },
        data: {
          ...data,
          // JSONフィールドがstring型でない場合に変換
          identifiers: typeof data.identifiers === 'string' 
            ? data.identifiers 
            : data.identifiers ? JSON.stringify(data.identifiers) : undefined,
          urls: typeof data.urls === 'string' 
            ? data.urls 
            : data.urls ? JSON.stringify(data.urls) : undefined,
          keywords: typeof data.keywords === 'string' 
            ? data.keywords 
            : data.keywords ? JSON.stringify(data.keywords) : undefined,
          ai_keywords: typeof data.ai_keywords === 'string' 
            ? data.ai_keywords 
            : data.ai_keywords ? JSON.stringify(data.ai_keywords) : undefined,
        },
      });

      return document;
    } catch (error) {
      // Prismaのエラーメッセージから、レコードが見つからないエラーを判定
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        throw new DocumentNotFoundError(id);
      }
      throw error;
    }
  }

  /**
   * ドキュメントを削除する
   * 
   * @param id 削除するドキュメントID
   * @throws DocumentNotFoundError ドキュメントが見つからない場合
   */
  async delete(id: string): Promise<void> {
    try {
      await this.prisma.document.delete({
        where: { id },
      });
    } catch (error) {
      // Prismaのエラーメッセージから、レコードが見つからないエラーを判定
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        throw new DocumentNotFoundError(id);
      }
      throw error;
    }
  }
} 