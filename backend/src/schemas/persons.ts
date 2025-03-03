/**
 * 著者リソース用のZodバリデーションスキーマ
 * 
 * このファイルでは、著者リソースに関連するバリデーションスキーマを定義します。
 */

import { z } from 'zod';
import { uuidSchema } from './common';

/**
 * 著者作成スキーマ
 */
export const createPersonSchema = z.object({
  last_name: z.string().min(1, { message: '姓は必須です' }),
  first_name: z.string().optional(),
});

export type CreatePersonDto = z.infer<typeof createPersonSchema>;

/**
 * 著者更新スキーマ
 * 作成スキーマと同じフィールドだが、全てオプショナル
 */
export const updatePersonSchema = createPersonSchema.partial();

export type UpdatePersonDto = z.infer<typeof updatePersonSchema>;

/**
 * 著者詳細レスポンススキーマ
 */
export const personResponseSchema = z.object({
  id: uuidSchema,
  last_name: z.string(),
  first_name: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type PersonResponse = z.infer<typeof personResponseSchema>;

/**
 * 著者一覧レスポンススキーマ
 * 一覧表示では詳細と同じ情報を返す（フィールドが少ないため）
 */
export const personListItemSchema = personResponseSchema;

export type PersonListItem = z.infer<typeof personListItemSchema>;

/**
 * 著者-文書関連付けスキーマ
 */
export const documentAuthorSchema = z.object({
  document_id: uuidSchema,
  person_id: uuidSchema,
  order: z.number().int().min(1),
});

export type DocumentAuthorDto = z.infer<typeof documentAuthorSchema>; 