import 'dotenv/config';
import { generateState } from '../auth/stateGenerator.js';
import pool from "../config/db.js";
import { generateAccessToken } from '../auth/tokenGenerator.js';
import fetch from 'node-fetch';
import crypto from 'crypto';

// api: /auth/github
export const authGithub = (req, res) => {
    const state = generateState();
    req.session.github_oauth_state = state;  // Store state in session for later verification

    const url = new URL("https://github.com/login/oauth/authorize");

    url.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID); // set client_id 
    url.searchParams.set("redirect_uri", process.env.GITHUB_CALLBACK_URL); // set redirect_uri
    url.searchParams.set("scope", "read:user user:email");   // read:user allows access to login(username, id, avatar_url, name, bio), user:email allows access to email addresses
    url.searchParams.set("state", state); // set state parameter used to prevent CSRF(cross-site request forgery) attacks

    console.log("Redirecting to Github OAuth URL:", url.toString());
    res.redirect(url.toString());
}

// api: /auth/github/callback
export const githubCallback = async (req, res) => {
    try {

        const { code, state } = req.query;
        const expected = req.session.github_oauth_state;  // Retrieve expected state from session

        if (!code || !state || state !== expected) {
            return res.status(403).send("Invalid state parameter");
        }

        delete req.session.github_oauth_state; // Clear state from session

        // Exchange authorization code for access token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: "POST",
            headers: { "Accept": "application/json" },
            body: new URLSearchParams({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
                redirect_uri: process.env.GITHUB_CALLBACK_URL
            })
        })

        const { access_token }  = await tokenResponse.json();  // Extract access token from response
        console.log("Github Token Response:", access_token);

        if (!access_token) {
            return res.status(500).json({
                message: "Failed to obtain access token from Github"
                
            })
        }

        // Fetch user data from Github API parallel execustion for user info and emails
        const [userResponse, emailResponse] = await Promise.all([
            fetch("https://api.github.com/user", {
                headers: {Authorization: `Bearer ${access_token}`}
            }),
            fetch("https://api.github.com/user/emails", {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    Accept: "application/vnd.github.v3+json"
                }
            })
        ]);
        if (!emailResponse.ok || !userResponse.ok) {
            return res.status(500).json({
                message: "Failed to fetch user email from Github"
            })
        }

        const userData = await userResponse.json();  // Extract user data from response
        const emailData = await emailResponse.json();  // Extract email data from response

        const email = emailData.find((e) => e.primary && e.verified)?.email || 
        emailData.find(e => e.verified)?.email;
        
        if (!email) {
            return res.status(400).json({
                message: "No verified primary email found for Github user"
            })
        }

        console.log("Github User Data:", {
            name: userData.name,
            email,
        });

        let userId;   // To store the user ID

        // Check if user already exists based on Github provider_user_id
        const [ authRows ] = await pool.execute(
            "SELECT user_id FROM user_auth_providers WHERE provider='github' AND provider_user_id = ?",[userData.id]
        );

        // if this github was linked before proceed to login
        if (authRows.length) {
            userId = authRows[0].user_id;   // Existing user ID

        } else {  // if not linked before, check if github email is the same as an existing user in users table
            const [ userRows ] = await pool.execute(
                "SELECT id FROM users WHERE email = ?", [email]  // check by email
            );

            // if email exists( user signed up before with local or other social login ) link github to that user
            if (userRows.length) {
                // Existing user found with the same email proceed 
                userId = userRows[0].id;
            } else {

                await pool.execute(
                    "INSERT INTO users (email) VALUES (?)", [email]
                );

                const [rows] = await pool.execute(
                    "SELECT id FROM users WHERE email = ?", [email]
                );
                userId = rows[0].id;
            }

            await pool.execute(
                "INSERT INTO user_auth_providers (user_id, provider, provider_user_id) VALUES (?, 'github', ?)",[userId, userData.id]
            );
        }

        // Generate JWT token for the user
        const token = generateAccessToken({ id: userId });
        const refreshToken = crypto.randomBytes(40).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        console.log("access token: ", token);

        await pool.execute(
            "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",[userId, tokenHash, expiresAt]
        );

        // Set access token cookie
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        // Set refresh token cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            path: "/auth/refresh-token",   // restrict refresh token cookie to only be sent to this endpoint
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.redirect('http://localhost:3000/dashboard'); // Redirect to frontend dashboard or path of user choice after successful login
    } catch (error) {
        return res.status(500).json({
            message: "Error during Github Oauth callback",
            error: error.message
        })
    }
}

