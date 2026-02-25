import Redis from "ioredis";

/*
  Main Redis client
  - Queues (lpush, brpop)
  - Publish events
  - Normal commands
*/
export const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
});

/*
  Separate Redis client
  - ONLY for Pub/Sub (SSE)
  - Never use this for normal commands
*/
export const redisSubscriber = new Redis({
  host: "127.0.0.1",
  port: 6379,
});

/* ----------------------------- */
/* CONNECTION LOGGING            */
/* ----------------------------- */

redis.on("connect", () => {
  console.log("Redis connected (main client)");
});

redisSubscriber.on("connect", () => {
  console.log("Redis connected (subscriber client)");
});

redis.on("error", (err) => {
  console.error("Redis error (main):", err);
});

redisSubscriber.on("error", (err) => {
  console.error("Redis error (subscriber):", err);
});