import express from "express";
import jobRoutes from "./modules/jobs/job.routes";

const app = express();

/* Middlewares */
app.use(express.json());

/* Routes */
app.use("/jobs", jobRoutes);

/* Health Check */
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Clipify backend is running"
  });
});

/* 404 Handler */
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

/* Global Error Handler */
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

export default app;