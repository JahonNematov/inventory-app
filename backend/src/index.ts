import express from "express";
import cors from "cors";
import session from "express-session";
import cookieParser from "cookie-parser";
import passport from "passport";
import dotenv from "dotenv";
import path from "path";

// Passport strategies — must be imported before routes
import "./config/passport";

// Routes
import authRoutes from "./routes/auth";
import inventoryRoutes from "./routes/inventories";
import itemRoutes from "./routes/items";
import userRoutes from "./routes/users";
import searchRoutes from "./routes/search";
import adminRoutes from "./routes/admin";
import uploadRoutes from "./routes/upload";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true, // cookies uchun muhim!
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 kun
    },
  }),
);
app.use(passport.initialize());
app.use(passport.session());

// Static files — uploaded images
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Routes
app.use("/auth", authRoutes);
app.use("/api/inventories", inventoryRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/users", userRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
