/**
 * URLパラメータ用のZodバリデーションスキーマ
 * 
 * このファイルでは、URLパラメータのバリデーションに使用するスキーマを定義します。
 */

import { z } from 'zod';
import { uuidSchema } from './common';

/**
 * IDパラメータのスキーマ
 */
export const idParamSchema = z.object({
  id: uuidSchema,
});

export type IdParam = z.infer<typeof idParamSchema>; 