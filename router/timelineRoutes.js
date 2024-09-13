import express from "express";
import { postTimeLine,deleteTimeLine, getAllTimeLines} from "../controller/timelineController.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

router.post("/add",isAuthenticated,postTimeLine );
router.delete("/delete/:id",isAuthenticated,deleteTimeLine);
router.get("/getall", getAllTimeLines);

export default router;
