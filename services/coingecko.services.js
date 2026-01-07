import fetch from 'node-fetch';
import { getCache, setCache } from '../utils/cache.js';

export async function fetchAllcoins({page, perPage, order = 'market_cap_desc' }) {

    const cacheKey = `allcoins_${page}_${perPage}_${order}`;   // Unique cache key based on parameters

    const cached = getCache(cacheKey);
    if(cached) {
        console.log("Returning cached data for key:", cacheKey);
        return cached;
    }
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

        setCache(cacheKey, data, 60_000); 

        return data;
    } catch (error) {
        console.error("Fetch All Coins Error:", error);
        throw error;
    }
}

export async function getSearchCoins(query) {

    const cacheKey = `search:${query.toLowerCase()}`;  // Unique cache key for search query

    const cached = getCache(cacheKey);  // Check cache first

    if(cached) {
        console.log("Returning cached search results for key:", cacheKey);
        return cached;
    }

    try {

    const response = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`, {
        headers: {
            "Content-Type": "application/json",
            "x-cg-demo-api-key": process.env.COINGECKO_API_KEY,
        },
    });
    
    if (!response.ok) {
        throw new Error(`Error searching coins: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    const result = data.coins.map(c => ({
        id: c.id,
        name: c.name,
        symbol: c.symbol,
        thumb: c.thumb
    }))

    setCache(cacheKey, result, 60_000);  // Cache the search results for 60 seconds

    return result;

  } catch (error) {
    console.error("Search Coins Error:", error);
    throw error;
  }
}