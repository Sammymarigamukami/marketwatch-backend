import express from "express";
import cookieParser from "cookie-parser";
import "dotenv/config";
import pool from "./config/db.js";
import userRouter from "./routes/userRoute.js";
import socialRouter from "./routes/userSocialRoute.js";
import session from "express-session";


const app = express();
const PORT = 4000;

// Test DB Connection
try {
    await pool.getConnection();
    console.log("Database connected successfully");
} catch (error) {
    console.error("Database connection failed:", error.message);
}

// Middleware
app.use(express.json());
app.use(cookieParser());
// Session middleware for OAuth state management
app.use(session({
    name: "oauth_session",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: "lax"
    }
}))

// Routes
app.use("/api/user", userRouter);
app.use("/auth", socialRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});