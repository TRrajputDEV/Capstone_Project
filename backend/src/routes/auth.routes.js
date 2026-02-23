import { Router } from "express";
import passport from "../config/passport.js";
import {
  register, login, logout,
  getCurrentUser, googleAuthCallback
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", verifyJWT, logout);
router.get("/me", verifyJWT, getCurrentUser);
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));
router.get("/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.CORS_ORIGIN}/login?error=oauth_failed`,
    session: false
  }),
  googleAuthCallback
);

export default router;