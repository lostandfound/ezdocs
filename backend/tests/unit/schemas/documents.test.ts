/**
 * ドキュメントスキーマのテスト
 * 
 * ドキュメント作成/更新スキーマのバリデーションルールをテストします
 */
import { describe, it, expect } from 'vitest';
import { 
  createDocumentSchema, 
  updateDocumentSchema, 
  documentTypeSchema,
  DocumentType
} from '../../../src/schemas/documents';
import { z } from 'zod';

describe('documentTypeSchema', () => {
  it('有効なドキュメントタイプを許可する', () => {
    // 有効な値
    const validTypes = ['paper', 'book', 'other'];
    
    validTypes.forEach(type => {
      const result = documentTypeSchema.safeParse(type);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(type);
      }
    });
  });
  
  it('無効なドキュメントタイプを拒否する', () => {
    // 無効な値
    const invalidTypes = ['article', 'journal', '', null, undefined, 123];
    
    invalidTypes.forEach(type => {
      const result = documentTypeSchema.safeParse(type);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(z.ZodError);
        expect(result.error.errors[0].message).toBe(
          "typeは'paper', 'book', 'other'のいずれかである必要があります"
        );
      }
    });
  });
});

describe('createDocumentSchema', () => {
  describe('必須フィールド検証', () => {
    it('必須フィールドが存在する場合に検証に成功する', () => {
      const validDocument = {
        title: 'テスト論文タイトル',
        type: 'paper' as DocumentType,
        year: 2025,
        language: 'ja'
      };
      
      const result = createDocumentSchema.safeParse(validDocument);
      expect(result.success).toBe(true);
    });
    
    it('タイトルが空の場合に検証に失敗する', () => {
      const invalidDocument = {
        title: '',  // 空のタイトル
        type: 'paper' as DocumentType,
        year: 2025,
        language: 'ja'
      };
      
      const result = createDocumentSchema.safeParse(invalidDocument);
      expect(result.success).toBe(false);
      if (!result.success) {
        const titleError = result.error.errors.find(err => 
          err.path.includes('title')
        );
        expect(titleError).toBeDefined();
        expect(titleError?.message).toBe('タイトルは必須です');
      }
    });
    
    it('タイトルが存在しない場合に検証に失敗する', () => {
      const invalidDocument = {
        // タイトルなし
        type: 'paper' as DocumentType,
        year: 2025,
        language: 'ja'
      };
      
      const result = createDocumentSchema.safeParse(invalidDocument);
      expect(result.success).toBe(false);
      if (!result.success) {
        const titleError = result.error.errors.find(err => 
          err.path.includes('title')
        );
        expect(titleError).toBeDefined();
      }
    });
  });
  
  describe('フィールド型検証', () => {
    it('年、月、日が数値の場合に検証に成功する', () => {
      const validDocument = {
        title: 'テスト論文タイトル',
        type: 'paper' as DocumentType,
        year: 2025,
        month: 3,
        day: 15,
        language: 'ja'
      };
      
      const result = createDocumentSchema.safeParse(validDocument);
      expect(result.success).toBe(true);
    });
    
    it('年、月、日が数値以外の場合に検証に失敗する', () => {
      const invalidDocument = {
        title: 'テスト論文タイトル',
        type: 'paper' as DocumentType,
        year: '2025', // 文字列
        month: '3',   // 文字列
        day: '15',    // 文字列
        language: 'ja'
      };
      
      const result = createDocumentSchema.safeParse(invalidDocument);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThanOrEqual(1);
      }
    });
    
    it('年が範囲外の場合に検証に失敗する', () => {
      // 範囲外の年（1000未満または9999超過）
      const invalidYears = [999, 10000];
      
      invalidYears.forEach(year => {
        const invalidDocument = {
          title: 'テスト論文タイトル',
          type: 'paper' as DocumentType,
          year,
          language: 'ja'
        };
        
        const result = createDocumentSchema.safeParse(invalidDocument);
        expect(result.success).toBe(false);
        if (!result.success) {
          const yearError = result.error.errors.find(err => 
            err.path.includes('year')
          );
          expect(yearError).toBeDefined();
        }
      });
    });
    
    it('月と日が範囲外の場合に検証に失敗する', () => {
      const invalidDocument = {
        title: 'テスト論文タイトル',
        type: 'paper' as DocumentType,
        year: 2025,
        month: 13,  // 無効な月（13月）
        day: 32,    // 無効な日（32日）
        language: 'ja'
      };
      
      const result = createDocumentSchema.safeParse(invalidDocument);
      expect(result.success).toBe(false);
      if (!result.success) {
        const monthError = result.error.errors.find(err => 
          err.path.includes('month')
        );
        const dayError = result.error.errors.find(err => 
          err.path.includes('day')
        );
        
        expect(monthError).toBeDefined();
        expect(dayError).toBeDefined();
      }
    });
  });
  
  describe('列挙型制約（ドキュメントタイプ）', () => {
    it('有効なドキュメントタイプでは検証に成功する', () => {
      const validTypes = ['paper', 'book', 'other'] as DocumentType[];
      
      validTypes.forEach(type => {
        const validDocument = {
          title: 'テスト論文タイトル',
          type,
          year: 2025,
          language: 'ja'
        };
        
        const result = createDocumentSchema.safeParse(validDocument);
        expect(result.success).toBe(true);
      });
    });
    
    it('無効なドキュメントタイプでは検証に失敗する', () => {
      const invalidDocument = {
        title: 'テスト論文タイトル',
        type: 'article', // 無効なタイプ
        year: 2025,
        language: 'ja'
      };
      
      const result = createDocumentSchema.safeParse(invalidDocument);
      expect(result.success).toBe(false);
      if (!result.success) {
        const typeError = result.error.errors.find(err => 
          err.path.includes('type')
        );
        expect(typeError).toBeDefined();
        expect(typeError?.message).toBe(
          "typeは'paper', 'book', 'other'のいずれかである必要があります"
        );
      }
    });
  });
});

