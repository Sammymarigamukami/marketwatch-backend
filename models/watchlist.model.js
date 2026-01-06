import pool from "../config/db.js";

export async function getWatchListById(id) {
    const [rows] = await pool.execute(
        "SELECT id, name FROM watchlists WHERE id = ?", [id]
    );    return rows[0];  // Return the first row (should be only one since id is unique)
}