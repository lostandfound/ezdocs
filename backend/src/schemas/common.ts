/**
 * 共通で使用するZodバリデーションスキーマ
 * 
 * このファイルでは、複数のリソースで再利用できる共通のバリデーションスキーマを定義します。
 */

import { z } from 'zod';

/**
 * ページネーションクエリのスキーマ
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;

/**
 * UUIDスキーマ
 */
export const uuidSchema = z.string().uuid({
  message: '有効なUUID形式である必要があります',
});

/**
 * ISO言語コードスキーマ (ISO 639-1)
 */
export const languageCodeSchema = z.string().length(2).optional();

/**
 * JSON文字列スキーマ
 */
export const jsonStringSchema = z.string().refine(
  (val) => {
    try {
      JSON.parse(val);
      return true;
    } catch (e) {
      return false;
    }
  },
  { message: '有効なJSON文字列である必要があります' }
).optional();

/**
 * 年のスキーマ
 */
export const yearSchema = z.number().int().min(1000).max(9999).optional();

/**
 * 月のスキーマ
 */
export const monthSchema = z.number().int().min(1).max(12).optional();

/**
 * 日のスキーマ
 */
export const daySchema = z.number().int().min(1).max(31).optional();

/**
 * 標準APIレスポンスのスキーマ
 */
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => 
  z.object({
    status: z.enum(['success', 'error']),
    data: dataSchema,
    message: z.string().optional(),
  });

/**
 * ページネーション情報のスキーマ
 */
export const paginationInfoSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  pages: z.number().int().nonnegative(),
});

/**
 * ページネーション付きAPIレスポンスのスキーマ
 */
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    pagination: paginationInfoSchema,
  });

/**
 * エラーレスポンスのスキーマ
 */
export const errorResponseSchema = z.object({
  status: z.literal('error'),
  code: z.string(),
  message: z.string(),
  details: z.record(z.string()).optional(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>; 