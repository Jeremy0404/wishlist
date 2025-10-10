import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import familyRoutes from "./routes/family.js";
import wishlistRoutes from "./routes/wishlist.js";
import { logger } from "./logging/logger.js";
import { pinoHttp } from "pino-http";

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

app.use(
  pinoHttp({
    logger,
    genReqId: (req) => {
      const hdr =
        (req.headers["x-request-id"] as string) ||
        (req.headers["x-correlation-id"] as string);
      if (hdr) return hdr;

      return crypto.randomUUID();
    },
    customProps: (req, _res) => {
      const userId = (req as any)?.user?.id;
      return {
        route: req.method + " " + req.url,
        userId,
      };
    },
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url,
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.set("trust proxy", true);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/families", familyRoutes);

app.use("/wishlists", wishlistRoutes);

app.use((err: any, req: any, res: any, _next: any) => {
  const log = req?.log ?? logger;
  log.error(
    {
      err,
      route: req?.method + " " + req?.url,
      userId: req?.user?.id,
    },
    "Unhandled error",
  );
  res.status(err?.status ?? 500).json({ error: "Erreur serveur" });
});

const port = process.env.PORT ?? 3001;
app.listen(port, () => logger.info(`API on :${port}`));
