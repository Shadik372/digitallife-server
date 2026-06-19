import { verifyRole } from "./verifyRole.js";

export const verifyAdmin = verifyRole(["admin"]);