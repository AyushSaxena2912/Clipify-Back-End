import cors from "cors";
import express from "express";
import authRoutes from "./modules/auth/auth.routes";
import jobRoutes from "./modules/jobs/job.routes";
import path from "path";

const app = express();

/* -------------------- */
/*   CORS CONFIG        */
/* -------------------- */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true, // 🔥 important for auth cookies (future safe)
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());

/* -------------------- */
/*   Middlewares        */
/* -------------------- */
app.use(express.json());

/* -------------------- */
/*   Routes             */
/* -------------------- */
app.use("/auth", authRoutes);
app.use("/jobs", jobRoutes);

app.use(
  "/storage",
  express.static(path.resolve(process.cwd(), "storage"))
);

/* -------------------- */
/*   Health Check       */
/* -------------------- */
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Clipify backend is running",
  });
});

/* -------------------- */
/*   404 Handler        */
/* -------------------- */
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* -------------------- */
/*   Global Error       */
/* -------------------- */
app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled Error:", err.message);
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Internal server error",
    });
  }
);

export default app;