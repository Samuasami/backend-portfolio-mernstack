import express from "express";
import { addNewSkill, deleteSkill, updateSkill, getAllSkill } from "../controller/skillController.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

// Routes
router.post("/add", isAuthenticated, addNewSkill);
router.delete("/delete/:id", isAuthenticated, deleteSkill); // Changed to DELETE method
router.put("/update/:id", isAuthenticated, updateSkill);
router.get("/getall", getAllSkill);

export default router;
