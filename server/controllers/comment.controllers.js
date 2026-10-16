import Comment from "../models/comment.model.js";
import Post from "../models/post.model.js";
import Reel from "../models/reel.model.js";
import { createNotification } from "../utils/notify.js";

const getFilter = (type, id) =>
    type === "post" ? { post: id } :
    type === "reel" ? { reel: id } :
    null;

export const getComments = async (req, res, next) => {
    try {
        const { type, id } = req.params;
        const filter = getFilter(type, id);

        if (!filter) {
            return res.status(400).json({
                message: "Content type must be post or reel"
            });
        }

        const exists = type === "post"
            ? await Post.exists({ _id: id })
            : await Reel.exists({ _id: id });

        if (!exists) {
            return res.status(404).json({
                message: "Content not found"
            });
        }

        const comments = await Comment.find(filter)
            .sort({ createdAt: 1 })
            .populate("user", "name username profileImage");

        return res.status(200).json({ comments });
    } catch (error) {
        next(error);
    }
};

export const createComment = async (req, res, next) => {
    try {
        const { type, id } = req.params;
        const text = req.body.text?.trim();
        const filter = getFilter(type, id);

        if (!filter) {
            return res.status(400).json({
                message: "Content type must be post or reel"
            });
        }

        if (!text) {
            return res.status(400).json({
                message: "Comment cannot be empty"
            });
        }

        if (text.length > 500) {
            return res.status(400).json({
                message: "Comment cannot exceed 500 characters"
            });
        }

        const exists = type === "post"
            ? await Post.exists({ _id: id })
            : await Reel.exists({ _id: id });

        if (!exists) {
            return res.status(404).json({
                message: "Content not found"
            });
        }

        const comment = await Comment.create({
            user: req.user._id,
            text,
            ...filter
        });

        const populatedComment = await Comment.findById(comment._id)
            .populate("user", "name username profileImage");

        const io = req.app.get("io");
        if (type === "post") {
            const post = await Post.findById(id).select("author");
            if (post) {
                createNotification(io, {
                    recipient: post.author,
                    sender: req.user._id,
                    type: "comment_post",
                    post: post._id,
                    comment: comment._id,
                    text: text.slice(0, 100)
                });
            }
        } else if (type === "reel") {
            const reel = await Reel.findById(id).select("author");
            if (reel) {
                createNotification(io, {
                    recipient: reel.author,
                    sender: req.user._id,
                    type: "comment_reel",
                    reel: reel._id,
                    comment: comment._id,
                    text: text.slice(0, 100)
                });
            }
        }

        return res.status(201).json({
            message: "Comment added successfully",
            comment: populatedComment
        });
    } catch (error) {
        next(error);
    }
};

export const deleteComment = async (req, res, next) => {
    try {
        const comment = await Comment.findById(req.params.commentId);

        if (!comment) {
            return res.status(404).json({
                message: "Comment not found"
            });
        }

        if (comment.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "You can delete only your own comments"
            });
        }

        await comment.deleteOne();

        return res.status(200).json({
            message: "Comment deleted successfully"
        });
    } catch (error) {
        next(error);
    }
};