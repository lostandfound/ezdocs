/**
 * ドキュメントリソース用のZodバリデーションスキーマ
 * 
 * このファイルでは、ドキュメントリソースに関連するバリデーションスキーマを定義します。
 */

import { z } from 'zod';
import { 
  uuidSchema, 
  languageCodeSchema, 
  jsonStringSchema, 
  yearSchema, 
  monthSchema, 
  daySchema 
} from './common';

/**
 * ドキュメントタイプのスキーマ
 */
export const documentTypeSchema = z.enum(['paper', 'book', 'other'], {
  errorMap: () => ({ message: "typeは'paper', 'book', 'other'のいずれかである必要があります" })
});

export type DocumentType = z.infer<typeof documentTypeSchema>;

/**
 * ドキュメント作成スキーマ
 */
export const createDocumentSchema = z.object({
  title: z.string().min(1, { message: 'タイトルは必須です' }),
  type: documentTypeSchema,
  abstract: z.string().optional(),
  year: yearSchema,
  month: monthSchema,
  day: daySchema,
  pages: z.string().optional(),
  volume: z.string().optional(),
  issue: z.string().optional(),
  source: z.string().optional(),
  publisher: z.string().optional(),
  language: languageCodeSchema,
  identifiers: jsonStringSchema,
  urls: jsonStringSchema,
  keywords: jsonStringSchema,
  ai_keywords: jsonStringSchema,
});

export type CreateDocumentDto = z.infer<typeof createDocumentSchema>;

/**
 * ドキュメント更新スキーマ
 * 作成スキーマと同じフィールドだが、全てオプショナル
 */
export const updateDocumentSchema = createDocumentSchema.partial();

export type UpdateDocumentDto = z.infer<typeof updateDocumentSchema>;

/**
 * ドキュメント詳細レスポンススキーマ
 */
export const documentResponseSchema = z.object({
  id: uuidSchema,
  title: z.string().nullable(),
  type: z.string().nullable(),
  abstract: z.string().nullable(),
  ai_summary: z.string().nullable(),
  year: z.number().int().nullable(),
  month: z.number().int().nullable(),
  day: z.number().int().nullable(),
  pages: z.string().nullable(),
  volume: z.string().nullable(),
  issue: z.string().nullable(),
  source: z.string().nullable(),
  publisher: z.string().nullable(),
  language: z.string().nullable(),
  identifiers: z.string().nullable(),
  urls: z.string().nullable(),
  keywords: z.string().nullable(),
  ai_keywords: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type DocumentResponse = z.infer<typeof documentResponseSchema>;

/**
 * ドキュメント一覧レスポンススキーマ
 * 一覧表示では簡略化された情報のみを返す
 */
export const documentListItemSchema = z.object({
  id: uuidSchema,
  title: z.string().nullable(),
  type: z.string().nullable(),
  year: z.number().int().nullable(),
  language: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type DocumentListItem = z.infer<typeof documentListItemSchema>; 