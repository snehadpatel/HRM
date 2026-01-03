import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { attendanceAPI, leavesAPI, employeesAPI } from '../services/api'
import './Dashboard.css'

function Dashboard() {
    const { user, isAdminOrHR } = useAuth()
    const [stats, setStats] = useState(null)
    const [todayAttendance, setTodayAttendance] = useState(null)
    const [recentLeaves, setRecentLeaves] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        try {
            const [attendanceRes, leavesRes] = await Promise.all([
                attendanceAPI.getToday(),
                leavesAPI.getRequests({ status: 'pending' }),
            ])

            setTodayAttendance(attendanceRes.data)
            setRecentLeaves(leavesRes.data.results || leavesRes.data)

            // Get attendance summary
            const summaryRes = await attendanceAPI.getSummary()
            setStats(summaryRes.data)
        } catch (error) {
            console.error('Error loading dashboard:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCheckIn = async () => {
        try {
            const response = await attendanceAPI.checkIn()
            setTodayAttendance(response.data.attendance)
        } catch (error) {
            alert(error.response?.data?.error || 'Check-in failed')
        }
    }

    const handleCheckOut = async () => {
        try {
            const response = await attendanceAPI.checkOut()
            setTodayAttendance(response.data.attendance)
        } catch (error) {
            alert(error.response?.data?.error || 'Check-out failed')
        }
    }

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>
    }

    const isCheckedIn = todayAttendance?.check_in && !todayAttendance?.check_out
    const isCheckedOut = todayAttendance?.check_out

    return (
        <div className="dashboard">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Welcome back, {user?.first_name}! 👋</h1>
                    <p className="page-subtitle">Here's what's happening today</p>
                </div>
                <div className="header-actions">
                    {!isCheckedOut && (
                        <button
                            className={`btn ${isCheckedIn ? 'btn-danger' : 'btn-success'} btn-lg`}
                            onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
                        >
                            {isCheckedIn ? '🚪 Check Out' : '✅ Check In'}
                        </button>
                    )}
                    {isCheckedOut && (
                        <span className="badge badge-success">✓ Day Complete</span>
                    )}
                </div>
            </div>

            {/* Today's Status */}
            <div className="today-status card">
                <div className="status-info">
                    <h3>Today's Attendance</h3>
                    <div className="status-details">
                        <div className="status-item">
                            <span className="status-label">Check In</span>
                            <span className="status-value">
                                {todayAttendance?.check_in
                                    ? new Date(todayAttendance.check_in).toLocaleTimeString()
                                    : '--:--'}
                            </span>
                        </div>
                        <div className="status-item">
                            <span className="status-label">Check Out</span>
                            <span className="status-value">
                                {todayAttendance?.check_out
                                    ? new Date(todayAttendance.check_out).toLocaleTimeString()
                                    : '--:--'}
                            </span>
                        </div>
                        <div className="status-item">
                            <span className="status-label">Hours Worked</span>
                            <span className="status-value">
                                {todayAttendance?.work_hours ? `${todayAttendance.work_hours}h` : '--'}
                            </span>
                        </div>
                        <div className="status-item">
                            <span className="status-label">Status</span>
                            <span className={`badge badge-${todayAttendance?.status === 'present' ? 'success' : todayAttendance?.status === 'late' ? 'warning' : 'info'}`}>
                                {todayAttendance?.status || 'Not Started'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-value">{stats?.present_days || 0}</div>
                    <div className="stat-label">Present Days</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats?.late_days || 0}</div>
                    <div className="stat-label">Late Days</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats?.leave_days || 0}</div>
                    <div className="stat-label">Leave Days</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{stats?.average_work_hours?.toFixed(1) || 0}h</div>
                    <div className="stat-label">Avg. Work Hours</div>
                </div>
            </div>

            {/* Pending Leave Requests (Admin/HR only) */}
            {isAdminOrHR && recentLeaves.length > 0 && (
                <div className="card mt-lg">
                    <div className="card-header">
                        <h3 className="card-title">Pending Leave Requests</h3>
                        <span className="badge badge-warning">{recentLeaves.length} pending</span>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Type</th>
                                    <th>Dates</th>
                                    <th>Days</th>
                                    <th>Applied On</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentLeaves.slice(0, 5).map((leave) => (
                                    <tr key={leave.id}>
                                        <td>{leave.employee_name}</td>
                                        <td>{leave.leave_type_name}</td>
                                        <td>{leave.start_date} to {leave.end_date}</td>
                                        <td>{leave.total_days}</td>
                                        <td>{new Date(leave.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="action-cards">
                    <a href="/attendance" className="action-card">
                        <span className="action-icon">📅</span>
                        <span className="action-label">View Attendance</span>
                    </a>
                    <a href="/leaves" className="action-card">
                        <span className="action-icon">🏖️</span>
                        <span className="action-label">Apply Leave</span>
                    </a>
                    <a href="/payroll" className="action-card">
                        <span className="action-icon">💰</span>
                        <span className="action-label">View Payslips</span>
                    </a>
                    <a href="/profile" className="action-card">
                        <span className="action-icon">👤</span>
                        <span className="action-label">My Profile</span>
                    </a>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
