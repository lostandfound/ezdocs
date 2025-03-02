/**
 * サニタイズミドルウェアの単体テスト
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import DOMPurify from 'isomorphic-dompurify';

// サニタイズミドルウェアのモック実装
const sanitizeObject = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // 配列の場合は各要素を再帰的にサニタイズ
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  // オブジェクトの場合は各プロパティを再帰的にサニタイズ
  if (typeof obj === 'object') {
    const sanitizedObj: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitizedObj[key] = sanitizeObject(value);
    }
    return sanitizedObj;
  }

  // 文字列の場合はDOMPurifyでサニタイズ
  if (typeof obj === 'string') {
    return DOMPurify.sanitize(obj, { ALLOWED_TAGS: [] });
  }

  // その他のプリミティブ型（数値、真偽値など）はそのまま返す
  return obj;
};

// サニタイズミドルウェアのモック
const sanitize = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // リクエストボディのサニタイズ
      if (req.body) {
        req.body = sanitizeObject(req.body);
      }

      // URLパラメータのサニタイズ
      if (req.params) {
        req.params = sanitizeObject(req.params);
      }

      // クエリパラメータのサニタイズ
      if (req.query) {
        req.query = sanitizeObject(req.query);
      }

      next();
    } catch (error) {
      console.error('サニタイズ処理中にエラーが発生しました:', error);
      next(error);
    }
  };
};

// モック関数と変数の準備
let mockRequest: Partial<Request>;
let mockResponse: Partial<Response>;
let nextFunction: ReturnType<typeof vi.fn>;

describe('sanitizeミドルウェア', () => {
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

  describe('bodyの無害化', () => {
    it('HTMLタグを含むデータを無害化する', () => {
      // Arrange
      mockRequest.body = {
        name: '<script>alert("XSS")</script>テストユーザー',
        description: '<img src="x" onerror="javascript:alert(\'XSS\')">説明文',
        nested: {
          html: '<a href="javascript:alert(\'XSS\')">リンク</a>',
          array: ['正常テキスト', '<b>太字</b>', '<iframe src="evil.com"></iframe>']
        }
      };

      const middleware = sanitize();

      // Act
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockRequest.body).toEqual({
        name: 'テストユーザー',
        description: '説明文',
        nested: {
          html: 'リンク',
          array: ['正常テキスト', '太字', '']
        }
      });
    });

    it('無害なデータはそのまま維持する', () => {
      // Arrange
      const originalBody = {
        name: 'テストユーザー',
        email: 'test@example.com',
        age: 30,
        isActive: true,
        tags: ['タグ1', 'タグ2'],
        metadata: {
          description: '安全な説明文',
          created: '2025-03-03'
        }
      };

      mockRequest.body = JSON.parse(JSON.stringify(originalBody));
      const middleware = sanitize();

      // Act
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockRequest.body).toEqual(originalBody);
    });

    it('数値、真偽値、nullなどのプリミティブ型は変更しない', () => {
      // Arrange
      mockRequest.body = {
        number: 123,
        boolean: true,
        nullValue: null,
        undefinedValue: undefined
      };

      const middleware = sanitize();

      // Act
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockRequest.body).toEqual({
        number: 123,
        boolean: true,
        nullValue: null,
        undefinedValue: undefined
      });
    });
  });

  describe('paramsの無害化', () => {
    it('URLパラメータのXSSを無害化する', () => {
      // Arrange
      mockRequest.params = {
        id: '123<script>alert("XSS")</script>',
        slug: 'test-<img src="x" onerror="alert(\'XSS\')">'
      };

      const middleware = sanitize();

      // Act
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockRequest.params).toEqual({
        id: '123',
        slug: 'test-'
      });
    });
  });

  describe('queryの無害化', () => {
    it('クエリパラメータのXSSを無害化する', () => {
      // Arrange
      mockRequest.query = {
        search: '<script>alert("XSS")</script>検索語',
        filter: 'status=<img src="x" onerror="alert(\'XSS\')">'
      };

      const middleware = sanitize();

      // Act
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockRequest.query).toEqual({
        search: '検索語',
        filter: 'status='
      });
    });
  });

  describe('複雑なオブジェクトの無害化', () => {
    it('ネストされたオブジェクトや配列を正しく処理する', () => {
      // Arrange
      mockRequest.body = {
        user: {
          name: 'ユーザー<script>alert("XSS")</script>',
          profile: {
            bio: '<p>自己紹介</p><script>evil()</script>',
            links: ['https://example.com', '<a href="javascript:alert()">悪意あるリンク</a>']
          }
        },
        posts: [
          { title: '投稿1<script>alert("XSS")</script>', content: '<p>内容1</p>' },
          { title: '投稿2', content: '<img src="x" onerror="alert(\'XSS\')">' }
        ]
      };

      const middleware = sanitize();

      // Act
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalledTimes(1);
      expect(mockRequest.body).toEqual({
        user: {
          name: 'ユーザー',
          profile: {
            bio: '自己紹介',
            links: ['https://example.com', '悪意あるリンク']
          }
        },
        posts: [
          { title: '投稿1', content: '内容1' },
          { title: '投稿2', content: '' }
        ]
      });
    });
  });
}); 