// server/auth/jwt.js
import jwt from "jsonwebtoken";
import { config } from "../config.js";

export function signJwt(payload) {
    if (!config.jwtSecret) {
        throw new Error("JWT_SECRET mancante (config.jwtSecret undefined)");
    }
    return jwt.sign(payload, config.jwtSecret, { expiresIn: "12h" });
}

export function verifyJwt(token) {
    if (!config.jwtSecret) {
        throw new Error("JWT_SECRET mancante (config.jwtSecret undefined)");
    }
    return jwt.verify(token, config.jwtSecret);
}
