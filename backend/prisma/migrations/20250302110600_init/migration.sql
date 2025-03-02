-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "type" TEXT,
    "abstract" TEXT,
    "ai_summary" TEXT,
    "year" INTEGER,
    "month" INTEGER,
    "day" INTEGER,
    "pages" TEXT,
    "volume" TEXT,
    "issue" TEXT,
    "source" TEXT,
    "publisher" TEXT,
    "language" TEXT,
    "identifiers" TEXT,
    "urls" TEXT,
    "keywords" TEXT,
    "ai_keywords" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "persons" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "last_name" TEXT NOT NULL,
    "first_name" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "files" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mimetype" TEXT NOT NULL,
    "gcs_path" TEXT NOT NULL,
    "gsutil_uri" TEXT NOT NULL,
    "filehash" TEXT NOT NULL,
    "document_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "files_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "document_authors" (
    "document_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    PRIMARY KEY ("document_id", "person_id"),
    CONSTRAINT "document_authors_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "document_authors_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "persons" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
