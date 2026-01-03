import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Layout.css'

function Layout() {
    const { user, logout, isAdminOrHR } = useAuth()
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const navigate = useNavigate()

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    const navItems = [
        { path: '/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/attendance', icon: '⏰', label: 'Attendance' },
        { path: '/leaves', icon: '🏖️', label: 'Leaves' },
        { path: '/payroll', icon: '💰', label: 'Payroll' },
    ]

    if (isAdminOrHR) {
        navItems.splice(1, 0, { path: '/employees', icon: '👥', label: 'Employees' })
    }

    return (
        <div className="layout">
            <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
                <div className="sidebar-header">
                    <div className="logo">
                        <span className="logo-icon">🌊</span>
                        {sidebarOpen && <span className="logo-text">Dayflow</span>}
                    </div>
                    <button
                        className="toggle-btn"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        {sidebarOpen ? '◀' : '▶'}
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {sidebarOpen && <span className="nav-label">{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <NavLink to="/profile" className="nav-item user-info">
                        <span className="nav-icon">👤</span>
                        {sidebarOpen && (
                            <div className="user-details">
                                <span className="user-name">{user?.first_name} {user?.last_name}</span>
                                <span className="user-role">{user?.role}</span>
                            </div>
                        )}
                    </NavLink>
                    <button className="nav-item logout-btn" onClick={handleLogout}>
                        <span className="nav-icon">🚪</span>
                        {sidebarOpen && <span className="nav-label">Logout</span>}
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    )
}

export default Layout
