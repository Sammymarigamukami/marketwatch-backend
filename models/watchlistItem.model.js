import pool from "../config/db.js";

// Fetch all coins associated with a specific watchlist
export async function getCoinsForWatchlist(watchlistId) {
    const [rows] = await pool.execute(
        `SELECT c.cg_id, c.symbol, c.name
        FROM watchlist_items wi
        JOIN coins c ON wi.coin_id = c.id
        WHERE wi.watchlist_id = ?`, [watchlistId]
    );
    return rows;
}