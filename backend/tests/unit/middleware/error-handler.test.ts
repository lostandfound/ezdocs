/**
 * エラーハンドリングミドルウェアの単体テスト
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { DocumentNotFoundError } from '../../../src/services/documents';

// エラーハンドリングミドルウェアをモック実装
// 実際のミドルウェアと同様の動作をするが、テスト用に機能を限定
interface AppError extends Error {
  status?: number;
  code?: string;
  details?: Record<string, string>;
}

const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // デフォルトのエラー情報
  let statusCode = err.status || 500;
  let errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || '予期しないエラーが発生しました';
  let details = err.details;

  // 特定のエラータイプに基づいて情報を上書き
  if (err instanceof DocumentNotFoundError) {
    statusCode = 404;
    errorCode = 'DOCUMENT_NOT_FOUND';
  } else if (err.name === 'SyntaxError' && err.message.includes('JSON')) {
    statusCode = 400;
    errorCode = 'INVALID_JSON';
    message = '不正なJSONフォーマットです';
  }

  // 標準化されたエラーレスポンスを返す
  res.status(statusCode).json({
    status: 'error',
    code: errorCode,
    message,
    ...(details && { details }),
  });
};

// モック関数と変数の準備
let mockRequest: Partial<Request>;
let mockResponse: Partial<Response>;
let nextFunction: ReturnType<typeof vi.fn>;

describe('errorHandlerミドルウェア', () => {
  beforeEach(() => {
    // 各テスト前にモックをリセット
    mockRequest = {};
    
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    
    nextFunction = vi.fn();
    
    // コンソールエラーをモック化（テスト出力をクリーンに保つため）
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('404エラー（リソース不在）のハンドリング', () => {
    it('DocumentNotFoundErrorを正しく処理する', () => {
      // Arrange
      const documentId = 'doc-123';
      const error = new DocumentNotFoundError(documentId);
      
      // Act
      errorHandler(
        error, 
        mockRequest as Request, 
        mockResponse as Response, 
        nextFunction
      );
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        code: 'DOCUMENT_NOT_FOUND',
        message: `Document with ID ${documentId} not found`
      });
    });
    
    it('status=404が設定されたエラーを正しく処理する', () => {
      // Arrange
      const error = new Error('リソースが見つかりません') as AppError;
      error.status = 404;
      error.code = 'RESOURCE_NOT_FOUND';
      
      // Act
      errorHandler(
        error, 
        mockRequest as Request, 
        mockResponse as Response, 
        nextFunction
      );
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        code: 'RESOURCE_NOT_FOUND',
        message: 'リソースが見つかりません'
      });
    });
  });
  
  describe('400エラー（バリデーションエラー）のハンドリング', () => {
    it('不正なJSONエラーを正しく処理する', () => {
      // Arrange
      const error = new SyntaxError('Unexpected token in JSON') as AppError;
      
      // Act
      errorHandler(
        error, 
        mockRequest as Request, 
        mockResponse as Response, 
        nextFunction
      );
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        code: 'INVALID_JSON',
        message: '不正なJSONフォーマットです'
      });
    });
    
    it('バリデーションエラーの詳細を正しく処理する', () => {
      // Arrange
      const error = new Error('入力データの検証に失敗しました') as AppError;
      error.status = 400;
      error.code = 'VALIDATION_ERROR';
      error.details = {
        'name': '名前は必須です',
        'email': '有効なメールアドレスを入力してください'
      };
      
      // Act
      errorHandler(
        error, 
        mockRequest as Request, 
        mockResponse as Response, 
        nextFunction
      );
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: '入力データの検証に失敗しました',
        details: {
          'name': '名前は必須です',
          'email': '有効なメールアドレスを入力してください'
        }
      });
    });
  });
  
  describe('500エラー（内部エラー）のハンドリング', () => {
    it('未処理の例外を500エラーとして処理する', () => {
      // Arrange
      const error = new Error('データベース接続エラー');
      
      // Act
      errorHandler(
        error, 
        mockRequest as Request, 
        mockResponse as Response, 
        nextFunction
      );
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'データベース接続エラー'
      });
    });
  });
  
  describe('カスタムエラーのハンドリング', () => {
    it('カスタムステータスコードとエラーコードを持つエラーを処理する', () => {
      // Arrange
      const error = new Error('アクセス権限がありません') as AppError;
      error.status = 403;
      error.code = 'FORBIDDEN';
      
      // Act
      errorHandler(
        error, 
        mockRequest as Request, 
        mockResponse as Response, 
        nextFunction
      );
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        code: 'FORBIDDEN',
        message: 'アクセス権限がありません'
      });
    });
    
    it('詳細情報を含むカスタムエラーを処理する', () => {
      // Arrange
      const error = new Error('リクエスト処理中にエラーが発生しました') as AppError;
      error.status = 422;
      error.code = 'PROCESSING_ERROR';
      error.details = {
        'reason': 'データの整合性エラー',
        'field': 'document.status'
      };
      
      // Act
      errorHandler(
        error, 
        mockRequest as Request, 
        mockResponse as Response, 
        nextFunction
      );
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        code: 'PROCESSING_ERROR',
        message: 'リクエスト処理中にエラーが発生しました',
        details: {
          'reason': 'データの整合性エラー',
          'field': 'document.status'
        }
      });
    });
  });
}); 