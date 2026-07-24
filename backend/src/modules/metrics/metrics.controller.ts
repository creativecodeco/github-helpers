import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { TypeORMMetricsRepository } from '@/adapters/repositories/TypeORMMetricsRepository';

function checkMetricsKey(req: FastifyRequest, res: FastifyReply): boolean {
  const expectedKey = process.env.METRICS_KEY;
  if (!expectedKey) {
    res.status(403).send({ error: 'Las métricas no están configuradas o el acceso está deshabilitado.' });
    return false;
  }

  const query = (req.query as Record<string, any>) || {};
  const providedKey =
    query.key ||
    req.headers['x-api-key'] ||
    (typeof req.headers['authorization'] === 'string' && req.headers['authorization'].startsWith('Bearer ')
      ? req.headers['authorization'].slice(7)
      : undefined);

  if (providedKey !== expectedKey) {
    res.status(401).send({ error: 'Acceso no autorizado. Se requiere una clave de métrica válida.' });
    return false;
  }

  return true;
}

@Controller('api')
export class MetricsController {
  private readonly metricsRepo: TypeORMMetricsRepository;

  constructor() {
    this.metricsRepo = new TypeORMMetricsRepository();
  }

  @Get('metrics')
  async getMetrics(@Req() req: FastifyRequest, @Res() res: FastifyReply): Promise<void> {
    if (!checkMetricsKey(req, res)) return;
    res.status(200).send(this.metricsRepo.getMetrics());
  }

  @Get('metrics/history')
  async getRendersHistory(@Req() req: FastifyRequest, @Res() res: FastifyReply): Promise<void> {
    if (!checkMetricsKey(req, res)) return;
    try {
      const query = (req.query as Record<string, any>) || {};
      const days = Number.parseInt(query.days as string, 10) || 7;
      const history = await this.metricsRepo.getRendersHistory(days);
      res.status(200).send(history);
    } catch (error: any) {
      res.status(500).send({ error: error.message || 'Error al obtener historial' });
    }
  }

  @Get('metrics/users')
  async getUserMetrics(@Req() req: FastifyRequest, @Res() res: FastifyReply): Promise<void> {
    if (!checkMetricsKey(req, res)) return;
    try {
      const userMetrics = await this.metricsRepo.getAllUserMetrics();
      res.status(200).send(userMetrics);
    } catch (error: any) {
      res.status(500).send({ error: error.message || 'Error desconocido' });
    }
  }

  @Get('metrics/users/count')
  async getUniqueUsersCount(@Res() res: FastifyReply): Promise<void> {
    try {
      const count = await this.metricsRepo.getUniqueUsersCount();
      res.status(200).send(count);
    } catch (error: any) {
      res.status(500).send({ error: error.message || 'Error desconocido' });
    }
  }

  @Get('config')
  getConfig(): { privateStatsComingSoon: boolean } {
    return {
      privateStatsComingSoon: process.env.PRIVATE_STATS_COMING_SOON !== 'false'
    };
  }
}
