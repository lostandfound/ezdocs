-- CreateIndex
CREATE INDEX "document_authors_person_id_idx" ON "document_authors"("person_id");

-- CreateIndex
CREATE INDEX "documents_title_idx" ON "documents"("title");

-- CreateIndex
CREATE INDEX "documents_year_idx" ON "documents"("year");

-- CreateIndex
CREATE INDEX "documents_type_idx" ON "documents"("type");

-- CreateIndex
CREATE INDEX "documents_language_idx" ON "documents"("language");

-- CreateIndex
CREATE INDEX "files_document_id_idx" ON "files"("document_id");

-- CreateIndex
CREATE INDEX "persons_last_name_idx" ON "persons"("last_name");
