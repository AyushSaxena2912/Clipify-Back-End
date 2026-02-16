import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

export const env = {
  port: Number(process.env.PORT || "8000"),
  host: process.env.HOST || "127.0.0.1",
  databaseUrl: process.env.DATABASE_URL
};
