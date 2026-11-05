export type DatabaseHealth = { ok: true; time: Date } | { ok: false; code: string };

export interface IHealthCheck {
  checkDatabase(): Promise<DatabaseHealth>;
}
