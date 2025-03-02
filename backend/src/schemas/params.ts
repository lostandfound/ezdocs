/**
 * URLパラメータのバリデーションスキーマ
 */

import { z } from 'zod';
import { uuidSchema } from './common';

/**
 * ID指定のURLパラメータ用スキーマ
 */
export const idParamSchema = z.object({
  id: uuidSchema,
});

export type IdParam = z.infer<typeof idParamSchema>; 