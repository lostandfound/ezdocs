/**
 * 著者スキーマのテスト
 * 
 * 著者作成/更新スキーマのバリデーションルールをテストします
 */
import { describe, it, expect } from 'vitest';
import { 
  createPersonSchema, 
  updatePersonSchema,
  documentAuthorSchema
} from '../../../src/schemas/persons';
import { z } from 'zod';

describe('createPersonSchema', () => {
  describe('必須フィールド検証', () => {
    it('必須フィールドが存在する場合に検証に成功する', () => {
      const validPerson = {
        last_name: '山田',
        first_name: '太郎'
      };
      
      const result = createPersonSchema.safeParse(validPerson);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validPerson);
      }
    });
    
    it('last_nameが存在しない場合にエラーとなる', () => {
      const invalidPerson = {
        first_name: '太郎'
      };
      
      const result = createPersonSchema.safeParse(invalidPerson);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(z.ZodError);
        expect(result.error.errors[0].path).toContain('last_name');
      }
    });
    
    it('last_nameが空文字列の場合にエラーとなる', () => {
      const invalidPerson = {
        last_name: '',
        first_name: '太郎'
      };
      
      const result = createPersonSchema.safeParse(invalidPerson);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(z.ZodError);
        expect(result.error.errors[0].path).toContain('last_name');
        expect(result.error.errors[0].message).toBe('姓は必須です');
      }
    });
  });
  
  describe('オプショナルフィールド検証', () => {
    it('first_nameがない場合でも検証に成功する', () => {
      const validPerson = {
        last_name: '山田'
      };
      
      const result = createPersonSchema.safeParse(validPerson);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validPerson);
      }
    });
    
    it('first_nameが空文字列の場合も検証に成功する', () => {
      const validPerson = {
        last_name: '山田',
        first_name: ''
      };
      
      const result = createPersonSchema.safeParse(validPerson);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validPerson);
      }
    });
  });
  
  describe('追加フィールド検証', () => {
    it('未定義のフィールドがある場合はそれらを除外する', () => {
      const personWithExtraFields = {
        last_name: '山田',
        first_name: '太郎',
        age: 30,
        email: 'test@example.com'
      };
      
      const result = createPersonSchema.safeParse(personWithExtraFields);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          last_name: '山田',
          first_name: '太郎'
        });
        expect(result.data).not.toHaveProperty('age');
        expect(result.data).not.toHaveProperty('email');
      }
    });
  });
});

describe('updatePersonSchema', () => {
  describe('部分更新検証', () => {
    it('全てのフィールドを指定した場合に検証に成功する', () => {
      const validUpdate = {
        last_name: '鈴木',
        first_name: '一郎'
      };
      
      const result = updatePersonSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validUpdate);
      }
    });
    
    it('一部のフィールドのみを指定した場合に検証に成功する', () => {
      const validPartialUpdate1 = {
        last_name: '鈴木'
      };
      
      const result1 = updatePersonSchema.safeParse(validPartialUpdate1);
      expect(result1.success).toBe(true);
      if (result1.success) {
        expect(result1.data).toEqual(validPartialUpdate1);
      }
      
      const validPartialUpdate2 = {
        first_name: '一郎'
      };
      
      const result2 = updatePersonSchema.safeParse(validPartialUpdate2);
      expect(result2.success).toBe(true);
      if (result2.success) {
        expect(result2.data).toEqual(validPartialUpdate2);
      }
    });
    
    it('空のオブジェクトでも検証に成功する', () => {
      const emptyUpdate = {};
      
      const result = updatePersonSchema.safeParse(emptyUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({});
      }
    });
  });
  
  describe('バリデーションルール検証', () => {
    it('last_nameが空文字列の場合にエラーとなる', () => {
      const invalidUpdate = {
        last_name: ''
      };
      
      const result = updatePersonSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(z.ZodError);
        expect(result.error.errors[0].path).toContain('last_name');
      }
    });
  });
});

describe('documentAuthorSchema', () => {
  describe('必須フィールド検証', () => {
    it('全ての必須フィールドが存在する場合に検証に成功する', () => {
      const validDocumentAuthor = {
        document_id: '123e4567-e89b-12d3-a456-426614174000',
        person_id: '123e4567-e89b-12d3-a456-426614174001',
        order: 1
      };
      
      const result = documentAuthorSchema.safeParse(validDocumentAuthor);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validDocumentAuthor);
      }
    });
    
    it('document_idが存在しない場合にエラーとなる', () => {
      const invalidDocumentAuthor = {
        person_id: '123e4567-e89b-12d3-a456-426614174001',
        order: 1
      };
      
      const result = documentAuthorSchema.safeParse(invalidDocumentAuthor);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(z.ZodError);
        expect(result.error.errors[0].path).toContain('document_id');
      }
    });
    
    it('person_idが存在しない場合にエラーとなる', () => {
      const invalidDocumentAuthor = {
        document_id: '123e4567-e89b-12d3-a456-426614174000',
        order: 1
      };
      
      const result = documentAuthorSchema.safeParse(invalidDocumentAuthor);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(z.ZodError);
        expect(result.error.errors[0].path).toContain('person_id');
      }
    });
    
    it('orderが存在しない場合にエラーとなる', () => {
      const invalidDocumentAuthor = {
        document_id: '123e4567-e89b-12d3-a456-426614174000',
        person_id: '123e4567-e89b-12d3-a456-426614174001'
      };
      
      const result = documentAuthorSchema.safeParse(invalidDocumentAuthor);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(z.ZodError);
        expect(result.error.errors[0].path).toContain('order');
      }
    });
  });
  
  describe('フィールド値検証', () => {
    it('document_idが無効なUUID形式の場合にエラーとなる', () => {
      const invalidDocumentAuthor = {
        document_id: 'invalid-uuid',
        person_id: '123e4567-e89b-12d3-a456-426614174001',
        order: 1
      };
      
      const result = documentAuthorSchema.safeParse(invalidDocumentAuthor);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(z.ZodError);
        expect(result.error.errors[0].path).toContain('document_id');
      }
    });
    
    it('person_idが無効なUUID形式の場合にエラーとなる', () => {
      const invalidDocumentAuthor = {
        document_id: '123e4567-e89b-12d3-a456-426614174000',
        person_id: 'invalid-uuid',
        order: 1
      };
      
      const result = documentAuthorSchema.safeParse(invalidDocumentAuthor);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(z.ZodError);
        expect(result.error.errors[0].path).toContain('person_id');
      }
    });
    
    it('orderが1未満の場合にエラーとなる', () => {
      const invalidDocumentAuthor = {
        document_id: '123e4567-e89b-12d3-a456-426614174000',
        person_id: '123e4567-e89b-12d3-a456-426614174001',
        order: 0
      };
      
      const result = documentAuthorSchema.safeParse(invalidDocumentAuthor);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(z.ZodError);
        expect(result.error.errors[0].path).toContain('order');
      }
    });
    
    it('orderが小数の場合にエラーとなる', () => {
      const invalidDocumentAuthor = {
        document_id: '123e4567-e89b-12d3-a456-426614174000',
        person_id: '123e4567-e89b-12d3-a456-426614174001',
        order: 1.5
      };
      
      const result = documentAuthorSchema.safeParse(invalidDocumentAuthor);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(z.ZodError);
        expect(result.error.errors[0].path).toContain('order');
      }
    });
  });
}); 