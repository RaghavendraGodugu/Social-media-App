import { createContext, useContext, useEffect, useState } from 'react'
import { axiosInstance } from '../axiosCalls/axios'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true

        const fetchUser = async () => {
            try {
                const response = await axiosInstance.get('/users/me')
                if (!mounted) return
                setUser(response.data)
            } catch (error) {
                if (!mounted) return
                setUser(null)
            } finally {
                if (mounted) setLoading(false)
            }
        }

        fetchUser()

        return () => {
            mounted = false
        }
    }, [])

    return (
        <AuthContext.Provider value={{ user, setUser, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)