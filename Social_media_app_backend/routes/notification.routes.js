import express from "express";
import isAuthenticated from "../middlewares/authMiddleware.js";
import {
    getNotifications,
    markAllAsRead,
    markAsRead,
    deleteNotification,
    clearAllNotifications
} from "../controllers/notification.controllers.js";

const notificationRoutes = express.Router();

notificationRoutes.get("/", isAuthenticated, getNotifications);
notificationRoutes.patch("/read-all", isAuthenticated, markAllAsRead);
notificationRoutes.patch("/:id/read", isAuthenticated, markAsRead);
notificationRoutes.delete("/clear-all", isAuthenticated, clearAllNotifications);
notificationRoutes.delete("/:id", isAuthenticated, deleteNotification);

export default notificationRoutes;
