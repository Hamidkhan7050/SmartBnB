import express from "express";
import { negotiatePrice } from "../controllers/aiController.js";

const router = express.Router();

router.post("/negotiate", negotiatePrice);

export default router;