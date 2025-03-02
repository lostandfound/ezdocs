/**
 * APIルーター設定
 * 
 * 各リソースのルーターをまとめて、'/api'プレフィックスを付けてエクスポートします。
 */

import { Router } from 'express';
import sanitize from '../../middleware/sanitize';
import documentsRouter from './documents';

const router = Router();

// 全リクエストに対してサニタイゼーションを適用
router.use(sanitize);

// 各リソースのルーターを接続
router.use('/documents', documentsRouter);

// ヘルスチェックエンドポイント
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router; 