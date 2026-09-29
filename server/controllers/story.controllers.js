import Story from "../models/story.model.js";
import User from "../models/user.model.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";


const STORY_LIFETIME = 24 * 60 * 60 * 1000 // 24hrs - ms


export const createStory = async (req, res) => {
    try {

        const { caption } = req.body

        let image;


        if (!caption || !req.file) {
            res.status(400).json({ message: "Add a Caption or an Image" })
        }

        if (caption.length > 200) {
            res.status(400).json({ message: "Caption Cannote be Greate than 500 characters" })
        }


        if (req.file) {
            const uploadedImage = await uploadToCloudinary(req.file.buffer)
            image = uploadedImage.secure_url
        }


        const newStory = await Story.create({
            image,
            caption,
            author: req.user._id,
            expiresAt: new Date(Date.now() + STORY_LIFETIME)

        })

        console.log(newStory)

        await User.findByIdAndUpdate(req.user._id, {
            $push: { stories: newStory._id }
        })


        const populatedStoryData = await Story.findById(newStory._id).populate('author', 'name username profileImage')







        res.status(201).json({ message: "Story Created ", story: populatedStoryData })

    } catch (error) {
        return res.status(500).json({ message: 'Internal Server Error', error: error })
    }
}

// stories - visible - followers
// Get Stories

export const getStories = (req , res)=>{
    try {
        
    } catch (error) {
        
    }
}