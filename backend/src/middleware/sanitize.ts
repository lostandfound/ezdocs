/**
 * 入力サニタイズミドルウェア
 * 
 * リクエストデータをXSS攻撃から保護するためのミドルウェア。
 * req.body, req.query, req.paramsの値をサニタイズします。
 */

import { Request, Response, NextFunction } from 'express';
import sanitizeHtml from 'sanitize-html';

/**
 * HTMLエンティティをエスケープする関数
 * @param str サニタイズする文字列
 * @returns サニタイズされた文字列
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 文字列をサニタイズする関数
 * 
 * @param str サニタイズする文字列
 * @returns サニタイズされた文字列
 */
export function sanitizeString(str: string): string {
  if (typeof str !== 'string') {
    return str;
  }
  
  // まずsanitize-htmlでHTMLタグを取り除く
  const sanitized = sanitizeHtml(str, {
    allowedTags: [],       // すべてのHTMLタグを許可しない
    allowedAttributes: {}, // すべての属性を許可しない
    disallowedTagsMode: 'discard', // タグを完全に削除
  });
  
  // さらにHTMLエンティティをエスケープして安全にする
  return escapeHtml(sanitized);
}

/**
 * オブジェクトの各プロパティを再帰的にサニタイズする関数
 * 
 * @param obj サニタイズするオブジェクト
 * @returns サニタイズされたオブジェクト
 */
export function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = sanitizeObject(obj[key]);
      }
    }
    return result;
  }

  return obj; // 数値、真偽値、関数などはそのまま返す
}

/**
 * リクエストデータをサニタイズするミドルウェア
 * 
 * XSS対策として、req.body, req.query, req.paramsをサニタイズします。
 * 
 * @param sources サニタイズ対象のリクエスト部分（body, params, queryの配列）
 * @returns Express middleware
 */
export const sanitize = (sources: ('body' | 'params' | 'query')[] = ['body']) => {
  return (req: Request, res: Response, next: NextFunction): void => {
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

/**
 * すべてのリクエストデータをサニタイズするミドルウェア
 * 
 * body, params, queryすべてをサニタイズします。
 */
export default (req: Request, res: Response, next: NextFunction): void => {
  sanitize(['body', 'params', 'query'])(req, res, next);
}; 