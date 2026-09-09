import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbService } from './services/db.js';
import { adminRouter } from './routes/adminRoutes.js';
import { staffRouter } from './routes/staffRoutes.js';
import { attendanceRouter } from './routes/attendanceRoutes.js';
import { timetableRouter } from './routes/timetableRoutes.js';
import { shiftRouter } from './routes/shiftRoutes.js';
import { replacementRouter } from './routes/replacementRoutes.js';
import { pdfRouter } from './routes/pdfRoutes.js';
import { notificationRouter } from './routes/notificationRoutes.js';
import { reportRouter } from './routes/reportRoutes.js';
import { authRouter } from './routes/authRoutes.js';
export const createApp = () => {
    const app = express();
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    // Serve uploaded PDFs as static files
    app.use('/uploads', express.static(path.resolve(__dirname, '../../public/uploads')));
    app.use(cors({ origin: true, credentials: true }));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    if (process.env.NODE_ENV !== 'test') {
        app.use(morgan('dev'));
    }
    app.get('/api/health', (req, res) => {
        res.json({
            status: 'ok',
            service: 'StaffSync Backend API',
            database: dbService.getStatus(),
            timestamp: new Date().toISOString(),
        });
    });
    app.use('/api', authRouter);
    app.use('/api', adminRouter);
    app.use('/api', staffRouter);
    app.use('/api', attendanceRouter);
    app.use('/api', timetableRouter);
    app.use('/api', shiftRouter);
    app.use('/api', replacementRouter);
    app.use('/api', pdfRouter);
    app.use('/api', notificationRouter);
    app.use('/api', reportRouter);
    return app;
};
export const app = createApp();
