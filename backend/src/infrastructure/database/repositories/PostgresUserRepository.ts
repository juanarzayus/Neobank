import { type NewUser, User } from '../../../domain/entities/User';
import { UsernameAlreadyInUseError } from '../../../domain/errors/DomainError';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { isUuid, type Queryable } from '../PostgresPool';

const UNIQUE_VIOLATION = '23505';

const toEntity = (row: any): User =>
  new User({
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    firstName: row.first_name,
    lastName: row.last_name,
    kycStatus: row.kyc_status,
    createdAt: new Date(row.created_at),
  });

export class PostgresUserRepository implements IUserRepository {
  constructor(private readonly db: Queryable) {}

  async findByUsername(username: string): Promise<User | null> {
    const { rows } = await this.db.query('SELECT * FROM users WHERE username = $1', [username]);
    return rows[0] ? toEntity(rows[0]) : null;
  }

  async findById(id: string): Promise<User | null> {
    if (!isUuid(id)) return null;
    const { rows } = await this.db.query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] ? toEntity(rows[0]) : null;
  }

  async create(data: NewUser): Promise<User> {
    try {
      const { rows } = await this.db.query(
        `INSERT INTO users (username, password_hash, first_name, last_name)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [data.username, data.passwordHash, data.firstName, data.lastName]
      );
      return toEntity(rows[0]);
    } catch (err) {
      if ((err as { code?: string }).code === UNIQUE_VIOLATION) throw new UsernameAlreadyInUseError();
      throw err;
    }
  }
}
