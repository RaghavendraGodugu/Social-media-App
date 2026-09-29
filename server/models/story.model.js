import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,//1234
        ref: "User",
        required: true
    },
    image: {
        type: String
    },

    caption: {
        type: String
    },

    likes:[{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
    }],

    expiresAt:{
        type : Date,
        required : true

    }




} , {timestamps: true})


const Story = mongoose.model('Story', storySchema)

export default Story