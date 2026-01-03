import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { employeesAPI, authAPI } from '../services/api'

function Profile() {
    const { user, logout } = useAuth()
    const [employee, setEmployee] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showPasswordForm, setShowPasswordForm] = useState(false)
    const [passwordData, setPasswordData] = useState({
        old_password: '',
        new_password: '',
        new_password_confirm: ''
    })
    const [message, setMessage] = useState({ type: '', text: '' })

    useEffect(() => {
        loadProfile()
    }, [])

    const loadProfile = async () => {
        try {
            const response = await employeesAPI.getMe()
            setEmployee(response.data)
        } catch (error) {
            console.error('Error loading profile:', error)
        } finally {
            setLoading(false)
        }
    }

    const handlePasswordChange = async (e) => {
        e.preventDefault()
        setMessage({ type: '', text: '' })

        if (passwordData.new_password !== passwordData.new_password_confirm) {
            setMessage({ type: 'error', text: 'New passwords do not match' })
            return
        }

        try {
            await authAPI.changePassword(passwordData)
            setMessage({ type: 'success', text: 'Password changed successfully' })
            setShowPasswordForm(false)
            setPasswordData({ old_password: '', new_password: '', new_password_confirm: '' })
        } catch (error) {
            const errorMsg = error.response?.data?.old_password?.[0] ||
                error.response?.data?.new_password?.[0] ||
                'Failed to change password'
            setMessage({ type: 'error', text: errorMsg })
        }
    }

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>
    }

    return (
        <div className="profile-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Profile</h1>
                    <p className="page-subtitle">View and manage your profile information</p>
                </div>
            </div>

            {message.text && (
                <div className={`alert alert-${message.type}`}>{message.text}</div>
            )}

            <div className="profile-grid">
                {/* Profile Card */}
                <div className="profile-card card">
                    <div className="profile-header">
                        <div className="profile-avatar">
                            {employee?.profile_image ? (
                                <img src={employee.profile_image} alt={user?.first_name} />
                            ) : (
                                <span>{user?.first_name?.[0]}{user?.last_name?.[0]}</span>
                            )}
                        </div>
                        <div className="profile-name">
                            <h2>{user?.first_name} {user?.last_name}</h2>
                            <span className="badge badge-primary">{user?.role}</span>
                        </div>
                    </div>

                    <div className="profile-info">
                        <div className="info-item">
                            <span className="info-icon">📧</span>
                            <div>
                                <span className="info-label">Email</span>
                                <span className="info-value">{user?.email}</span>
                            </div>
                        </div>
                        {employee && (
                            <>
                                <div className="info-item">
                                    <span className="info-icon">🆔</span>
                                    <div>
                                        <span className="info-label">Employee ID</span>
                                        <span className="info-value">{employee.employee_id}</span>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <span className="info-icon">💼</span>
                                    <div>
                                        <span className="info-label">Position</span>
                                        <span className="info-value">{employee.position}</span>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <span className="info-icon">🏢</span>
                                    <div>
                                        <span className="info-label">Department</span>
                                        <span className="info-value">{employee.department}</span>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <span className="info-icon">📅</span>
                                    <div>
                                        <span className="info-label">Hire Date</span>
                                        <span className="info-value">{employee.hire_date}</span>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <span className="info-icon">📱</span>
                                    <div>
                                        <span className="info-label">Phone</span>
                                        <span className="info-value">{employee.phone || 'Not provided'}</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Account Settings */}
                <div className="settings-card card">
                    <h3>Account Settings</h3>

                    <div className="settings-list">
                        <div className="settings-item" onClick={() => setShowPasswordForm(!showPasswordForm)}>
                            <div className="settings-info">
                                <span className="settings-icon">🔐</span>
                                <div>
                                    <span className="settings-title">Change Password</span>
                                    <span className="settings-desc">Update your account password</span>
                                </div>
                            </div>
                            <span className="settings-arrow">{showPasswordForm ? '▼' : '▶'}</span>
                        </div>

                        {showPasswordForm && (
                            <form onSubmit={handlePasswordChange} className="password-form">
                                <div className="form-group">
                                    <label className="form-label">Current Password</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        value={passwordData.old_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">New Password</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        value={passwordData.new_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                        required
                                        minLength={8}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Confirm New Password</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        value={passwordData.new_password_confirm}
                                        onChange={(e) => setPasswordData({ ...passwordData, new_password_confirm: e.target.value })}
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary">
                                    Update Password
                                </button>
                            </form>
                        )}

                        <div className="settings-item logout" onClick={logout}>
                            <div className="settings-info">
                                <span className="settings-icon">🚪</span>
                                <div>
                                    <span className="settings-title">Logout</span>
                                    <span className="settings-desc">Sign out of your account</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        .profile-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-xl);
        }
        
        .profile-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-md);
          padding-bottom: var(--spacing-lg);
          border-bottom: 1px solid var(--border-color);
          margin-bottom: var(--spacing-lg);
        }
        
        .profile-avatar {
          width: 100px;
          height: 100px;
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          font-weight: 600;
          color: white;
          overflow: hidden;
        }
        
        .profile-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .profile-name {
          text-align: center;
        }
        
        .profile-name h2 {
          margin-bottom: var(--spacing-xs);
        }
        
        .profile-info {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }
        
        .info-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }
        
        .info-icon {
          font-size: 1.25rem;
        }
        
        .info-label {
          display: block;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        
        .info-value {
          font-size: 0.875rem;
          color: var(--text-primary);
        }
        
        .settings-card h3 {
          margin-bottom: var(--spacing-lg);
        }
        
        .settings-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }
        
        .settings-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-md);
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .settings-item:hover {
          background: var(--bg-hover);
        }
        
        .settings-item.logout:hover {
          background: rgba(239, 68, 68, 0.1);
        }
        
        .settings-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }
        
        .settings-icon {
          font-size: 1.25rem;
        }
        
        .settings-title {
          display: block;
          font-weight: 500;
        }
        
        .settings-desc {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        
        .settings-arrow {
          color: var(--text-muted);
          font-size: 0.75rem;
        }
        
        .password-form {
          padding: var(--spacing-lg);
          background: var(--bg-secondary);
          border-radius: var(--radius-md);
          margin-top: var(--spacing-sm);
        }
        
        @media (max-width: 768px) {
          .profile-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    )
}

export default Profile
