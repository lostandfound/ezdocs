/**
 * 著者リソースのコントローラー
 * 
 * このファイルでは、著者（Person）リソースに関連するリクエストハンドラーを実装します。
 * 各関数はルーターから呼び出され、リクエストを処理してレスポンスを返します。
 */

import { Request, Response, NextFunction } from 'express';
import * as personsService from '../../services/persons';
import { IdParam } from '../../schemas/params';
import { CreatePersonDto, UpdatePersonDto, DocumentAuthorDto } from '../../schemas/persons';
import { uuidSchema, paginationSchema } from '../../schemas/common';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

// カスタムエラークラスの定義
export class PersonNotFoundError extends Error {
  constructor(message = '指定された著者が見つかりません') {
    super(message);
    this.name = 'PersonNotFoundError';
  }
}

// Prismaエラーの型を確認する関数
function isPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return (
    typeof error === 'object' &&
    error !== null && 
    'code' in error &&
    typeof (error as any).code === 'string'
  );
}

/**
 * 著者一覧を取得
 */
export const getPersons = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // ページネーションパラメーターのバリデーション
    const validatedQuery = paginationSchema.safeParse({
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 10
    });
    
    if (!validatedQuery.success) {
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'ページネーションパラメーターが不正です',
        details: validatedQuery.error.format()
      });
    }
    
    const { page, limit } = validatedQuery.data;
    const search = req.query.search as string | undefined;
    
    const { persons, total } = await personsService.findPersons({
      skip: (page - 1) * limit,
      take: limit,
      searchQuery: search
    });
    
    // ページネーション情報を含むレスポンスを返す
    res.json({
      status: 'success',
      data: persons,
      pagination: {
        total: total,
        page: page,
        limit: limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: '著者一覧の取得中にエラーが発生しました'
    });
  }
};

/**
 * 著者詳細を取得
 */
export const getPersonById = async (
  req: Request<IdParam>,
  res: Response,
  next: NextFunction
) => {
  try {
    // IDのバリデーション
    const validatedId = uuidSchema.safeParse(req.params.id);
    if (!validatedId.success) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_ID_FORMAT',
        message: '著者IDの形式が不正です',
        details: validatedId.error.format()
      });
    }
    
    const person = await personsService.findPersonById(validatedId.data);
    
    if (!person) {
      return res.status(404).json({
        status: 'error',
        code: 'PERSON_NOT_FOUND',
        message: '指定された著者が見つかりません'
      });
    }
    
    res.json({
      status: 'success',
      data: person,
    });
  } catch (error) {
    if (error instanceof PersonNotFoundError) {
      return res.status(404).json({
        status: 'error',
        code: 'PERSON_NOT_FOUND',
        message: error.message
      });
    }
    
    res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: '著者情報の取得中にエラーが発生しました'
    });
  }
};

/**
 * 新規著者を作成
 */
export const createPerson = async (
  req: Request<{}, {}, CreatePersonDto>,
  res: Response,
  next: NextFunction
) => {
  try {
    // リクエストボディのバリデーション
    const personData = req.body;
    
    const newPerson = await personsService.createPerson(personData);
    
    res.status(201).json({
      status: 'success',
      data: newPerson,
      message: '著者が正常に作成されました',
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: '入力データの検証に失敗しました',
        details: error.format()
      });
    }
    
    res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: '著者の作成中にエラーが発生しました'
    });
  }
};

/**
 * 著者情報を更新
 */
export const updatePerson = async (
  req: Request<IdParam, {}, UpdatePersonDto>,
  res: Response,
  next: NextFunction
) => {
  try {
    // IDのバリデーション
    const validatedId = uuidSchema.safeParse(req.params.id);
    if (!validatedId.success) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_ID_FORMAT',
        message: '著者IDの形式が不正です',
        details: validatedId.error.format()
      });
    }
    
    // リクエストボディのバリデーション
    try {
      const updatedPerson = await personsService.updatePerson(validatedId.data, req.body);
      
      res.json({
        status: 'success',
        data: updatedPerson,
        message: '著者情報が正常に更新されました',
      });
    } catch (error) {
      // Prismaのエラーを適切に処理
      if (isPrismaError(error) && error.code === 'P2025') {
        return res.status(404).json({
          status: 'error',
          code: 'PERSON_NOT_FOUND',
          message: '指定された著者が見つかりません'
        });
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof PersonNotFoundError) {
      return res.status(404).json({
        status: 'error',
        code: 'PERSON_NOT_FOUND',
        message: error.message
      });
    }
    
    if (error instanceof ZodError) {
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: '入力データの検証に失敗しました',
        details: error.format()
      });
    }
    
    res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: '著者情報の更新中にエラーが発生しました'
    });
  }
};

/**
 * 著者を削除
 */
