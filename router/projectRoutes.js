import express from "express";
import { addNewProject, deleteProject, updateProject, getAllProjects,getSingleProject } from "../controller/projectController.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

// Routes
router.post("/add", isAuthenticated, addNewProject);
router.delete("/delete/:id", isAuthenticated, deleteProject); // Changed to DELETE method
router.put("/update/:id", isAuthenticated, updateProject);
router.get("/getall", getAllProjects);
router.get("/get/:id", getSingleProject);

export default router;
