// server/src/auth/password.js
import bcrypt from "bcryptjs";

export async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

export async function verifyPassword(password, hash) {
    if (!hash) throw new Error("Password hash mancante (DB: password_hash null/undefined)");
    return bcrypt.compare(password, hash);
}
