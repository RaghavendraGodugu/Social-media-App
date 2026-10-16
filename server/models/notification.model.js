import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        type: {
            type: String,
            enum: [
                "like_post",
                "like_reel",
                "comment_post",
                "comment_reel",
                "follow",
                "story"
            ],
            required: true
        },
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post"
        },
        reel: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Reel"
        },
        comment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        },
        text: {
            type: String,
            trim: true,
            maxlength: 300
        },
        read: {
            type: Boolean,
            default: false,
            index: true
        }
    },
    { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
