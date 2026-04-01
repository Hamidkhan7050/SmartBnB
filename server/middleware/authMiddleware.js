import User from "../models/User.js";
import { clerkClient } from "@clerk/clerk-sdk-node";

export const protect = async (req, res, next) => {
  try {
    const { userId } = req.auth;

    if (!userId) {
      return res.json({ success: false, message: "Not authenticated" });
    }

    let user = await User.findOne({ clerkId: userId });

    if (!user) {
      console.log("Fetching user from Clerk...");

      const clerkUser = await clerkClient.users.getUser(userId);

      user = await User.create({
        clerkId: userId,
        username:
          clerkUser.firstName + " " + clerkUser.lastName,
        email: clerkUser.emailAddresses[0].emailAddress,
        image: clerkUser.imageUrl,
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Auth error" });
  }
};