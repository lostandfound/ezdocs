/**
 * エラーハンドリングミドルウェア
 * 
 * アプリケーション全体のエラーを捕捉し、標準化されたエラーレスポンスを返す
 */

import { Request, Response, NextFunction } from 'express';
import { DocumentNotFoundError } from '../services/documents';
import { PersonNotFoundError } from '../api/controllers/persons';
import { ZodError } from 'zod';

// カスタムエラー型の定義
interface AppError extends Error {
  status?: number;
  code?: string;
  details?: Record<string, any>;
}

/**
 * アプリケーション全体のエラーハンドラー
 */
export const errorHandler = (
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
  } else if (err instanceof PersonNotFoundError) {
    statusCode = 404;
    errorCode = 'PERSON_NOT_FOUND';
  } else if (err instanceof ZodError) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = '入力データの検証に失敗しました';
    details = err.format();
  } else if (err.name === 'SyntaxError' && err.message.includes('JSON')) {
    statusCode = 400;
    errorCode = 'INVALID_JSON';
    message = '不正なJSONフォーマットです';
  } else if (err.name === 'PrismaClientKnownRequestError') {
    // Prismaのエラーコードに基づいて対応
    const prismaError = err as any;
    if (prismaError.code === 'P2025') {
      statusCode = 404;
      errorCode = 'RECORD_NOT_FOUND';
      message = '指定されたリソースが見つかりません';
    } else if (prismaError.code === 'P2003') {
      statusCode = 400;
      errorCode = 'FOREIGN_KEY_CONSTRAINT';
      message = '関連するリソースが存在しないため操作できません';
    }
  }

  // 開発環境でのみ詳細なエラー情報をログ出力
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', err);
  }

  // 標準化されたエラーレスポンスを返す
  res.status(statusCode).json({
    status: 'error',
    code: errorCode,
    message,
    ...(details && { details }),
  });
}; 