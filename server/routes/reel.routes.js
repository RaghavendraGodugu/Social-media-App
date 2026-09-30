import express from 'express'
import { isAuthenticated } from '../middlewares/authMiddleware.js'
import uploadReel from '../middlewares/uploadReel.middleware.js'
import { createReel, getAllReels, toggleReelLike } from '../controllers/reel.controllers.js'





const reelRoutes = express.Router()


reelRoutes.post('/createReel' , isAuthenticated ,uploadReel.single('video') , createReel  )
reelRoutes.get('/getAllReels' , isAuthenticated , getAllReels )
reelRoutes.post('/like/:id', isAuthenticated, toggleReelLike)





export default reelRoutes