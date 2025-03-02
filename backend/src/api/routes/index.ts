/**
 * APIルーター
 * 
 * 各リソース別のルーターを集約し、APIのベースパスに接続します。
 */

import { Router } from 'express';
import documentsRouter from './documents';

const apiRouter = Router();

// 各リソースルーターをAPIルーターに接続
apiRouter.use('/documents', documentsRouter);

export default apiRouter; 