# ビルドステージ
FROM node:18-alpine AS builder

WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./

# 開発依存関係を含むすべての依存関係をインストール
RUN npm install

# TypeScriptをグローバルにインストール
RUN npm install -g typescript

# ソースコードをコピー
COPY . .

# TypeScriptをJavaScriptにコンパイル
RUN npm run build

# ビルド結果を確認（ファイルがあるか確認するためのデバッグステップ）
RUN ls -la dist/ || echo "dist directory is empty or not created"

# 設定ファイルをコピー
COPY ezdocs.yml ./

# 実行ステージ
FROM node:18-alpine

WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./

# 本番環境の依存関係のみをインストール
RUN npm install --omit=dev

# ビルド済みのコードをコピー
COPY --from=builder /app/dist ./dist

# 設定ファイルをコピー
COPY --from=builder /app/ezdocs.yml ./

# ビルド結果を確認（デバッグステップ）
RUN ls -la dist/ || echo "dist directory is empty or not created"

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# アプリケーションを実行
EXPOSE 8080
CMD ["node", "dist/index.js"] 