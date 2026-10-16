import Notification from "../models/notification.model.js";

export const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const notifications = await Notification.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate("sender", "name username profileImage")
            .populate("post", "caption image")
            .populate("reel", "caption video");

        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            read: false
        });

        return res.status(200).json({
            message: "Notifications fetched successfully",
            notifications,
            unreadCount
        });
    } catch (error) {
        next(error);
    }
};

export const markAllAsRead = async (req, res, next) => {
    try {
        const userId = req.user._id;

        await Notification.updateMany(
            { recipient: userId, read: false },
            { $set: { read: true } }
        );

        return res.status(200).json({
            message: "All notifications marked as read",
            unreadCount: 0
        });
    } catch (error) {
        next(error);
    }
};

export const markAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, recipient: userId },
            { $set: { read: true } },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            read: false
        });

        return res.status(200).json({
            message: "Notification marked as read",
            notification,
            unreadCount
        });
    } catch (error) {
        next(error);
    }
};

export const deleteNotification = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const notification = await Notification.findOneAndDelete({
            _id: id,
            recipient: userId
        });

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            read: false
        });

        return res.status(200).json({
            message: "Notification deleted",
            unreadCount
        });
    } catch (error) {
        next(error);
    }
};

export const clearAllNotifications = async (req, res, next) => {
    try {
        const userId = req.user._id;

        await Notification.deleteMany({ recipient: userId });

        return res.status(200).json({
            message: "All notifications cleared",
            unreadCount: 0
        });
    } catch (error) {
        next(error);
    }
};
