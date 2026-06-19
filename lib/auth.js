import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

// Create a dedicated native client for Better Auth
const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db(); // Synchronously prepares the DB object

export const auth = betterAuth({
  database: mongodbAdapter(db),
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