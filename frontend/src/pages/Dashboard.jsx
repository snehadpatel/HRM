import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { attendanceAPI, employeesAPI, leavesAPI, payrollAPI } from '../services/api'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts'
import {
    CalendarCheck,
    Clock,
    TrendingUp,
    Umbrella,
    AlertCircle,
    UserCheck,
    Users,
    LogOut,
    CheckCircle,
    XCircle,
    Sun,
    Moon
} from 'lucide-react'
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
    const [chartData, setChartData] = useState([])
    const [leaveDistribution, setLeaveDistribution] = useState([])

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

            // Load personal stats AND Chart Data
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

                // Process Chart Data (Last 7 days work hours)
                const last7Days = []
                for (let i = 6; i >= 0; i--) {
                    const d = new Date()
                    d.setDate(d.getDate() - i)
                    const dateStr = d.toISOString().split('T')[0]
                    const record = monthRecords.find(r => r.date === dateStr)
                    last7Days.push({
                        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
                        hours: record ? parseFloat(record.work_hours || 0) : 0
                    })
                }
                setChartData(last7Days)

                // Process Leave Distribution (Mock if empty, or calculate)
                // Since getting full history, we can aggregate
                const processedLeaves = leaves.reduce((acc, curr) => {
                    const type = curr.leave_type_name || 'Other'
                    acc[type] = (acc[type] || 0) + 1
                    return acc
                }, {})
                const leaveDist = Object.keys(processedLeaves).map(key => ({
                    name: key,
                    value: processedLeaves[key]
                }))
                // Fallback mock if no leaves
                setLeaveDistribution(leaveDist.length > 0 ? leaveDist : [
                    { name: 'Sick', value: 3 },
                    { name: 'Casual', value: 5 },
                    { name: 'Privilege', value: 2 },
                ])

                setMyStats({
                    present_days: presentDays,
                    absent_days: getWorkingDaysInMonth() - presentDays,
                    leave_balance: totalBalance,
                    pending_leaves: pending,
                    work_hours_this_month: Math.round(totalHours),
                    avg_daily_hours: presentDays > 0 ? (totalHours / presentDays).toFixed(1) : 0
                })
            } catch (err) {
                console.log('Could not load personal stats', err)
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
            // Refresh employee data to show accurate status
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

    const isCheckedIn = todayAttendance?.check_in && !todayAttendance?.check_out
    const isCheckedOut = todayAttendance?.check_out

    const currentHour = new Date().getHours()
    const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening'

    const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b'];

    return (
        <div className="dashboard fade-in">
            {/* Header with Check In/Out */}
            <div className="dashboard-header">
                <div className="header-left">
                    <h1 className="page-title flex items-center gap-3">
                        {currentHour < 18 ? <Sun className="text-warning" size={28} /> : <Moon className="text-primary" size={28} />}
                        {greeting}, {user?.first_name}!
                    </h1>
                    <p className="page-subtitle">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <div className="header-actions">
                    {!isCheckedOut ? (
                        <button
                            className={`btn ${isCheckedIn ? 'btn-danger' : 'btn-primary'} btn-lg shadow-sm`}
                            onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            {isCheckedIn ? <LogOut size={18} /> : <Clock size={18} />}
                            {isCheckedIn ? 'Check Out' : 'Check In'}
                        </button>
                    ) : (
                        <span className="badge badge-success flex items-center gap-2 px-4 py-2 text-base">
                            <CheckCircle size={18} /> Day Complete
                        </span>
                    )}
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="stats-grid mb-8">
                <div className="stat-card">
                    <div className="stat-icon bg-indigo-100 text-indigo-600">
                        <CalendarCheck size={24} />
                    </div>
                    <div>
                        <div className="stat-value">{myStats.present_days}</div>
                        <div className="stat-label">Days Present</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-emerald-100 text-emerald-600">
                        <Clock size={24} />
                    </div>
                    <div>
                        <div className="stat-value">{myStats.work_hours_this_month}h</div>
                        <div className="stat-label">Hours Worked</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-amber-100 text-amber-600">
                        <Umbrella size={24} />
                    </div>
                    <div>
                        <div className="stat-value">{myStats.leave_balance}</div>
                        <div className="stat-label">Leave Balance</div>
                    </div>
                </div>
                {myStats.pending_leaves > 0 && (
                    <div className="stat-card ring-2 ring-amber-400 ring-offset-2">
                        <div className="stat-icon bg-orange-100 text-orange-600">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <div className="stat-value">{myStats.pending_leaves}</div>
                            <div className="stat-label">Pending Requests</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Charts Section */}
            <div className="charts-grid mb-8">
                <div className="chart-card">
                    <h3 className="chart-title">Weekly Work Hours</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    cursor={{ stroke: '#6366f1', strokeWidth: 1 }}
                                />
                                <Area type="monotone" dataKey="hours" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card">
                    <h3 className="chart-title">Leave Distribution</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={leaveDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {leaveDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Admin/HR Stats & Team */}
            {isAdminOrHR && (
                <div className="admin-section">
                    <h2 className="section-title">Organization Overview</h2>
                    <div className="stats-grid mb-8">
                        <div className="stat-card">
                            <div className="stat-icon bg-blue-50 text-blue-600">
                                <Users size={24} />
                            </div>
                            <div>
                                <div className="stat-value">{orgStats.total_employees}</div>
                                <div className="stat-label">Total Employees</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon bg-green-50 text-green-600">
                                <UserCheck size={24} />
                            </div>
                            <div>
                                <div className="stat-value">{orgStats.present_today}</div>
                                <div className="stat-label">Present Today</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon bg-orange-50 text-orange-600">
                                <Umbrella size={24} />
                            </div>
                            <div>
                                <div className="stat-value">{orgStats.on_leave}</div>
                                <div className="stat-label">On Leave</div>
                            </div>
                        </div>
                    </div>

                    <h2 className="section-title">Team Status</h2>
                    <div className="employee-cards-grid">
                        {employees.map((employee) => (
                            <div
                                key={employee.id}
                                className="employee-card"
                                onClick={() => handleEmployeeClick(employee.id)}
                            >
                                <div className={`status-indicator ${employee.attendance_status}`}></div>
                                <div className="employee-avatar">
                                    {employee.profile_image ? (
                                        <img src={employee.profile_image} alt={employee.full_name} />
                                    ) : (
                                        <div className="avatar-placeholder">
                                            {employee.full_name?.charAt(0) || '?'}
                                        </div>
                                    )}
                                </div>
                                <div className="employee-info">
                                    <div className="employee-name">{employee.full_name}</div>
                                    <div className="employee-position">{employee.position}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style jsx>{`
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 24px;
                }
                .charts-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                    gap: 24px;
                }
                .stat-card {
                    background: white;
                    border-radius: 12px;
                    padding: 24px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    border: 1px solid var(--border-color);
                    transition: transform 0.2s;
                }
                .stat-card:hover { transform: translateY(-2px); }
                .stat-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .stat-value {
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    line-height: 1;
                    margin-bottom: 4px;
                }
                .stat-label {
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    font-weight: 500;
                }
                .chart-card {
                    background: white;
                    border-radius: 12px;
                    padding: 24px;
                    border: 1px solid var(--border-color);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                }
                .chart-title {
                    font-size: 1.1rem;
                    color: var(--text-primary);
                    margin-bottom: 24px;
                    font-weight: 600;
                }
                .section-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 20px;
                }
                
                /* Employee Cards */
                .employee-card {
                    background: white;
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    padding: 16px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    cursor: pointer;
                    transition: all 0.2s;
                    position: relative;
                    overflow: hidden;
                }
                .employee-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                    border-color: var(--primary);
                }
                .status-indicator {
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 4px;
                }
                .status-indicator.present { background: #10b981; }
                .status-indicator.leave { background: #f59e0b; }
                .status-indicator.absent { background: #eab308; }
                
                .employee-avatar {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    overflow: hidden;
                    border: 2px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .employee-avatar img { width: 100%; height: 100%; object-fit: cover; }
                .avatar-placeholder {
                    width: 100%; height: 100%;
                    background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
                    color: #4338ca;
                    display: flex; align-items: center; justify-content: center;
                    font-weight: 600;
                }
                .employee-info { text-align: left; }
                .employee-name { font-weight: 600; color: var(--text-primary); font-size: 0.95rem; }
                .employee-position { color: var(--text-muted); font-size: 0.8rem; }
            `}</style>
        </div>
    )
}

export default Dashboard
