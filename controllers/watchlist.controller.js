import pool from "../config/db.js";
// Endpoint: POST /api/watchlist/:watchlistId/coins

export async function addCoinToWatchlist(req, res) {
    try {
        const { cg_id } = req.body || {};  // object destructuring to try and extract a property named cg_id
        const userId = req.userId?.id;  // 
        console.log("cg_id", cg_id);
        console.log("userId", userId)
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!cg_id) {
            return res.status(400).json({ message: "cg_id is required"});
        }

        const [existing] = await pool.execute(
            "SELECT 1 FROM watchlists WHERE user_id = ? AND name = ?",   // SQL query to check for existing entry
            [userId, cg_id] 
        );
        if(existing.length) {
            return res.status(409).json({ message: "Coin already in watchlist "});
        }

        await pool.execute(
            "INSERT INTO watchlists (user_id, name) VALUES (?, ?)",
            [userId, cg_id]
        );

        return res.status(201).json({
            message: "Coin added successfully",
            cg_id
        });

    } catch (error) {
        console.error("Error adding coin:", error);
        return res.status(500).json({ message: "Server error" });
    }
}


// Endpoint : api/watchlist
export async function getWatchlist(req, res) {
    try {
        const userId = req.userId?.id;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized "});
        }

        const [rows] = await pool.execute(
            "SELECT name AS cg_id FROM watchlists WHERE user_id = ?", [userId]
        );

        if(rows.length===0){
            return res.status(404).json({ message: ""})
        }

        return res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching watchlist:", error);
        return res.status(500).json({ message: "server error"})
    }
}


export async function removeCoinFromWatchlist(req, res) {
    try {
        const  cg_id  = req.body.cg_id  // Extract coin ID from URL parameters
        const userId = req.userId.id;        // Use the userId directly from middleware

        console.log("Headers:", req.headers);
        console.log("body:", req.body);
        console.log("Cookies:", req.cookies);
        console.log("userId", userId, "cg_id", cg_id);

        if (!userId) return res.status(401).json({ message: "Unauthorized" });
        if (!cg_id) return res.status(400).json({ message: "cg_id is required" });

        const [result] = await pool.execute(
            "DELETE FROM watchlists WHERE user_id = ? AND name = ?", [userId, cg_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Coin not found in watchlist" });
        }

        return res.status(200).json({ message: "Coin removed", cg_id });
    } catch (error) {
        console.error("Error removing coin:", error); 
        return res.status(500).json({ message: "Server error" });
    }
}


