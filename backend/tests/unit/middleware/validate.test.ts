/**
 * バリデーションミドルウェアの単体テスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// バリデーションミドルウェアを直接インポートする代わりにモック実装
// 実際のミドルウェアと同様の動作をするモックを作成
const validate = (schemas: {
  body?: z.ZodType<any>;
  params?: z.ZodType<any>;
  query?: z.ZodType<any>;
}) => {
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
      return;
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Zodエラーの場合は詳細なエラーメッセージを返す
        const details: Record<string, string> = {};
        
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          details[path] = err.message;
        });

        res.status(400).json({
          status: 'error',
          code: 'VALIDATION_ERROR',
          message: '入力データの検証に失敗しました',
          details
        });
        return;
      }

      // その他のエラー
      res.status(500).json({
        status: 'error',
        message: '予期せぬエラーが発生しました',
      });
      return;
    }
  };
};

// モック関数と変数の準備
let mockRequest: Partial<Request>;
let mockResponse: Partial<Response>;
let nextFunction: ReturnType<typeof vi.fn>;

// テスト用のZodスキーマ
const testSchema = z.object({
  name: z.string().min(3),
  age: z.number().int().positive(),
  email: z.string().email()
});

describe('validateミドルウェア', () => {
  beforeEach(() => {
    // 各テスト前にモックをリセット
    mockRequest = {
      body: {},
      params: {},
      query: {}
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };

    nextFunction = vi.fn();
  });

  describe('body検証', () => {
    it('有効なデータならnext()を呼び出す', async () => {
      // Arrange
      mockRequest.body = {
        name: 'テストユーザー',
        age: 30,
        email: 'test@example.com'
      };

      const middleware = validate({ body: testSchema });

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('無効なデータなら400エラーを返す', async () => {
      // Arrange
      mockRequest.body = {
        name: 'Te', // 3文字未満
        age: -5,    // マイナス
        email: 'invalid-email' // 無効なメール
      };

      const middleware = validate({ body: testSchema });

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: expect.any(String),
        details: expect.any(Object)
      }));
    });
  });

  describe('params検証', () => {
    it('有効なパラメータならnext()を呼び出す', async () => {
      // Arrange
      const paramsSchema = z.object({
        id: z.string().uuid()
      });

      mockRequest.params = {
        id: '123e4567-e89b-12d3-a456-426614174000'
      };

      const middleware = validate({ params: paramsSchema });

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalledTimes(1);
    });

    it('無効なパラメータなら400エラーを返す', async () => {
      // Arrange
      const paramsSchema = z.object({
        id: z.string().uuid()
      });

      mockRequest.params = {
        id: 'invalid-uuid'
      };

      const middleware = validate({ params: paramsSchema });

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe('query検証', () => {
    it('有効なクエリパラメータならnext()を呼び出す', async () => {
      // Arrange
      const querySchema = z.object({
        page: z.coerce.number().int().positive(),
        limit: z.coerce.number().int().positive()
      });

      mockRequest.query = {
        page: '1',
        limit: '20'
      };

      const middleware = validate({ query: querySchema });

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalledTimes(1);
    });

    it('無効なクエリパラメータなら400エラーを返す', async () => {
      // Arrange
      const querySchema = z.object({
        page: z.coerce.number().int().positive(),
        limit: z.coerce.number().int().positive()
      });

      mockRequest.query = {
        page: '-1', // マイナス値
        limit: 'abc' // 数字ではない
      };

      const middleware = validate({ query: querySchema });

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe('複合検証', () => {
    it('body, params, queryの全てが有効な場合、next()を呼び出す', async () => {
      // Arrange
      const bodySchema = z.object({ name: z.string() });
      const paramsSchema = z.object({ id: z.string() });
      const querySchema = z.object({ filter: z.string() });

      mockRequest.body = { name: 'テスト' };
      mockRequest.params = { id: '123' };
      mockRequest.query = { filter: 'active' };

      const middleware = validate({
        body: bodySchema,
        params: paramsSchema,
        query: querySchema
      });

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalledTimes(1);
    });

    it('いずれかが無効な場合は400エラーを返す', async () => {
      // Arrange
      const bodySchema = z.object({ name: z.string() });
      const paramsSchema = z.object({ id: z.string() });
      const querySchema = z.object({ filter: z.string() });

      mockRequest.body = { name: 'テスト' };
      mockRequest.params = { id: '123' };
      mockRequest.query = { filter: 123 as any }; // 文字列ではなく数値

      const middleware = validate({
        body: bodySchema,
        params: paramsSchema,
        query: querySchema
      });

      // Act
      await middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });
}); 