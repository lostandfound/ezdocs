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
 * @param req Express Request オブジェクト
 * @param res Express Response オブジェクト
 * @param next 次のミドルウェア関数
 */
export function sanitize(req: Request, res: Response, next: NextFunction): void {
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
}

export default sanitize; 