export const deletePerson = async (
  req: Request<IdParam>,
  res: Response,
  next: NextFunction
) => {
  try {
    // IDのバリデーション
    const validatedId = uuidSchema.safeParse(req.params.id);
    if (!validatedId.success) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_ID_FORMAT',
        message: '著者IDの形式が不正です',
        details: validatedId.error.format()
      });
    }
    
    try {
      await personsService.deletePerson(validatedId.data);
      res.status(204).end();
    } catch (error) {
      // Prismaのエラーを適切に処理
      if (isPrismaError(error) && error.code === 'P2025') {
        return res.status(404).json({
          status: 'error',
          code: 'PERSON_NOT_FOUND',
          message: '指定された著者が見つかりません'
        });
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof PersonNotFoundError) {
      return res.status(404).json({
        status: 'error',
        code: 'PERSON_NOT_FOUND',
        message: error.message
      });
    }
    
    res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: '著者の削除中にエラーが発生しました'
    });
  }
};

/**
 * 著者の文書一覧を取得
 */
export const getPersonDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // IDのバリデーション
    const validatedId = uuidSchema.safeParse(req.params.id);
    if (!validatedId.success) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_ID_FORMAT',
        message: '著者IDの形式が不正です',
        details: validatedId.error.format()
      });
    }
    
    // ページネーションパラメーターのバリデーション
    const validatedQuery = paginationSchema.safeParse({
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 10
    });
    
    if (!validatedQuery.success) {
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'ページネーションパラメーターが不正です',
        details: validatedQuery.error.format()
      });
    }
    
    const { page, limit } = validatedQuery.data;
    
    try {
      const { documents, total } = await personsService.findPersonDocuments(
        validatedId.data,
        {
          page,
          perPage: limit
        }
      );
      
      // ページネーション情報付きのレスポンスを返す
      res.json({
        status: 'success',
        data: documents,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      if (isPrismaError(error) && error.code === 'P2025') {
        return res.status(404).json({
          status: 'error',
          code: 'PERSON_NOT_FOUND',
          message: '指定された著者が見つかりません'
        });
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof PersonNotFoundError) {
      return res.status(404).json({
        status: 'error',
        code: 'PERSON_NOT_FOUND',
        message: error.message
      });
    }
    
    res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: '著者の文書一覧取得中にエラーが発生しました'
    });
  }
};

/**
 * 著者と文書を関連付け
 */
export const associateDocument = async (
  req: Request<IdParam, {}, DocumentAuthorDto>,
  res: Response,
  next: NextFunction
) => {
  try {
    // IDのバリデーション
    const validatedId = uuidSchema.safeParse(req.params.id);
    if (!validatedId.success) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_ID_FORMAT',
        message: '著者IDの形式が不正です',
        details: validatedId.error.format()
      });
    }
    
    // ドキュメントIDのバリデーション
    const validatedDocId = uuidSchema.safeParse(req.body.document_id);
    if (!validatedDocId.success) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_ID_FORMAT',
        message: 'ドキュメントIDの形式が不正です',
        details: validatedDocId.error.format()
      });
    }
    
    try {
      const association = await personsService.associatePersonWithDocument({
        person_id: validatedId.data,
        document_id: validatedDocId.data,
        order: req.body.order
      });
      
      res.status(201).json({
        status: 'success',
        data: association,
        message: '著者と文書の関連付けが作成されました',
      });
    } catch (error) {
      if (isPrismaError(error) && error.code === 'P2025') {
        return res.status(404).json({
          status: 'error',
          code: 'RESOURCE_NOT_FOUND',
          message: '指定された著者またはドキュメントが見つかりません'
        });
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: '入力データの検証に失敗しました',
        details: error.format()
      });
    }
    
    res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: '著者と文書の関連付け中にエラーが発生しました'
    });
  }
};

/**
 * 著者と文書の関連付けを解除
 */
export const dissociateDocument = async (
  req: Request<{ id: string; document_id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    // 著者IDのバリデーション
    const validatedPersonId = uuidSchema.safeParse(req.params.id);
    if (!validatedPersonId.success) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_ID_FORMAT',
        message: '著者IDの形式が不正です',
        details: validatedPersonId.error.format()
      });
    }
    
    // ドキュメントIDのバリデーション
    const validatedDocId = uuidSchema.safeParse(req.params.document_id);
    if (!validatedDocId.success) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_ID_FORMAT',
        message: 'ドキュメントIDの形式が不正です',
        details: validatedDocId.error.format()
      });
    }
    
    try {
      await personsService.dissociatePersonFromDocument({
        person_id: validatedPersonId.data,
        document_id: validatedDocId.data
      });
      
      res.status(204).end();
    } catch (error) {
      // レコード見つからないエラーの場合は404
      if (isPrismaError(error) && error.code === 'P2025') {
        return res.status(404).json({
          status: 'error',
          code: 'RESOURCE_NOT_FOUND',
          message: '指定された関連付けが見つかりません'
        });
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: '入力データの検証に失敗しました',
        details: error.format()
      });
    }
    
    res.status(500).json({
      status: 'error',
      code: 'SERVER_ERROR',
      message: '著者と文書の関連付け解除中にエラーが発生しました'
    });
  }
}; 