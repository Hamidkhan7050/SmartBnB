import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { requireAuth } from "@clerk/express";
import { registerHotel } from "../controllers/hotelController.js";

const hotelRouter = express.Router();

hotelRouter.post("/",requireAuth(), protect, registerHotel);

export default hotelRouter;
