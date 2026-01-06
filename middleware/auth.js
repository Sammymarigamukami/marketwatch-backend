import jwt from "jsonwebtoken";
import 'dotenv/config';

export const authUser = async (req, res, next) => {

    const token  = req.cookies?.token;
    console.log("Authenticating user with token:", token);

    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded || !decoded.id) {
            return res.status(401).json({ message: "Unauthorized: Invalid token" });
        } else {
            req.userId = {id: decoded.id};
            next();
        }

    } catch (error) {
        return res.status(401).json({ message: "Unauthorized: Token verification failed" });
    }
}