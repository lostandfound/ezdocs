/**
 * 著者リソースのルーター
 * 
 * このファイルでは、著者（Person）リソースに関連するルーティングを定義します。
 * 各エンドポイントに対してバリデーションミドルウェアとコントローラーを接続します。
 */

import { Router } from 'express';
import { z } from 'zod';
import { validate, validateSingle } from '../../middleware/validate';
import { sanitize } from '../../middleware/sanitize';
import { paginationSchema, uuidSchema } from '../../schemas/common';
import {
  createPersonSchema,
  updatePersonSchema,
  documentAuthorSchema,
} from '../../schemas/persons';
import * as personsController from '../controllers/persons';
import { idParamSchema } from '../../schemas/params';

const router = Router();

/**
 * GET /api/persons
 * 著者一覧を取得
 */
router.get(
  '/',
  sanitize(['query']),
  validateSingle(
    paginationSchema.extend({
      q: z.string().optional(),
    }),
    'query'
  ),
  personsController.getPersons
);

/**
 * POST /api/persons
 * 新規著者を作成
 */
router.post(
  '/',
  sanitize(['body']),
  validateSingle(createPersonSchema),
  personsController.createPerson
);

/**
 * GET /api/persons/:id
 * 著者詳細を取得
 */
router.get(
  '/:id',
  sanitize(['params']),
  validateSingle(idParamSchema, 'params'),
  personsController.getPersonById
);

/**
 * PUT /api/persons/:id
 * 著者情報を更新
 */
router.put(
  '/:id',
  sanitize(['params', 'body']),
  validate({
    params: idParamSchema,
    body: updatePersonSchema
  }),
  personsController.updatePerson
);

/**
 * DELETE /api/persons/:id
 * 著者を削除
 */
router.delete(
  '/:id',
  sanitize(['params']),
  validateSingle(idParamSchema, 'params'),
  personsController.deletePerson
);

/**
 * GET /api/persons/:id/documents
 * 著者の文書一覧を取得
 */
router.get(
  '/:id/documents',
  sanitize(['params', 'query']),
  validate({
    params: idParamSchema,
    query: paginationSchema
  }),
  personsController.getPersonDocuments
);

/**
 * POST /api/persons/:id/documents
 * 著者と文書を関連付け
 */
router.post(
  '/:id/documents',
  sanitize(['params', 'body']),
  validate({
    params: idParamSchema,
    body: documentAuthorSchema
  }),
  personsController.associateDocument
);

/**
 * DELETE /api/persons/:id/documents/:document_id
 * 著者と文書の関連付けを解除
 */
router.delete(
  '/:id/documents/:document_id',
  sanitize(['params']),
  validateSingle(
    z.object({
      id: uuidSchema,
      document_id: uuidSchema,
    }),
    'params'
  ),
  personsController.dissociateDocument
);

export default router; 