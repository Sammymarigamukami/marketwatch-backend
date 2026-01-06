import express from "express";
import cookieParser from "cookie-parser";
import "dotenv/config";
import pool from "./config/db.js";
import userRouter from "./routes/userRoute.js";
import socialRouter from "./routes/userSocialRoute.js";
import session from "express-session";
import watchlistRouter from "./routes/watchlist.routes.js";
import cors from "cors";

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
app.use(cors({
    origin: "http://localhost:3000",   // Frontend URL
    credentials: true,     // Allow cookies to be sent
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));   // Parse URL-encoded bodies
app.use(cookieParser());

// Session middleware for OAuth state management
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        secure: process.env.NODE_ENV === "production"
    }
}))

app.use((req, res, next) => {
    console.log("Raw Cookies token:", req.cookies?.token);
    next();
})



// Routes
app.use("/api/user", userRouter);
app.use("/auth", socialRouter);
app.use("/api/watchlist", watchlistRouter);


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});