import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { startCleanupWorker } from "./cleanup/cleanup.worker";

const PORT = process.env.PORT || 8000;

startCleanupWorker();  

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});