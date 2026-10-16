import Notification from "../models/notification.model.js";

/**
 * Creates and delivers a notification in real-time via Socket.io
 */
export const createNotification = async (io, {
    recipient,
    sender,
    type,
    post,
    reel,
    comment,
    text
}) => {
    try {
        if (!recipient || !sender) return null;
        if (recipient.toString() === sender.toString()) return null;

        // If duplicate unread notification of same type exists recently, avoid spamming
        const existing = await Notification.findOne({
            recipient,
            sender,
            type,
            ...(post ? { post } : {}),
            ...(reel ? { reel } : {}),
            read: false
        });

        let notification;
        if (existing && (type === "like_post" || type === "like_reel" || type === "follow")) {
            existing.updatedAt = new Date();
            await existing.save();
            notification = existing;
        } else {
            notification = await Notification.create({
                recipient,
                sender,
                type,
                post,
                reel,
                comment,
                text
            });
        }

        const populated = await Notification.findById(notification._id)
            .populate("sender", "name username profileImage")
            .populate("post", "caption image")
            .populate("reel", "caption video");

        if (io) {
            io.to(recipient.toString()).emit("new_notification", populated);
        }

        return populated;
    } catch (error) {
        console.error("Error creating notification:", error.message);
        return null;
    }
};
