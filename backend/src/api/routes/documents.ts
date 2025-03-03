/**
 * ドキュメントリソースのルーター
 * 
 * このファイルはドキュメントリソースに関するルーティングを定義します。
 * 各エンドポイントに対してバリデーションミドルウェアとコントローラーを接続します。
 */

import { Router } from 'express';
import { DocumentsController } from '../controllers/documents';
import { validate, validateSingle } from '../../middleware/validate';
import { sanitize } from '../../middleware/sanitize';
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
  validateSingle(paginationSchema, 'query'),
  DocumentsController.getDocuments
);

/**
 * GET /api/documents/:id
 * ドキュメント詳細を取得
 */
documentsRouter.get(
  '/:id',
  sanitize(['params']),
  validateSingle(idParamSchema, 'params'),
  DocumentsController.getDocumentById
);

/**
 * POST /api/documents
 * 新規ドキュメントを作成
 */
documentsRouter.post(
  '/',
  sanitize(['body']),
  validateSingle(createDocumentSchema),
  DocumentsController.createDocument
);

/**
 * PUT /api/documents/:id
 * ドキュメントを更新
 */
documentsRouter.put(
  '/:id',
  sanitize(['params', 'body']),
  validate({
    params: idParamSchema,
    body: updateDocumentSchema
  }),
  DocumentsController.updateDocument
);

/**
 * DELETE /api/documents/:id
 * ドキュメントを削除
 */
documentsRouter.delete(
  '/:id',
  sanitize(['params']),
  validateSingle(idParamSchema, 'params'),
  DocumentsController.deleteDocument
);

export default documentsRouter; 