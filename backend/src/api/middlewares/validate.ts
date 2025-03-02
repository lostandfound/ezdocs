/**
 * バリデーションミドルウェア
 * 
 * Zodスキーマを使用してリクエストのバリデーションを行うミドルウェア
 */

import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

/**
 * リクエストバリデーションミドルウェアファクトリ
 * 
 * @param schema バリデーションに使用するZodスキーマ
 * @param source バリデーション対象のリクエスト部分（body, params, query）
 * @returns Expressミドルウェア
 */
export const validate = (
  schema: AnyZodObject,
  source: 'body' | 'params' | 'query' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // スキーマによるバリデーション
      const data = schema.parse(req[source]);
      
      // バリデーション済みデータをリクエストオブジェクトに設定
      req[source] = data;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Zodバリデーションエラーを整形
        const details: Record<string, string> = {};
        
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          details[path] = err.message;
        });
        
        // 標準化されたエラーレスポンスを返す
        return res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: 'リクエストデータの検証に失敗しました',
          details,
        });
      }
      
      // 想定外のエラーは次のミドルウェアに渡す
      next(error);
    }
  };
}; 