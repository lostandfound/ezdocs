/**
 * ドキュメントコントローラー
 * 
 * ドキュメントリソースに関するHTTPリクエストを処理します。
 * リクエストのバリデーション、サービスの呼び出し、レスポンスの整形を行います。
 */

import { Request, Response, NextFunction } from 'express';
import { DocumentsService, DocumentNotFoundError } from '../../services/documents';
import prisma from '../../db/prisma';
import { PaginationQuery } from '../../schemas/common';
import { CreateDocumentDto, UpdateDocumentDto } from '../../schemas/documents';

// サービスのインスタンスを作成
const documentsService = new DocumentsService(prisma);

export class DocumentsController {
  /**
   * ドキュメント一覧を取得する
   * GET /api/documents
   */
  static async getDocuments(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await documentsService.findAll(req.query as unknown as PaginationQuery);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 特定のドキュメントを取得する
   * GET /api/documents/:id
   */
  static async getDocumentById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const document = await documentsService.findById(req.params.id);
      
      res.json({
        status: 'success',
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 新規ドキュメントを作成する
   * POST /api/documents
   */
  static async createDocument(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const document = await documentsService.create(req.body as CreateDocumentDto);
      
      res.status(201).json({
        status: 'success',
        data: document,
        message: 'ドキュメントが正常に作成されました',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ドキュメントを更新する
   * PUT /api/documents/:id
   */
  static async updateDocument(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const document = await documentsService.update(
        req.params.id, 
        req.body as UpdateDocumentDto
      );
      
      res.json({
        status: 'success',
        data: document,
        message: 'ドキュメントが正常に更新されました',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ドキュメントを削除する
   * DELETE /api/documents/:id
   */
  static async deleteDocument(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      await documentsService.delete(req.params.id);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
} 