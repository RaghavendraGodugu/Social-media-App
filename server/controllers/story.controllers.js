import Story from "../models/story.model.js";
import User from "../models/user.model.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";


const STORY_LIFETIME = 24 * 60 * 60 * 1000 // 24hrs - ms


export const createStory = async (req, res) => {
    try {

        const caption = req.body.caption?.trim()

        if (!caption || !req.file) {
            return res.status(400).json({ message: "Add an image and a caption" })
        }

        if (caption.length > 200) {
            return res.status(400).json({ message: "Caption cannot be greater than 200 characters" })
        }

        const uploadedImage = await uploadToCloudinary(req.file.buffer)
        const image = uploadedImage.secure_url


        const newStory = await Story.create({
            image,
            caption,
            author: req.user._id,
            expiresAt: new Date(Date.now() + STORY_LIFETIME)

        })

        await User.findByIdAndUpdate(req.user._id, {
            $push: { stories: newStory._id }
        })


        const populatedStoryData = await Story.findById(newStory._id).populate('author', 'name username profileImage')







        return res.status(201).json({ message: "Story Created ", story: populatedStoryData })

    } catch (error) {
        return res.status(500).json({ message: 'Internal Server Error', error: error.message })
    }
}


// Logged In user - follwings - story - visible

export const getStories = async (req, res) => {
    try {
        // allowedUsers
        const allowedUsers = [req.user._id, ...(req.user.followings || [])]

        const stories = await Story.find({
            author: { $in: allowedUsers },
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 }).populate('author', "profileImage username")


        return res.status(200).json({ message: "Stories fetched", stories })

} catch (error) {
        return res.status(500).json({ message: 'Internal Server Error', error: error.message })
    }
}