import { redis } from "../queue/redis";

const MAX_JOBS_PER_HOUR = 10;
const WINDOW_SECONDS = 60*60;

export const checkJobRateLimit = async(userId:string) => {
    const key = `job_limit ${userId}`;
    const current = await redis.incr(key);
    if(current==1) {
        await redis.expire(key, WINDOW_SECONDS);       
    };

  if (current > MAX_JOBS_PER_HOUR) {
    return false;
  };
  return true;
}