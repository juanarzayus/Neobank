import type { Request, Response } from 'express';
import type { CheckDatabaseHealthUseCase } from '../../application/use-cases/health/CheckDatabaseHealthUseCase';

export class HealthController {
  constructor(private readonly checkDatabase: CheckDatabaseHealthUseCase) {}

  status = (_req: Request, res: Response) => {
    res.json({ status: 'ok', message: 'Neobank backend funcionando' });
  };

  database = async (_req: Request, res: Response) => {
    const health = await this.checkDatabase.execute();
    if (health.ok) {
      res.json({ status: 'ok', database: 'connected', time: health.time });
    } else {
      res.status(500).json({ status: 'error', database: 'disconnected', code: health.code });
    }
  };
}
