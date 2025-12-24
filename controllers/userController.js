import pool from "../config/db.js";
import { generateAccessToken } from "../auth/tokenGenerator.js";
import bcrypt from "bcrypt";
import crypto from "crypto";

// register user: /api/user/register
export const register = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const [row] = await pool.execute(
            "SELECT email FROM users WHERE email = ?",
            [email]
        );

        if (row.length > 0) {
            return res.status(409).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const [result] = await pool.execute(
            "INSERT INTO users (email) VALUES (?)",
            [email]
        );
        await pool.execute(
            `INSERT INTO user_auth_providers (user_id, provider, password_hash) VALUE (?, 'local', ?)`,
            [result.insertId, hashedPassword]
        )

        const token = generateAccessToken({ id: result.insertId, email });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: parseInt(process.env.JWT_EXPIRES_IN),
        });

        return res.status(201).json({ 
            message: "User registered successfully", 
            userId: result.insertId 
        });
        
    } catch (error) {
        return res.status(500).json({ 
            message: "Error registering user", 
            error: error.message 
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });   
    }
        const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [email]);

        if (!rows.length) {
            return res.status(404).json({ message: "User not found" });
        }

        const user = rows[0];
        const [providers] = await pool.execute(
            `SELECT p.password_hash FROM user_auth_providers p WHERE p.user_id = ? AND p.provider = 'local'`,
            [user.id]
        );

        if (!providers.length || !providers[0].password_hash) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const isPasswordValid = await bcrypt.compare(password, providers[0].password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = generateAccessToken({ id: user.id, email: user.email });
        const refreshToken = crypto.randomBytes(40).toString('hex');

        const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        await pool.execute(
            `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)`,
            [user.id, tokenHash, expiresAt]
        );

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",  
        });
        return res.status(200).json({ message: "Login successful" }, token);
    } catch (error) {
        return res.status(500).json({ 
            message: "Error logging in user", 
            error: error.message 
        });
    }
}