import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/user.model.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("[Google OAuth] Profile received:", profile.id, profile.emails[0].value);

        let user = await User.findOne({ googleId: profile.id });
        console.log("[Google OAuth] Existing user by googleId:", user ? user.email : "none");

        if (!user) {
          user = await User.findOne({ email: profile.emails[0].value });
          console.log("[Google OAuth] Existing user by email:", user ? user.email : "none");

          if (user) {
            user.googleId = profile.id;
            user.avatar = profile.photos[0]?.value || "";
            await user.save();
            console.log("[Google OAuth] Linked Google to existing account:", user.email);
          } else {
            user = await User.create({
              googleId: profile.id,
              email: profile.emails[0].value,
              username: profile.displayName.toLowerCase().replace(/\s+/g, "_") + "_" + Date.now(),
              avatar: profile.photos[0]?.value || "",
            });
            console.log("[Google OAuth] New user created:", user.email);
          }
        }

        return done(null, user);
      } catch (err) {
        console.error("[Google OAuth] Error in strategy:", err);
        return done(err, null);
      }
    }
  )
);

export default passport;