// Google

// api: /auth/google
export const authGoogle = (req, res) => {
    const state = generateState();
    req.session.google_oauth_state = state;  // Store state in session for later verification

    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");

    url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID); // set client_id
    url.searchParams.set("redirect_uri", process.env.GOOGLE_CALLBACK_URL); // set redirect_uri
    url.searchParams.set("response_type", "code");   // response type
    url.searchParams.set("scope", "openid email profile");  // 
    url.searchParams.set("state", state); // set state parameter used to prevent CSRF(cross-site request forgery) attacks

    console.log("Redirecting to Google OAuth URL:", url.toString());
    res.redirect(url.toString());
}

// api: /auth/google/callback
export const googleCallback = async (req, res) => {
    try {
        const { code, state } = req.query;
        const expected = req.session.google_oauth_state;  // Retrieve expected state from session

        // Verify the state parameter to prevent CSRF attacks
        if (!code || !state || state !== expected) {
            return res.status(403).send("Invalid state parameter");
        }

        delete req.session.google_oauth_state; // Clear state from session

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                code,
                redirect_uri: process.env.GOOGLE_CALLBACK_URL,
                grant_type: 'authorization_code',
            })
        });
        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) {
            return res.status(500).json({
                message: "Failed to obtain access token from Google",
                error: tokenData
            })
        }
        const { access_token } = tokenData;
        if (!access_token) {
            return res.status(500).json({
                message: "No access token received from Google"
            })
        }
        console.log("Google Token Response:", tokenData);

        const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` }
        });
        const profileData = await profileResponse.json();

        if (!profileResponse.ok) {
            return res.status(500).json({
                message: "Failed to fetch user profile from Google",
                error: profileData
            })
        }

        const { id, email, name } = profileData;

        console.log("Google User Data:", {
            id,
            email,
            name
        });

        let userId;  // To store the user ID

        // Check if user already exists based on Google provider_user_id
        const [ authRows ] = await pool.execute(
            "SELECT user_id FROM user_auth_providers WHERE provider='google' AND provider_user_id = ?",[id]
        )

        if (authRows.length) {
            userId = authRows[0].user_id;   // Existing user ID
        } else {
            // Check if user exists based on email
            const [ userRows ] = await pool.execute(
                "SELECT id FROM users WHERE email = ?", [email]
            );

            // if email exists( user signed up before with local or other social login ) link google to that user
            if (userRows.length) {
                userId = userRows[0].id;   // Existing user ID
            } else {

                await pool.execute(
                    "INSERT INTO users (email) VALUES (?)", [email]
                );
                const [rows] = await pool.execute(
                    "SELECT id FROM users WHERE email = ?", [email]
                );
                userId = rows[0].id;
            }

            await pool.execute(
                "INSERT INTO user_auth_providers (user_id, provider, provider_user_id) VALUES (?, 'google', ?)",[userId, id]
            )
        }


        const token = generateAccessToken({ id: userId });
        const refreshToken = crypto.randomBytes(40).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        await pool.execute(
            "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",[userId, tokenHash, expiresAt]
        );

        console.log("All information saved in db", { userId, token, refreshToken });

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            path: "/",
            maxAge: 15 * 60 * 1000 // 15 minutes
        })

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            path: "/auth/refresh-token",   // restrict refresh token cookie to only be sent to this endpoint
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.redirect('http://localhost:3000/dashboard'); // Redirect to frontend dashboard after successful login

    } catch (error) {
        return res.status(500).json({
            message: "Error during Google Oauth callback",
            error: error.message
        })
    }
}