import fetch from 'node-fetch';

export async function fetchAllcoins({
    page = 1,
    perPage = 50,
    order = 'market_cap_desc'
} = {}) {
    try {
        const url = `https://api.coingecko.com/api/v3/coins/markets` + 
        `?vs_currency=usd` +
        `&order=${order}` +
        `&per_page=${perPage}` +
        `&page=${page}` +
        `&sparkline=false`;

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                "x-cg-demo-api-key": process.env.COINGECKO_API_KEY,
            },
        });

        if (!response.ok) {
            throw new Error(`Error fetching coins: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {  // Ensure the response is an array
            throw new Error(`Unexpected response format: ${JSON.stringify(data)}`);
        }
        return data;
    } catch (error) {
        console.error("Fetch All Coins Error:", error);
        throw error;
    }
}