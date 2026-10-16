import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";

import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.routes.js";
import reelRoutes from "./routes/reel.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import storyRoutes from "./routes/story.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import errorMiddleware from "./middlewares/error.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
    path: path.join(__dirname, ".env")
});

// Normalize environment variables for casing consistency
process.env.dbUrl = process.env.dbUrl || process.env.dbURL || process.env.MONGO_URI;
process.env.dbURL = process.env.dbUrl;
process.env.JWT_SECRET = process.env.JWT_SECRET || process.env.jwt_secret;
process.env.jwt_secret = process.env.JWT_SECRET;

const requiredEnvVars = [
    "dbUrl",
    "jwt_secret",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET"
];

const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
    console.error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);
    process.exit(1);
}

const app = express();
const httpServer = createServer(app);

const corsOriginHandler = (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);
    if (
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:")
    ) {
        return callback(null, true);
    }
    return callback(null, true);
};

const io = new Server(httpServer, {
    cors: {
        origin: corsOriginHandler,
        credentials: true
    }
});

// Make io accessible across all Express routes/controllers
app.set("io", io);

io.on("connection", (socket) => {
    socket.on("join_user", (userId) => {
        if (userId) {
            socket.join(userId.toString());
        }
    });

    socket.on("disconnect", () => {
        // user disconnected
    });
});

const port = process.env.PORT || 8084;

// Connect to MongoDB with timeout and fallback to local MongoDB if Atlas IP is blocked
const connectDatabase = async () => {
    const primaryUri = process.env.dbUrl || process.env.dbURL;
    const localUri = "mongodb://127.0.0.1:27017/social_media_app";

    try {
        await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 5000 });
        console.log("Connected to primary MongoDB");
    } catch (err) {
        console.warn(`Primary MongoDB connection failed (${err.message}). Attempting fallback to local MongoDB...`);
        try {
            await mongoose.connect(localUri, { serverSelectionTimeoutMS: 5000 });
            console.log("Connected to local MongoDB (mongodb://127.0.0.1:27017/social_media_app)");
        } catch (localErr) {
            console.error("Failed to connect to both primary and local MongoDB:", localErr.message);
        }
    }
};

connectDatabase();

app.use(cors({
    origin: corsOriginHandler,
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use("/users", userRoutes);
app.use("/posts", postRoutes);
app.use("/reels", reelRoutes);
app.use("/comments", commentRoutes);
app.use("/stories", storyRoutes);
app.use("/notifications", notificationRoutes);

app.use(errorMiddleware);


httpServer.listen(port, () => {
    console.log(`Server Started at ${port}`);
});