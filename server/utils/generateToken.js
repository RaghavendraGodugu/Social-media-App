import jwt from 'jsonwebtoken'

const genToken = (userId) => {
    return jwt.sign({ userId }, 
        process.env.jwt_secret, 
        { expiresIn: "10d" })
}

export default genToken