import type { Express } from "express";
import authRoutes from './routes/auth.js';
import aiAssistantRoutes from './routes/ai-assistant.js';
import { healthRouter as healthRoutes } from './routes/health.js';
import { completePDFRoutes as documentRoutes } from './routes/complete-pdf-routes.js';

export function registerRoutes(app: Express) {
  console.log('🔧 Registering API routes...');

  // Authentication routes
  app.use('/api/auth', authRoutes);
  console.log('✅ Authentication routes registered');

  // AI Assistant routes
  app.use('/api/ai', aiAssistantRoutes);
  console.log('✅ AI Assistant routes registered');

  // Health check routes
  app.use('/api', healthRoutes);
  console.log('✅ Health check routes registered');

  // Document generation routes
  app.use('/api/documents', documentRoutes);
  app.use('/api/pdf', documentRoutes);
  console.log('✅ Document generation routes registered');

  console.log('🎯 All routes registered successfully');
}