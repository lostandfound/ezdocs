/**
 * ドキュメントリソースのルーター
 * 
 * このファイルはドキュメントリソースに関するルーティングを定義します。
 * 各エンドポイントに対してバリデーションミドルウェアとコントローラーを接続します。
 */

import { Router } from 'express';
import { DocumentsController } from '../controllers/documents';
import { validate } from '../middlewares/validate';
import { sanitize } from '../middlewares/sanitize';
import { paginationSchema } from '../../schemas/common';
import { createDocumentSchema, updateDocumentSchema } from '../../schemas/documents';
import { idParamSchema } from '../../schemas/params';

const documentsRouter = Router();

/**
 * GET /api/documents
 * ドキュメント一覧を取得
 */
documentsRouter.get(
  '/',
  sanitize(['query']),
  validate(paginationSchema, 'query'),
  DocumentsController.getDocuments
);

/**
 * GET /api/documents/:id
 * 特定のドキュメントを取得
 */
documentsRouter.get(
  '/:id',
  sanitize(['params']),
  validate(idParamSchema, 'params'),
  DocumentsController.getDocumentById
);

/**
 * POST /api/documents
 * 新規ドキュメントを作成
 */
documentsRouter.post(
  '/',
  sanitize(['body']),
  validate(createDocumentSchema),
  DocumentsController.createDocument
);

/**
 * PUT /api/documents/:id
 * ドキュメントを更新
 */
documentsRouter.put(
  '/:id',
  sanitize(['params', 'body']),
  validate(idParamSchema, 'params'),
  validate(updateDocumentSchema),
  DocumentsController.updateDocument
);

/**
 * DELETE /api/documents/:id
 * ドキュメントを削除
 */
documentsRouter.delete(
  '/:id',
  sanitize(['params']),
  validate(idParamSchema, 'params'),
  DocumentsController.deleteDocument
);

export default documentsRouter; 