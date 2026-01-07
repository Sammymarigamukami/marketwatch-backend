import { getSearchCoins } from "../services/coingecko.services.js";

export async function searchCoins(req, res) {
    try {
        const q = req.params.q?.trim();
        console.log("query parameter", req.params);

        if (!q) {
            return res.status(400).json({
                message: "Query parameter 'q' is required"
            });
        }

        const results = await getSearchCoins(q);

        return res.status(200).json(results);

    } catch (error) {
        console.error("SearchCoins controller error:", error.message);

        return res.status(500).json({
            message: "Failed to search coins"
        });
    }
}