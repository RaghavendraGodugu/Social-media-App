import express from 'express'
import { isAuthenticated } from '../middlewares/authMiddleware.js'
import { createPost, getAllPosts, getPostsByUsername, toggleLike } from '../controllers/post.controllers.js'
import upload from '../middlewares/upload.middlerware.js'




const postRoutes = express.Router()


postRoutes.post('/createPost' , isAuthenticated ,upload.single('image') , createPost  )
postRoutes.get('/getAllPosts' ,isAuthenticated , getAllPosts)
postRoutes.get('/user/:username', isAuthenticated, getPostsByUsername)
postRoutes.post('/like/:id' ,isAuthenticated,  toggleLike)





export default postRoutes