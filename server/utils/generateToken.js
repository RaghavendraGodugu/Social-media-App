import jwt from "jsonwebtoken";

const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET || process.env.jwt_secret,
        { expiresIn: "7d" }
    );
};

export default generateToken;