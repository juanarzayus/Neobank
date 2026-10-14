import { pool } from '../PostgresPool';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  kycStatus: string;
  createdAt: string;
}

const map = (row: any): UserRecord => ({
  id: row.id,
  email: row.email,
  passwordHash: row.password_hash,
  firstName: row.first_name,
  lastName: row.last_name,
  kycStatus: row.kyc_status,
  createdAt: new Date(row.created_at).toISOString(),
});

export const PostgresUserRepository = {
  async findByEmail(email: string): Promise<UserRecord | null> {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] ? map(rows[0]) : null;
  },

  async findById(id: string): Promise<UserRecord | null> {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] ? map(rows[0]) : null;
  },

  async create(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
  }): Promise<UserRecord> {
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [data.email, data.passwordHash, data.firstName, data.lastName]
    );
    return map(rows[0]);
  },
};
