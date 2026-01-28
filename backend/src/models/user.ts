import pool from '../db/connection.js';
import { UserData } from '../types/index.js';

export class User implements UserData {
  id: string;
  email: string;
  passwordHash: string;
  enrolled: boolean;
  createdAt: Date;

  constructor(data: UserData) {
    this.id = data.id;
    this.email = data.email;
    this.passwordHash = data.passwordHash;
    this.enrolled = data.enrolled;
    this.createdAt = data.createdAt;
  }

  static async create(email: string, passwordHash: string): Promise<User> {
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, enrolled) VALUES ($1, $2, $3) RETURNING *',
      [email.toLowerCase(), passwordHash, false]
    );
    
    const row = result.rows[0];
    return new User({
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      enrolled: row.enrolled,
      createdAt: row.created_at,
    });
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return new User({
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      enrolled: row.enrolled,
      createdAt: row.created_at,
    });
  }

  static async findById(id: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return new User({
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      enrolled: row.enrolled,
      createdAt: row.created_at,
    });
  }

  static async markEnrolled(userId: string): Promise<User | null> {
    const result = await pool.query(
      'UPDATE users SET enrolled = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [true, userId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return new User({
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      enrolled: row.enrolled,
      createdAt: row.created_at,
    });
  }
}
