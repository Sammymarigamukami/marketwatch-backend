import express from "express";
import cookieParser from "cookie-parser";
import "dotenv/config";
import pool from "./config/db.js";
import userRouter from "./routes/userRoute.js";

const app = express();
const PORT = process.env.PORT || 4000;

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

// Routes
app.use("/api/user", userRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});