import { fetchAllcoins } from "../services/coingecko.services.js";

// api
export async function getAllcoins(req, res) {
    try {
        const page = Number(req.query.page) || 1;   // Default to page 1
        const perPage = Number(req.query.per_page) || 50;  // Default to 50 items per page
        const order = req.query.order || 'market_cap_desc';

        if (perPage > 50) {
            return res.status(400).json({ message: "per_page cannot exceed 20" });
        }

        const coins = await fetchAllcoins({ page, perPage, order });

        return res.status(200).json({
            page,    // current page
            perPage,  // items per page
            order,  // order criteria
            count: coins.length, // number of coins returned
            data: coins  // coin data
        })
    } catch (error) {
        console.error("Error in getAllcoins controller:", error.message);
        return res.status(500).json({ 
            message: "Internal Server Error",
            error: error.message
        });
    }
}