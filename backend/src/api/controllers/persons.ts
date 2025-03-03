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

/**
 * 著者一覧を取得
 */
export const getPersons = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const q = req.query.q as string | undefined;
    
    const { persons, total } = await personsService.findPersons({
      skip: (page - 1) * limit,
      take: limit,
      searchQuery: q
    });
    
    // ページネーション情報を含むレスポンスを返す
    res.json({
      items: persons,
      pagination: {
        total_items: total,
        current_page: page,
        items_per_page: limit,
        total_pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
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
    const { id } = req.params;
    
    const person = await personsService.findPersonById(id);
    
    if (!person) {
      return res.status(404).json({
        status: 'error',
        code: 'PERSON_NOT_FOUND',
        message: '指定された著者が見つかりません'
      });
    }
    
    res.json(person);
  } catch (error) {
    next(error);
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
    const personData = req.body;
    
    const newPerson = await personsService.createPerson(personData);
    
    res.status(201).json(newPerson);
  } catch (error) {
    next(error);
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
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedPerson = await personsService.updatePerson(id, updateData);
    
    if (!updatedPerson) {
      return res.status(404).json({
        status: 'error',
        code: 'PERSON_NOT_FOUND',
        message: '指定された著者が見つかりません'
      });
    }
    
    res.json(updatedPerson);
  } catch (error) {
    next(error);
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
    const { id } = req.params;
    
    const deleted = await personsService.deletePerson(id);
    
    if (!deleted) {
      return res.status(404).json({
        status: 'error',
        code: 'PERSON_NOT_FOUND',
        message: '指定された著者が見つかりません'
      });
    }
    
    res.status(204).end();
  } catch (error) {
    next(error);
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
    const { id } = req.params;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    
    const { documents, total } = await personsService.findPersonDocuments(id, {
      page,
      perPage: limit
    });
    
    // ページネーション情報を含むレスポンスを返す
    res.json({
      items: documents,
      pagination: {
        total_items: total,
        current_page: page,
        items_per_page: limit,
        total_pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
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
    const { id } = req.params;
    const { document_id, order } = req.body;
    
    const result = await personsService.associatePersonWithDocument({
      person_id: id,
      document_id,
      order
    });
    
    res.status(201).json(result);
  } catch (error) {
    next(error);
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
    const { id, document_id } = req.params;
    
    await personsService.dissociatePersonFromDocument({
      person_id: id,
      document_id: document_id
    });
    
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}; 