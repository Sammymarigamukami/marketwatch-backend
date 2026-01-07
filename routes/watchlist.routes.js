import express from "express";
import { addCoinToWatchlist, getWatchlist, removeCoinFromWatchlist } from "../controllers/watchlist.controller.js";
import { authUser } from "../middleware/auth.js";
import { getAllcoins } from "../controllers/getAllCoin.cotroller.js";
import { searchCoins } from "../controllers/searchCoin.controller.js";

const watchlistRouter = express.Router();


watchlistRouter.get("/all_coin-in-Watchlist", authUser, getWatchlist);
watchlistRouter.post("/:coinId/add-coin", authUser, addCoinToWatchlist);
watchlistRouter.delete("/:coinId/remove-coin", authUser, removeCoinFromWatchlist);
watchlistRouter.get("/all-coin_dashboard",getAllcoins);
watchlistRouter.get("/search-coin/:q", searchCoins);

export default watchlistRouter;