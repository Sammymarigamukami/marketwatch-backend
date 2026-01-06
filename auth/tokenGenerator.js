import jwt from "jsonwebtoken";
import "dotenv/config";

export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};
