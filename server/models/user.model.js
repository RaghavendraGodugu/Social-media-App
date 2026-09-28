import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    profileImage: {
        type: String
    },

    followers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            // 6aa10de974c1b2368e521bd9
            ref: "User"
        }
    ],
    // People who follow me

    followings: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    // People I follow

    bio: {
        type: String
    },

    posts: [],
    stories: [],
    reels: [],

    isVerified: {
        type: Boolean,
        required: true,
        default: false
    }


})


const User = mongoose.model('User', userSchema)

export default User