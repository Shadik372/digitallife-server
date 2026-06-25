# 🧠 Digital Life Lessons - Server 

**Live API Base URL:** [https://digitallife-server-production.up.railway.app](https://digitallife-server-production.up.railway.app)

## 🎯 Project Purpose
This is the backend REST API for the Digital Life Lessons platform. It handles secure authentication, robust data validation, Stripe payment processing via webhooks, and complex MongoDB aggregation pipelines to serve dynamic statistics to the frontend.

## ✨ Key Features
* **Secure Routing:** JWT token verification middleware to protect private routes and ensure only owners or admins can modify/delete content
* **Stripe Webhooks:** Fully integrated Stripe checkout sessions and automated webhook listeners to upgrade users to Premium upon successful payment
* **Advanced Aggregations:** Utilizes highly optimized MongoDB aggregation pipelines to calculate "Top Contributors" and platform revenue without overloading server memory
* **Content Moderation API:** Dedicated endpoints for users to report lessons and for admins to review, dismiss, or permanently delete flagged content
* **Smart Validation:** Custom Mongoose schema validation to enforce logical constraints (e.g., minimum Stripe pricing limits only apply to Premium lessons).

## 📦 NPM Packages Used
* `express` (Web framework for Node.js)
* `mongoose` (MongoDB object modeling and schema validation)
* `stripe` (Payment gateway integration and webhook verification)
* `cors` (Cross-Origin Resource Sharing configuration)
* `dotenv` (Environment variable management)
* `better-auth` (Server-side authentication management)

## 🔐 Environment Variables
To run this server locally, create a `.env` file with the following keys: 
* `PORT` 
* `MONGODB_URI` 
* `BETTER_AUTH_SECRET` 
* `STRIPE_SECRET_KEY` 
* `STRIPE_WEBHOOK_SECRET` 
* `CLIENT_URL` 

