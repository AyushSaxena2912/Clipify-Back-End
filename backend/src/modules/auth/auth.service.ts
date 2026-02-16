import { pool } from "../../db/pool"
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

export const createUser = async (
  name: string,
  email: string,
  password: string
) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const id = uuidv4();

  await pool.query(
    `
    INSERT INTO users (id, name, email, password, provider)
    VALUES ($1, $2, $3, $4, 'local')
    `,
    [id, name, email, hashedPassword]
  );

  return { id, name, email };
};

export const findUserByEmail = async (email: string) => {
  const result = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );

  return result.rows[0] ?? null;
};