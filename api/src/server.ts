import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import familyRoutes from "./routes/family.js";
import wishlistRoutes from "./routes/wishlist.js";

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

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

const port = process.env.PORT ?? 3001;
app.listen(port, () => console.log(`API on :${port}`));
