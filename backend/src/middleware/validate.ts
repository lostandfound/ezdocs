/**
 * リクエストバリデーション用ミドルウェア
 * Zodスキーマを使用してリクエストのbody, params, queryを検証します
 */
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, z } from 'zod';

interface ValidateOptions {
  body?: AnyZodObject;
  params?: AnyZodObject;
  query?: AnyZodObject;
}

/**
 * バリデーションミドルウェアを生成する関数
 * 
 * @param schemas - バリデーション対象（body, params, query）とそれぞれのZodスキーマ
 * @returns Express middleware
 */
export const validate = (schemas: ValidateOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // bodyのバリデーション
      if (schemas.body && req.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }

      // paramsのバリデーション
      if (schemas.params && req.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }

      // queryのバリデーション
      if (schemas.query && req.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Zodエラーの場合は詳細なエラーメッセージを返す
        const details: Record<string, string> = {};
        
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          details[path] = err.message;
        });

        return res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: '入力データの検証に失敗しました',
          details
        });
      }

      // その他のエラー
      return res.status(500).json({
        status: 'error',
        message: '予期せぬエラーが発生しました',
      });
    }
  };
};

/**
 * 単一のスキーマを使用したバリデーションミドルウェアを生成する関数
 * 
 * @param schema バリデーションに使用するZodスキーマ
 * @param source バリデーション対象のリクエスト部分（body, params, query）
 * @returns Expressミドルウェア
 */
export const validateSingle = (
  schema: AnyZodObject,
  source: 'body' | 'params' | 'query' = 'body'
) => {
  const options: ValidateOptions = {};
  options[source] = schema;
  return validate(options);
}; 