import express from "express";
import {
  changePassword,
  getProfile,
  getUsersCount,
  updateProfile,
} from "../controllers/userControllers";
import { deleteUser } from "../services/userServices";
import { authenticate } from "../../../shared/middlewares/authMiddleware";

const router = express.Router();

router.get("/me", authenticate, getProfile);
router.put("/update-profile", authenticate, updateProfile);

router.put("/change-password", authenticate, changePassword);

router.delete("/:id", deleteUser);

router.get("/countUsers", getUsersCount);

export default router;
