import jwt from 'jsonwebtoken';
import 'dotenv/config';


export const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user.id},    // Payload
        process.env.JWT_SECRET,   // Secret key
        { expiresIn: parseInt(process.env.JWT_EXPIRES_IN) }  // Token expiration time
    );
};