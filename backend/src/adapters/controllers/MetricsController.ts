import { Request, Response } from 'express';
import { IMetricsRepository } from '@/domain/repositories/IMetricsRepository';

export class MetricsController {
  constructor(private readonly metricsRepo: IMetricsRepository) {}

  getMetrics = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json(this.metricsRepo.getMetrics());
  };

  getUserMetrics = async (_req: Request, res: Response): Promise<void> => {
    try {
      const userMetrics = await this.metricsRepo.getAllUserMetrics();
      res.status(200).json(userMetrics);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error desconocido' });
    }
  };

  getUniqueUsersCount = async (_req: Request, res: Response): Promise<void> => {
    try {
      const count = await this.metricsRepo.getUniqueUsersCount();
      res.status(200).json(count);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error desconocido' });
    }
  };

  getRendersHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const days = parseInt(req.query.days as string, 10) || 7;
      const history = await this.metricsRepo.getRendersHistory(days);
      res.status(200).json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error al obtener historial' });
    }
  };
}
