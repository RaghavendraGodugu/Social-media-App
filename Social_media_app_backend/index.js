
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

// --------------------------------------------------
// 1. Load environment variables
// --------------------------------------------------

dotenv.config({
    path: path.join(__dirname, ".env"),
});

// Normalize environment variable names.
process.env.dbUrl =
    process.env.dbUrl ||
    process.env.dbURL ||
    process.env.MONGO_URI;

process.env.JWT_SECRET =
    process.env.JWT_SECRET ||
    process.env.jwt_secret;

const requiredEnvVars = [
    "dbUrl",
    "JWT_SECRET",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
];

const missingEnvVars = requiredEnvVars.filter(
    (key) => !process.env[key]
);

if (missingEnvVars.length > 0) {
    console.error(
        `Missing required environment variables: ${missingEnvVars.join(", ")}`
    );
    process.exit(1);
}

// --------------------------------------------------
// 2. Initialize Express and HTTP server
// --------------------------------------------------

const app = express();
const httpServer = createServer(app);

const port = process.env.PORT || 8084;

// Render terminates HTTPS at its proxy.
if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

// --------------------------------------------------
// 3. Configure CORS
// --------------------------------------------------

const allowedOrigins = new Set([
    "https://social-media-app-psi-gilt.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]);

const corsOptions = {
    origin(origin, callback) {
        // Requests without an Origin header, such as curl.
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.has(origin)) {
            return callback(null, true);
        }

        return callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
    ],
};

// --------------------------------------------------
// 4. Configure Socket.IO
// --------------------------------------------------

const io = new Server(httpServer, {
    cors: corsOptions,
});

app.set("io", io);

io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join_user", (userId) => {
        if (userId) {
            socket.join(userId.toString());
        }
    });

    socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
    });
});

// --------------------------------------------------
// 5. Register middleware BEFORE routes
// --------------------------------------------------

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --------------------------------------------------
// 6. Health check
// --------------------------------------------------

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Social Media API is running",
    });
});

// --------------------------------------------------
// 7. API routes
// --------------------------------------------------

app.use("/users", userRoutes);
app.use("/posts", postRoutes);
app.use("/reels", reelRoutes);
app.use("/comments", commentRoutes);
app.use("/stories", storyRoutes);
app.use("/notifications", notificationRoutes);

// --------------------------------------------------
// 8. Error-handling middleware (must be last)
// --------------------------------------------------

app.use(errorMiddleware);

// --------------------------------------------------
// 9. MongoDB connection
// --------------------------------------------------

const connectDatabase = async () => {
    try {
        await mongoose.connect(process.env.dbUrl, {
            serverSelectionTimeoutMS: 10000,
        });

        console.log("Connected to MongoDB successfully");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
};

// --------------------------------------------------
// 10. Start server after database connection
// --------------------------------------------------

const startServer = async () => {
    try {
        await connectDatabase();

        httpServer.listen(port, () => {
            console.log(`Server started on port ${port}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();
