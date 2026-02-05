import "dotenv/config";

export const config = {
    port: Number(process.env.PORT || 8080),
    databaseUrl: process.env.DATABASE_URL || "",
    jwtSecret: process.env.JWT_SECRET || "",
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
};

if (!config.databaseUrl) throw new Error("Missing DATABASE_URL");
if (!config.jwtSecret) throw new Error("Missing JWT_SECRET");
