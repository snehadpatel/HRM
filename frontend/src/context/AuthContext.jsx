import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        const token = localStorage.getItem('access_token')
        if (token) {
            try {
                const response = await api.get('/auth/profile/')
                setUser(response.data)
            } catch (error) {
                localStorage.removeItem('access_token')
                localStorage.removeItem('refresh_token')
            }
        }
        setLoading(false)
    }

    const login = async (email, password) => {
        const response = await api.post('/auth/login/', { email, password })
        const { user: userData, tokens } = response.data

        localStorage.setItem('access_token', tokens.access)
        localStorage.setItem('refresh_token', tokens.refresh)
        setUser(userData)

        return userData
    }

    const register = async (userData) => {
        const response = await api.post('/auth/register/', userData)
        const { user: newUser, tokens } = response.data

        localStorage.setItem('access_token', tokens.access)
        localStorage.setItem('refresh_token', tokens.refresh)
        setUser(newUser)

        return newUser
    }

    const logout = async () => {
        try {
            const refreshToken = localStorage.getItem('refresh_token')
            await api.post('/auth/logout/', { refresh: refreshToken })
        } catch (error) {
            // Ignore logout errors
        }

        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        setUser(null)
    }

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        isAdmin: user?.role === 'admin',
        isHR: user?.role === 'hr',
        isAdminOrHR: ['admin', 'hr'].includes(user?.role),
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
