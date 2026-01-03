import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Layout.css'

function Layout() {
    const { user, logout, isAdminOrHR } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [collapsed, setCollapsed] = useState(false)
    const [showProfileMenu, setShowProfileMenu] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const navItems = [
        { path: '/dashboard', icon: '🏠', label: 'Dashboard' },
        { path: '/attendance', icon: '⏰', label: 'Attendance' },
        { path: '/leaves', icon: '📅', label: 'Time Off' },
    ]

    if (isAdminOrHR) {
        navItems.splice(1, 0, { path: '/employees', icon: '👥', label: 'Employees' })
        navItems.push({ path: '/payroll', icon: '💰', label: 'Payroll' })
    }

    const getPageTitle = () => {
        const path = location.pathname
        if (path === '/dashboard') return 'Dashboard'
        if (path === '/employees') return 'Employees'
        if (path.startsWith('/employees/')) return 'Employee Profile'
        if (path === '/attendance') return 'Attendance'
        if (path === '/leaves') return 'Time Off'
        if (path === '/payroll') return 'Payroll'
        if (path === '/profile') return 'My Profile'
        return 'HRMS'
    }

    return (
        <div className="layout">
            {/* Sidebar */}
            <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo">
                        <span className="logo-icon">🌊</span>
                        {!collapsed && <span className="logo-text">Dayflow</span>}
                    </div>
                    <button className="toggle-btn" onClick={() => setCollapsed(!collapsed)}>
                        {collapsed ? '▶' : '◀'}
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
                            {!collapsed && <span className="nav-label">{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {/* Top Bar */}
                <header className="top-bar">
                    <div className="top-bar-left">
                        <h2 className="page-title" style={{ fontSize: '1.25rem', margin: 0 }}>
                            {getPageTitle()}
                        </h2>
                    </div>
                    <div className="top-bar-right">
                        <div className="profile-dropdown-container">
                            <button
                                className="profile-avatar-btn"
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                            >
                                <div className="avatar-circle">
                                    {user?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                </div>
                            </button>

                            {showProfileMenu && (
                                <div className="profile-dropdown">
                                    <div className="dropdown-header">
                                        <strong>{user?.first_name} {user?.last_name}</strong>
                                        <span className="user-role-label">{user?.role}</span>
                                    </div>
                                    <div className="dropdown-divider"></div>
                                    <Link to="/profile" className="dropdown-item" onClick={() => setShowProfileMenu(false)}>
                                        My Profile
                                    </Link>
                                    <div className="dropdown-divider"></div>
                                    <button className="dropdown-item logout-item" onClick={handleLogout}>
                                        Log Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="page-content">
                    <Outlet />
                </div>
            </main>

            {/* Backdrop for mobile */}
            {showProfileMenu && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 999 }}
                    onClick={() => setShowProfileMenu(false)}
                />
            )}
        </div>
    )
}

// Helper Link component since we're using Link in the dropdown
function Link({ to, children, ...props }) {
    const navigate = useNavigate()
    return (
        <a
            href={to}
            onClick={(e) => {
                e.preventDefault()
                navigate(to)
                if (props.onClick) props.onClick(e)
            }}
            {...props}
        >
            {children}
        </a>
    )
}

export default Layout