describe('updateDocumentSchema', () => {
  describe('オプショナルフィールド検証', () => {
    it('全フィールドが存在する場合に検証に成功する', () => {
      const validUpdate = {
        title: '更新後のタイトル',
        type: 'book' as DocumentType,
        abstract: '更新後の要約',
        year: 2024,
        month: 12,
        day: 31,
        pages: '100-200',
        language: 'en'
      };
      
      const result = updateDocumentSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });
    
    it('一部のフィールドのみでも検証に成功する', () => {
      // タイトルのみの更新
      const titleOnlyUpdate = {
        title: '更新後のタイトル'
      };
      
      // 年と月のみの更新
      const dateUpdate = {
        year: 2024,
        month: 6
      };
      
      // 種類のみの更新
      const typeUpdate = {
        type: 'other' as DocumentType
      };
      
      const updates = [titleOnlyUpdate, dateUpdate, typeUpdate];
      
      updates.forEach(update => {
        const result = updateDocumentSchema.safeParse(update);
        expect(result.success).toBe(true);
      });
    });
    
    it('空のオブジェクトでも検証に成功する（全フィールドオプショナル）', () => {
      const emptyUpdate = {};
      
      const result = updateDocumentSchema.safeParse(emptyUpdate);
      expect(result.success).toBe(true);
    });
  });
  
  describe('部分更新の正確性', () => {
    it('更新時には各フィールドの型制約が維持される', () => {
      const invalidUpdate = {
        title: '',           // 空のタイトルは可（部分更新なので）
        year: '2024',        // 文字列型は不可
        month: 13,           // 範囲外は不可
        type: 'article'      // 無効な値は不可
      };
      
      const result = updateDocumentSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const yearError = result.error.errors.find(err => 
          err.path.includes('year')
        );
        const monthError = result.error.errors.find(err => 
          err.path.includes('month')
        );
        const typeError = result.error.errors.find(err => 
          err.path.includes('type')
        );
        
        expect(yearError).toBeDefined();  // 数値でないのでエラー
        expect(monthError).toBeDefined(); // 範囲外なのでエラー
        expect(typeError).toBeDefined();  // 無効な値なのでエラー
      }
    });
  });
}); 