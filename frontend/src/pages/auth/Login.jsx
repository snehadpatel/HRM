import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Auth.css'

function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            await login(formData.email, formData.password)
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid email or password')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">🌊</div>
                    <h1>Welcome Back</h1>
                    <p>Sign in to Dayflow</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            name="email"
                            className="form-input"
                            placeholder="name@company.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            name="password"
                            className="form-input"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Don't have an account? <Link to="/register">Create account</Link></p>
                </div>

                <div className="demo-accounts">
                    <h4>Demo Accounts:</h4>
                    <div className="demo-list">
                        <div className="demo-item">
                            <strong>Admin:</strong> admin@dayflow.com / admin123
                        </div>
                        <div className="demo-item">
                            <strong>HR:</strong> hr@dayflow.com / hr123456
                        </div>
                        <div className="demo-item">
                            <strong>Employee:</strong> sarah.johnson@dayflow.com / employee123
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login
