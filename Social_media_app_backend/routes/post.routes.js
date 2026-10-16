import express from "express";
import {
    createPost,
    getFeed,
    getPostsByUsername,
    togglePostLike,
    searchPosts
} from "../controllers/post.controllers.js";
import isAuthenticated from "../middlewares/authMiddleware.js";
import upload from "../middlewares/upload.middlerware.js";

const postRoutes = express.Router();

postRoutes.get(
    "/search",
    isAuthenticated,
    searchPosts
);

postRoutes.post(
    "/",
    isAuthenticated,
    upload.single("image"),
    createPost
);

postRoutes.get(
    "/feed",
    isAuthenticated,
    getFeed
);

postRoutes.get(
    "/user/:username",
    isAuthenticated,
    getPostsByUsername
);

postRoutes.patch(
    "/:id/like",
    isAuthenticated,
    togglePostLike
);

export default postRoutes;