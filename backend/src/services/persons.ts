/**
 * 著者リソースのサービス層
 * 
 * このファイルでは、著者リソースに関連するビジネスロジックを実装します。
 */

import { Person, DocumentAuthor, Prisma } from '@prisma/client';
import prisma from '../db/prisma';
import { CreatePersonDto, UpdatePersonDto } from '../schemas/persons';

/**
 * 著者一覧を取得します
 */
export async function findPersons(params: {
  skip?: number;
  take?: number;
  searchQuery?: string;
}): Promise<{ persons: Person[]; total: number }> {
  const { skip = 0, take = 10, searchQuery } = params;

  const where = searchQuery
    ? {
        OR: [
          { last_name: { contains: searchQuery } },
          { first_name: { contains: searchQuery } },
        ],
      }
    : {};

  const [persons, total] = await Promise.all([
    prisma.person.findMany({
      skip,
      take,
      where,
      orderBy: { last_name: 'asc' as Prisma.SortOrder },
    }),
    prisma.person.count({ where }),
  ]);

  return { persons, total };
}

/**
 * 指定されたIDの著者を取得します
 */
export async function findPersonById(id: string): Promise<Person | null> {
  return prisma.person.findUnique({
    where: { id },
  });
}

/**
 * 新しい著者を作成します
 */
export async function createPerson(data: CreatePersonDto): Promise<Person> {
  const { first_name, last_name } = data;
  return prisma.person.create({
    data: {
      first_name,
      last_name,
    },
  });
}

/**
 * 指定されたIDの著者情報を更新します
 */
export async function updatePerson(id: string, data: UpdatePersonDto): Promise<Person> {
  const { first_name, last_name } = data;
  return prisma.person.update({
    where: { id },
    data: {
      first_name,
      last_name,
    },
  });
}

/**
 * 指定されたIDの著者を削除します
 */
export async function deletePerson(id: string): Promise<Person> {
  return prisma.person.delete({
    where: { id },
  });
}

/**
 * 指定された著者が関連する文書一覧を取得します
 */
export async function findPersonDocuments(
  person_id: string,
  params: {
    page?: number;
    perPage?: number;
  }
): Promise<{ documents: DocumentAuthor[]; total: number }> {
  const { page = 1, perPage = 10 } = params;
  const skip = (page - 1) * perPage;
  const take = perPage;

  const [documents, total] = await Promise.all([
    prisma.documentAuthor.findMany({
      skip,
      take,
      where: { person_id },
      include: {
        document: true,
      },
      orderBy: { order: 'asc' as Prisma.SortOrder },
    }),
    prisma.documentAuthor.count({
      where: { person_id },
    }),
  ]);

  return { documents, total };
}

/**
 * 著者と文書を関連付けます
 */
export async function associatePersonWithDocument(params: {
  person_id: string;
  document_id: string;
  order: number;
}): Promise<DocumentAuthor> {
  const { person_id, document_id, order } = params;

  return prisma.documentAuthor.create({
    data: {
      person_id,
      document_id,
      order,
    },
  });
}

/**
 * 著者と文書の関連付けを解除します
 */
export async function dissociatePersonFromDocument(params: {
  person_id: string;
  document_id: string;
}): Promise<void> {
  const { person_id, document_id } = params;

  await prisma.documentAuthor.delete({
    where: {
      document_id_person_id: {
        document_id,
        person_id,
      },
    },
  });
} 