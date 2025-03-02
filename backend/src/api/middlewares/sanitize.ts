/**
 * 入力データサニタイズミドルウェア
 * 
 * リクエストデータのサニタイズを行い、XSS攻撃などを防止するミドルウェア
 */

import { Request, Response, NextFunction } from 'express';
import DOMPurify from 'isomorphic-dompurify';

/**
 * オブジェクト内の文字列値を再帰的にサニタイズする関数
 * 
 * @param obj サニタイズ対象のオブジェクト
 * @returns サニタイズされたオブジェクト
 */
const sanitizeObject = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // 文字列の場合はDOMPurifyでサニタイズ
      sanitized[key] = DOMPurify.sanitize(value);
    } else if (typeof value === 'object' && value !== null) {
      // オブジェクトや配列の場合は再帰的にサニタイズ
      sanitized[key] = sanitizeObject(value);
    } else {
      // その他の型はそのまま
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * リクエストデータのサニタイズを行うミドルウェア
 * 
 * @param sources サニタイズ対象のリクエスト部分（body, params, queryの配列）
 * @returns Expressミドルウェア
 */
export const sanitize = (sources: ('body' | 'params' | 'query')[] = ['body']) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // 指定されたリクエスト部分をサニタイズ
      for (const source of sources) {
        if (req[source]) {
          req[source] = sanitizeObject(req[source]);
        }
      }
      
      next();
    } catch (error) {
      // サニタイズ処理中にエラーが発生した場合は次のミドルウェアへ
      next(error);
    }
  };
}; 