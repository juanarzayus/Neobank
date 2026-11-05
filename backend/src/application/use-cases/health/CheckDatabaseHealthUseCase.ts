import type { DatabaseHealth, IHealthCheck } from '../../ports/IHealthCheck';

export class CheckDatabaseHealthUseCase {
  constructor(private readonly health: IHealthCheck) {}

  async execute(): Promise<DatabaseHealth> {
    return this.health.checkDatabase();
  }
}
