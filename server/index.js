import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import userRoutes from './routes/user.route.js'
import postRoutes from './routes/post.routes.js'
import reelRoutes from './routes/reel.routes.js'
import cookieParser from 'cookie-parser'
import cors from 'cors'

const app = express()
const Port = 8085

dotenv.config()

mongoose.connect(process.env.dbUrl)
    .then(() => {
        console.log("Db Connected")
    })
    .catch((err) => {
        console.log(err)
    })

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}))

app.use(express.json())
app.use(cookieParser())

// Routes
app.use('/users', userRoutes)
app.use('/post', postRoutes)
app.use('/reel', reelRoutes)

app.get('/', (req, res) => {
    res.send('Server On Hellllooooo...')
})

app.listen(Port, () => {
    console.log(`Server Started at ${Port}`)
})
