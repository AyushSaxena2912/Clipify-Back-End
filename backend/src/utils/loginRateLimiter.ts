import { redis } from "../queue/redis";

const MAX_ATTEMPTS = 7;
const BLOCK_TIME = 30 * 60; // 30 minutes

export const checkLoginAttempts = async (email: string) => {
  const key = `login_attempts:${email}`;

  const attempts = await redis.get(key);

  if (attempts && parseInt(attempts) >= MAX_ATTEMPTS) {
    return false; // blocked
  }

  return true;
};

export const recordFailedLogin = async (email: string) => {
  const key = `login_attempts:${email}`;

  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, BLOCK_TIME);
  }

  return current;
};

export const resetLoginAttempts = async (email: string) => {
  const key = `login_attempts:${email}`;
  await redis.del(key);
};