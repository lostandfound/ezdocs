/**
 * 共通スキーマのテスト
 * 
 * 共通で使用するバリデーションスキーマをテストします
 */
import { describe, it, expect } from 'vitest';
import { 
  paginationSchema,
  paginationInfoSchema,
  yearSchema,
  monthSchema,
  daySchema,
  languageCodeSchema,
  jsonStringSchema,
  uuidSchema
} from '../../../src/schemas/common';
import { z } from 'zod';

describe('paginationSchema', () => {
  describe('デフォルト値の検証', () => {
    it('パラメータが指定されていない場合はデフォルト値を使用する', () => {
      // 空のクエリオブジェクト
      const emptyQuery = {};
      
      const result = paginationSchema.safeParse(emptyQuery);
      expect(result.success).toBe(true);
      
      if (result.success) {
        // デフォルト値の検証
        expect(result.data.page).toBe(1);    // デフォルトpage: 1
        expect(result.data.limit).toBe(20);  // デフォルトlimit: 20
      }
    });
    
    it('一部のパラメータのみ指定した場合は残りにデフォルト値を使用する', () => {
      // pageのみ指定
      const pageOnlyQuery = { page: 2 };
      
      const pageResult = paginationSchema.safeParse(pageOnlyQuery);
      expect(pageResult.success).toBe(true);
      
      if (pageResult.success) {
        expect(pageResult.data.page).toBe(2);     // 指定したpage: 2
        expect(pageResult.data.limit).toBe(20);   // デフォルトlimit: 20
      }
      
      // limitのみ指定
      const limitOnlyQuery = { limit: 50 };
      
      const limitResult = paginationSchema.safeParse(limitOnlyQuery);
      expect(limitResult.success).toBe(true);
      
      if (limitResult.success) {
        expect(limitResult.data.page).toBe(1);    // デフォルトpage: 1
        expect(limitResult.data.limit).toBe(50);  // 指定したlimit: 50
      }
    });
    
    it('文字列形式のパラメータを数値に変換する', () => {
      // 文字列形式のパラメータ
      const stringQuery = { page: '3', limit: '30' };
      
      const result = paginationSchema.safeParse(stringQuery);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.page).toBe(3);    // 数値に変換されるべき
        expect(result.data.limit).toBe(30);  // 数値に変換されるべき
        
        // 型チェック
        expect(typeof result.data.page).toBe('number');
        expect(typeof result.data.limit).toBe('number');
      }
    });
  });
  
  describe('境界値テスト', () => {
    it('最小値での検証に成功する', () => {
      // 最小許容値
      const minQuery = { page: 1, limit: 1 };
      
      const result = paginationSchema.safeParse(minQuery);
      expect(result.success).toBe(true);
    });
    
    it('pageが0以下の場合に検証に失敗する', () => {
      // 不正なページ番号
      const invalidPageQueries = [
        { page: 0 },    // 0は不可（1以上）
        { page: -1 },   // 負の値は不可
      ];
      
      invalidPageQueries.forEach(query => {
        const result = paginationSchema.safeParse(query);
        expect(result.success).toBe(false);
        
        if (!result.success) {
          const pageError = result.error.errors.find(err => 
            err.path.includes('page')
          );
          expect(pageError).toBeDefined();
        }
      });
    });
    
    it('limitが最大値を超える場合に検証に失敗する', () => {
      // 最大許容値（100）を超えるlimit
      const exceedMaxQuery = { limit: 101 };
      
      const result = paginationSchema.safeParse(exceedMaxQuery);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const limitError = result.error.errors.find(err => 
          err.path.includes('limit')
        );
        expect(limitError).toBeDefined();
      }
    });
    
    it('limitが0以下の場合に検証に失敗する', () => {
      // 不正なlimit値
      const invalidLimitQueries = [
        { limit: 0 },    // 0は不可（1以上）
        { limit: -10 },  // 負の値は不可
      ];
      
      invalidLimitQueries.forEach(query => {
        const result = paginationSchema.safeParse(query);
        expect(result.success).toBe(false);
        
        if (!result.success) {
          const limitError = result.error.errors.find(err => 
            err.path.includes('limit')
          );
          expect(limitError).toBeDefined();
        }
      });
    });
    
    it('limitが最大値（100）の場合に検証に成功する', () => {
      // 最大許容値
      const maxQuery = { limit: 100 };
      
      const result = paginationSchema.safeParse(maxQuery);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.limit).toBe(100);
      }
    });
    
    it('数値に変換できない文字列の場合に検証に失敗する', () => {
      // 数値に変換できない文字列
      const invalidQueries = [
        { page: 'first' },     // 数値でない文字列
        { limit: 'unlimited' } // 数値でない文字列
      ];
      
      invalidQueries.forEach(query => {
        const result = paginationSchema.safeParse(query);
        expect(result.success).toBe(false);
      });
    });
  });
});

describe('paginationInfoSchema', () => {
  it('有効なページネーション情報を検証できる', () => {
    const validInfo = {
      total: 100,  // 全アイテム数
      page: 2,     // 現在のページ
      limit: 20,   // 1ページあたりの件数
      pages: 5     // 総ページ数
    };
    
    const result = paginationInfoSchema.safeParse(validInfo);
    expect(result.success).toBe(true);
  });
  
  it('無効なページネーション情報を拒否する', () => {
    // 欠落フィールド
    const missingField = {
      total: 100,
      page: 2,
      limit: 20
      // pagesが欠落
    };
    
    const missingResult = paginationInfoSchema.safeParse(missingField);
    expect(missingResult.success).toBe(false);
    
    // 負の値
    const negativeValues = {
      total: -10,  // 負の値は不可
      page: 2,
      limit: 20,
      pages: 5
    };
    
    const negativeResult = paginationInfoSchema.safeParse(negativeValues);
    expect(negativeResult.success).toBe(false);
    
    // 0ページは不可
    const zeroPage = {
      total: 100,
      page: 0,    // 0は不可（1以上）
      limit: 20,
      pages: 5
    };
    
    const zeroPageResult = paginationInfoSchema.safeParse(zeroPage);
    expect(zeroPageResult.success).toBe(false);
  });
}); 