import crypto from "crypto";

export function generateState() {
    return crypto.randomBytes(16).toString("hex");
}