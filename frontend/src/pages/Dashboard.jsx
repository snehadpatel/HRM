import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { attendanceAPI, employeesAPI, leavesAPI, payrollAPI } from '../services/api'
import './Dashboard.css'

function Dashboard() {
    const { user, isAdminOrHR } = useAuth()
    const navigate = useNavigate()
    const [employees, setEmployees] = useState([])
    const [todayAttendance, setTodayAttendance] = useState(null)
    const [loading, setLoading] = useState(true)
    const [myStats, setMyStats] = useState({
        present_days: 0,
        absent_days: 0,
        leave_balance: 0,
        pending_leaves: 0,
        work_hours_this_month: 0,
        avg_check_in: null,
        salary_info: null
    })
    const [orgStats, setOrgStats] = useState({
        total_employees: 0,
        present_today: 0,
        on_leave: 0,
        pending_leaves: 0
    })

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        try {
            // Load employees list
            const employeesRes = await employeesAPI.getAll()
            const empList = employeesRes.data.results || employeesRes.data || []
            setEmployees(empList)

            // Calculate org stats
            const presentToday = empList.filter(e => e.attendance_status === 'present').length
            const onLeave = empList.filter(e => e.attendance_status === 'leave').length

            setOrgStats({
                total_employees: empList.length,
                present_today: presentToday,
                on_leave: onLeave
            })

            // Try to get today's attendance
            try {
                const attendanceRes = await attendanceAPI.getToday()
                setTodayAttendance(attendanceRes.data)
            } catch (err) {
                console.log('No attendance data for current user')
            }

            // Load personal stats
            try {
                const [attendanceHistory, leaveBalance, pendingLeaves] = await Promise.all([
                    attendanceAPI.getAll({ start_date: getMonthStart(), end_date: getToday() }),
                    leavesAPI.getBalance(),
                    leavesAPI.getRequests()
                ])

                const monthRecords = attendanceHistory.data.results || attendanceHistory.data || []
                const presentDays = monthRecords.filter(r => r.status === 'present' || r.status === 'late').length
                const totalHours = monthRecords.reduce((sum, r) => sum + (parseFloat(r.work_hours) || 0), 0)

                const balances = leaveBalance.data.results || leaveBalance.data || []
                const totalBalance = balances.reduce((sum, b) => sum + (b.remaining_days || 0), 0)

                const leaves = pendingLeaves.data.results || pendingLeaves.data || []
                const pending = leaves.filter(l => l.status === 'pending').length

                setMyStats({
                    present_days: presentDays,
                    absent_days: getWorkingDaysInMonth() - presentDays,
                    leave_balance: totalBalance,
                    pending_leaves: pending,
                    work_hours_this_month: Math.round(totalHours),
                    avg_daily_hours: presentDays > 0 ? (totalHours / presentDays).toFixed(1) : 0
                })
            } catch (err) {
                console.log('Could not load personal stats')
            }

        } catch (error) {
            console.error('Error loading dashboard:', error)
        } finally {
            setLoading(false)
        }
    }

    const getMonthStart = () => {
        const date = new Date()
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
    }

    const getToday = () => {
        return new Date().toISOString().split('T')[0]
    }

    const getWorkingDaysInMonth = () => {
        const today = new Date()
        const daysElapsed = today.getDate()
        // Rough estimate: ~22 working days per month
        return Math.min(daysElapsed, 22)
    }

    const handleCheckIn = async () => {
        try {
            const response = await attendanceAPI.checkIn()
            setTodayAttendance(response.data.attendance)
            const employeesRes = await employeesAPI.getAll()
            setEmployees(employeesRes.data.results || employeesRes.data || [])
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

    const handleEmployeeClick = (employeeId) => {
        navigate(`/employees/${employeeId}`)
    }

    const getStatusDot = (status) => {
        switch (status) {
            case 'present':
                return <span className="status-dot present" title="Present">🟢</span>
            case 'leave':
                return <span className="status-dot leave" title="On Leave">🟠</span>
            case 'absent':
            default:
                return <span className="status-dot absent" title="Absent">🟡</span>
        }
    }

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>
    }

    const isCheckedIn = todayAttendance?.check_in && !todayAttendance?.check_out
    const isCheckedOut = todayAttendance?.check_out

    const currentHour = new Date().getHours()
    const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening'

    return (
        <div className="dashboard">
            {/* Header with Check In/Out */}
            <div className="dashboard-header">
                <div className="header-left">
                    <h1 className="page-title">{greeting}, {user?.first_name}!</h1>
                    <p className="page-subtitle">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <div className="header-actions">
                    {!isCheckedOut ? (
                        <button
                            className={`btn ${isCheckedIn ? 'btn-danger' : 'btn-success'} btn-lg`}
                            onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
                        >
                            {isCheckedIn ? '🚪 Check Out' : '✅ Check In'}
                        </button>
                    ) : (
                        <span className="badge badge-success" style={{ padding: '12px 20px', fontSize: '1rem' }}>
                            ✓ Day Complete
                        </span>
                    )}
                </div>
            </div>

            {/* Personal Stats Summary */}
            <div className="my-summary-section">
                <h2>📊 My Work Summary</h2>
                <div className="summary-grid">
                    <div className="summary-card">
                        <div className="summary-icon">📅</div>
                        <div className="summary-content">
                            <div className="summary-value">{myStats.present_days}</div>
                            <div className="summary-label">Days Present (This Month)</div>
                        </div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-icon">⏱️</div>
                        <div className="summary-content">
                            <div className="summary-value">{myStats.work_hours_this_month}h</div>
                            <div className="summary-label">Hours Worked (This Month)</div>
                        </div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-icon">📈</div>
                        <div className="summary-content">
                            <div className="summary-value">{myStats.avg_daily_hours}h</div>
                            <div className="summary-label">Avg Daily Hours</div>
                        </div>
                    </div>
                    <div className="summary-card">
                        <div className="summary-icon">🏖️</div>
                        <div className="summary-content">
                            <div className="summary-value">{myStats.leave_balance}</div>
                            <div className="summary-label">Leaves Remaining</div>
                        </div>
                    </div>
                    {myStats.pending_leaves > 0 && (
                        <div className="summary-card highlight">
                            <div className="summary-icon">⏳</div>
                            <div className="summary-content">
                                <div className="summary-value">{myStats.pending_leaves}</div>
                                <div className="summary-label">Pending Leave Requests</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Admin/HR Organization Stats */}
            {isAdminOrHR && (
                <div className="org-stats-section">
                    <h2>🏢 Organization Overview</h2>
                    <div className="org-stats-grid">
                        <div className="org-stat-card">
                            <div className="org-stat-value">{orgStats.total_employees}</div>
                            <div className="org-stat-label">Total Employees</div>
                        </div>
                        <div className="org-stat-card present">
                            <div className="org-stat-value">{orgStats.present_today}</div>
                            <div className="org-stat-label">Present Today</div>
                        </div>
                        <div className="org-stat-card leave">
                            <div className="org-stat-value">{orgStats.on_leave}</div>
                            <div className="org-stat-label">On Leave</div>
                        </div>
                        <div className="org-stat-card absent">
                            <div className="org-stat-value">{orgStats.total_employees - orgStats.present_today - orgStats.on_leave}</div>
                            <div className="org-stat-label">Absent</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Today's Check-in Status */}
            {todayAttendance && (
                <div className="today-status-section">
                    <h2>🕐 Today's Status</h2>
                    <div className="today-status-card">
                        <div className="status-item">
                            <span className="status-label">Check In</span>
                            <span className="status-time">
                                {todayAttendance.check_in
                                    ? new Date(todayAttendance.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : '--:--'}
                            </span>
                        </div>
                        <div className="status-divider"></div>
                        <div className="status-item">
                            <span className="status-label">Check Out</span>
                            <span className="status-time">
                                {todayAttendance.check_out
                                    ? new Date(todayAttendance.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : '--:--'}
                            </span>
                        </div>
                        <div className="status-divider"></div>
                        <div className="status-item">
                            <span className="status-label">Work Hours</span>
                            <span className="status-time">{todayAttendance.work_hours || 0}h</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Employee Cards Grid */}
            <div className="employee-cards-section">
                <h2>👥 Team Members</h2>
                <div className="employee-cards-grid">
                    {employees.map((employee) => (
                        <div
                            key={employee.id}
                            className="employee-card"
                            onClick={() => handleEmployeeClick(employee.id)}
                        >
                            {getStatusDot(employee.attendance_status)}
                            <div className="employee-avatar">
                                {employee.profile_image ? (
                                    <img src={employee.profile_image} alt={employee.full_name} />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {employee.full_name?.charAt(0) || '?'}
                                    </div>
                                )}
                            </div>
                            <div className="employee-name">{employee.full_name}</div>
                            <div className="employee-position">{employee.position}</div>
                        </div>
                    ))}
                </div>
                {employees.length === 0 && (
                    <p className="no-data">No employees found</p>
                )}
            </div>

            {/* Status Legend */}
            <div className="status-legend">
                <div className="legend-item">
                    <span className="status-dot present">🟢</span>
                    <span>Present in office</span>
                </div>
                <div className="legend-item">
                    <span className="status-dot leave">🟠</span>
                    <span>On leave</span>
                </div>
                <div className="legend-item">
                    <span className="status-dot absent">🟡</span>
                    <span>Absent (no time off applied)</span>
                </div>
            </div>

            <style>{`
                .my-summary-section, .org-stats-section, .today-status-section {
                    margin-bottom: 32px;
                }
                .my-summary-section h2, .org-stats-section h2, .today-status-section h2 {
                    font-size: 1.1rem;
                    margin-bottom: 16px;
                    color: var(--text-primary);
                }
                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                }
                .summary-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    transition: all 0.2s;
                }
                .summary-card:hover {
                    border-color: var(--primary);
                    transform: translateY(-2px);
                }
                .summary-card.highlight {
                    background: linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.1));
                    border-color: #f59e0b;
                }
                .summary-icon {
                    font-size: 2rem;
                }
                .summary-value {
                    font-size: 1.75rem;
                    font-weight: 700;
                    color: var(--text-primary);
                }
                .summary-label {
                    font-size: 0.85rem;
                    color: var(--text-muted);
                }

                .org-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 16px;
                }
                .org-stat-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 20px;
                    text-align: center;
                }
                .org-stat-card.present { border-left: 4px solid #22c55e; }
                .org-stat-card.leave { border-left: 4px solid #f97316; }
                .org-stat-card.absent { border-left: 4px solid #eab308; }
                .org-stat-value {
                    font-size: 2rem;
                    font-weight: 700;
                    color: var(--text-primary);
                }
                .org-stat-label {
                    font-size: 0.85rem;
                    color: var(--text-muted);
                    margin-top: 4px;
                }

                .today-status-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 24px;
                    display: flex;
                    justify-content: center;
                    gap: 40px;
                }
                .status-item {
                    text-align: center;
                }
                .status-label {
                    display: block;
                    font-size: 0.85rem;
                    color: var(--text-muted);
                    margin-bottom: 8px;
                }
                .status-time {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: var(--primary);
                }
                .status-divider {
                    width: 1px;
                    background: var(--border-color);
                }

                @media (max-width: 768px) {
                    .org-stats-grid { grid-template-columns: repeat(2, 1fr); }
                    .today-status-card { flex-wrap: wrap; gap: 20px; }
                    .status-divider { display: none; }
                }
            `}</style>
        </div>
    )
}

export default Dashboard
