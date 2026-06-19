import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

export const auth = betterAuth({
  database: mongodbAdapter(db),
  
  // Explicitly trust the frontend URL to fix the 403 Forbidden CORS error
  trustedOrigins: [process.env.CLIENT_URL || "http://localhost:3000"],
  
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, 
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "placeholder",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder",
    }
  },
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "buyer" },
      isPremium: { type: "boolean", required: false, defaultValue: false },
      photoURL: { type: "string", required: false }
    }
  }
});