import express from 'express'
import { isAuthenticated } from '../middlewares/authMiddleware.js'
import {
    createPost,
    getAllPosts
} from '../controllers/post.controllers.js'
import upload from '../middlewares/upload.middlerware.js'

const postRoutes = express.Router()

// Create post
postRoutes.post(
    '/createPost',
    isAuthenticated,
    upload.single('image'),
    createPost
)

// Get all posts
postRoutes.get(
    '/getAllPosts',
    isAuthenticated,
    getAllPosts
)

export default postRoutes
