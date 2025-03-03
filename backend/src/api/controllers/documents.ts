/**
 * ドキュメントコントローラー
 * 
 * ドキュメントリソースに関するHTTPリクエストを処理します。
 * リクエストのバリデーション、サービスの呼び出し、レスポンスの整形を行います。
 */

import { Request, Response, NextFunction } from 'express';
import { DocumentsService, DocumentNotFoundError } from '../../services/documents';
import prisma from '../../db/prisma';
import { PaginationQuery, paginationSchema, uuidSchema } from '../../schemas/common';
import { CreateDocumentDto, UpdateDocumentDto, createDocumentSchema, updateDocumentSchema } from '../../schemas/documents';
import { ZodError } from 'zod';

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
      // ページネーションパラメーターのバリデーション
      const validatedQuery = paginationSchema.safeParse(req.query);
      if (!validatedQuery.success) {
        return res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'ページネーションパラメーターが不正です',
          details: validatedQuery.error.format()
        });
      }

      const result = await documentsService.findAll(validatedQuery.data);
      
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
      // IDのバリデーション
      const validatedId = uuidSchema.safeParse(req.params.id);
      if (!validatedId.success) {
        return res.status(400).json({
          status: 'error',
          code: 'INVALID_ID_FORMAT',
          message: 'ドキュメントIDの形式が不正です',
          details: validatedId.error.format()
        });
      }

      const document = await documentsService.findById(validatedId.data);
      
      res.json({
        status: 'success',
        data: document,
      });
    } catch (error) {
      if (error instanceof DocumentNotFoundError) {
        return res.status(404).json({
          status: 'error',
          code: 'DOCUMENT_NOT_FOUND',
          message: error.message
        });
      }
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
      // リクエストボディのバリデーション
      const validatedBody = createDocumentSchema.safeParse(req.body);
      if (!validatedBody.success) {
        return res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'ドキュメント作成データが不正です',
          details: validatedBody.error.format()
        });
      }

      const document = await documentsService.create(validatedBody.data);
      
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
      // IDのバリデーション
      const validatedId = uuidSchema.safeParse(req.params.id);
      if (!validatedId.success) {
        return res.status(400).json({
          status: 'error',
          code: 'INVALID_ID_FORMAT',
          message: 'ドキュメントIDの形式が不正です',
          details: validatedId.error.format()
        });
      }

      // リクエストボディのバリデーション
      const validatedBody = updateDocumentSchema.safeParse(req.body);
      if (!validatedBody.success) {
        return res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'ドキュメント更新データが不正です',
          details: validatedBody.error.format()
        });
      }

      const document = await documentsService.update(
        validatedId.data, 
        validatedBody.data
      );
      
      res.json({
        status: 'success',
        data: document,
        message: 'ドキュメントが正常に更新されました',
      });
    } catch (error) {
      if (error instanceof DocumentNotFoundError) {
        return res.status(404).json({
          status: 'error',
          code: 'DOCUMENT_NOT_FOUND',
          message: error.message
        });
      }
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
      // IDのバリデーション
      const validatedId = uuidSchema.safeParse(req.params.id);
      if (!validatedId.success) {
        return res.status(400).json({
          status: 'error',
          code: 'INVALID_ID_FORMAT',
          message: 'ドキュメントIDの形式が不正です',
          details: validatedId.error.format()
        });
      }

      await documentsService.delete(validatedId.data);
      
      res.status(204).send();
    } catch (error) {
      if (error instanceof DocumentNotFoundError) {
        return res.status(404).json({
          status: 'error',
          code: 'DOCUMENT_NOT_FOUND',
          message: error.message
        });
      }
      next(error);
    }
  }
} 