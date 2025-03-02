# 引用文献の記載方法

## 概要
このドキュメントはEzDocsシステムで実装する引用文献の記載方法について定義します。データベース設計において、引用文献の保存方法および表示形式の標準化は重要な要素です。

## 主要な引用スタイル

### APA (American Psychological Association) スタイル
主に心理学、教育学、社会科学分野で使用される引用形式です。

**データベースの保存形式例**:
```json
{
  "type": "journal",
  "authors": ["山田太郎", "鈴木花子"],
  "year": 2020,
  "title": "日本における文献管理システムの発展",
  "journal": "情報科学ジャーナル",
  "volume": 15,
  "issue": 3,
  "pages": "45-67",
  "doi": "10.1234/jsci.2020.15.3.45"
}
```

**表示形式**:
山田太郎, & 鈴木花子. (2020). 日本における文献管理システムの発展. 情報科学ジャーナル, 15(3), 45-67. https://doi.org/10.1234/jsci.2020.15.3.45

### MLA (Modern Language Association) スタイル
主に文学、言語学、芸術、人文科学分野で使用される引用形式です。

**データベースの保存形式例**:
```json
{
  "type": "book",
  "authors": ["佐藤次郎"],
  "title": "デジタル時代の文献管理",
  "publisher": "テクノ出版",
  "year": 2019,
  "city": "東京",
  "edition": "第2版"
}
```

**表示形式**:
佐藤次郎. 『デジタル時代の文献管理』. 第2版, テクノ出版, 2019.

### Chicago スタイル
歴史学、芸術、その他様々な分野で使用される柔軟性の高い引用形式です。注釈形式と著者-日付形式の2種類があります。

**データベースの保存形式例**:
```json
{
  "type": "webpage",
  "authors": ["情報処理学会"],
  "title": "文献データベース利用ガイドライン",
  "website": "情報処理学会オフィシャルサイト",
  "url": "https://www.ipsj.or.jp/guidelines/literature.html",
  "published_date": "2021-05-15",
  "accessed_date": "2023-11-30"
}
```

**表示形式（注釈形式）**:
情報処理学会, "文献データベース利用ガイドライン," 情報処理学会オフィシャルサイト, 2021年5月15日アクセス, https://www.ipsj.or.jp/guidelines/literature.html.

## EzDocsでの実装方法

### データベース設計への影響
1. **referencesテーブル**:
   - `id`: 一意の識別子
   - `type`: 文献タイプ（journal, book, webpage, etc.）
   - `title`: タイトル
   - `year`: 出版年
   - `source`: 出版元（ジャーナル名、出版社など）
   - `url`: オンラインリソースへのリンク
   - `doi`: Digital Object Identifier (DOI)
   - `metadata`: 文献タイプ固有の追加情報（JSON形式）

2. **reference_authorsテーブル**:
   - `reference_id`: 文献ID（外部キー）
   - `person_id`: 著者ID（personsテーブルへの外部キー）
   - `order`: 著者の順序

3. **document_referencesテーブル**:
   - `document_id`: 文書ID（documentsテーブルへの外部キー）
   - `reference_id`: 文献ID（referencesテーブルへの外部キー）
   - `citation_key`: 文書内での引用キー

### 引用スタイルの切り替え機能
ユーザーが好みの引用スタイルを選択できるようにします：
1. ユーザー設定でデフォルトの引用スタイルを選択可能
2. 文書ごとに引用スタイルを設定可能
3. エクスポート時に異なる引用スタイルを適用可能

### 引用文献リストの自動生成
1. 文書内で引用されたすべての文献を自動的に収集
2. 選択された引用スタイルに基づいて正しいフォーマットで表示
3. アルファベット順または引用順での並べ替えオプション

## 技術的実装の考慮事項
1. **フォーマッター機能**:
   - 各引用スタイル用のフォーマッタークラスを実装
   - Strategy パターンを使用して実行時に引用スタイルを切り替え

2. **メタデータの柔軟な保存**:
   - 文献タイプごとに異なるメタデータをJSONフィールドで保存
   - スキーマの進化に対応できる設計

3. **国際化対応**:
   - 複数言語での引用形式をサポート
   - 言語固有の句読点や表記規則に対応

## 参考資料
1. APA Style Guide: https://apastyle.apa.org/
2. MLA Handbook (8th edition)
3. The Chicago Manual of Style (17th edition)
4. Citation Style Language: https://citationstyles.org/ 