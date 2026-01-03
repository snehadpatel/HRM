import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { attendanceAPI, employeesAPI } from '../services/api'

function Attendance() {
    const { isAdminOrHR } = useAuth()
    const [records, setRecords] = useState([])
    const [weeklyData, setWeeklyData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [employees, setEmployees] = useState([])
    const [filter, setFilter] = useState({ start_date: '', end_date: '', employee: '' })

    useEffect(() => {
        loadInitialData()
    }, [])

    const loadInitialData = async () => {
        try {
            // Load employees list for Admin/HR filter
            if (isAdminOrHR) {
                const empRes = await employeesAPI.getAll()
                setEmployees(empRes.data.results || empRes.data || [])
            }
            await loadAttendance()
        } catch (error) {
            console.error('Error loading data:', error)
            setLoading(false)
        }
    }

    const loadAttendance = async () => {
        try {
            setLoading(true)
            const params = {}
            if (filter.start_date) params.start_date = filter.start_date
            if (filter.end_date) params.end_date = filter.end_date
            if (filter.employee) params.employee = filter.employee

            const [recordsRes, weeklyRes] = await Promise.all([
                attendanceAPI.getAll(params),
                attendanceAPI.getWeekly()
            ])

            setRecords(recordsRes.data.results || recordsRes.data)
            setWeeklyData(weeklyRes.data)
        } catch (error) {
            console.error('Error loading attendance:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleFilter = () => {
        loadAttendance()
    }

    const handleClearFilter = () => {
        setFilter({ start_date: '', end_date: '', employee: '' })
        setTimeout(() => loadAttendance(), 100)
    }

    const getStatusBadge = (status) => {
        const badges = {
            present: 'badge-success',
            late: 'badge-warning',
            absent: 'badge-error',
            half_day: 'badge-info',
            on_leave: 'badge-primary'
        }
        return badges[status] || 'badge-info'
    }

    if (loading && records.length === 0) {
        return <div className="loading"><div className="spinner"></div></div>
    }

    return (
        <div className="attendance-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Attendance</h1>
                    <p className="page-subtitle">
                        {isAdminOrHR ? 'Track and manage employee attendance' : 'Track your daily attendance records'}
                    </p>
                </div>
            </div>

            {/* Weekly Overview */}
            {weeklyData && (
                <div className="card mb-lg">
                    <h3 className="card-title mb-md">This Week ({weeklyData.week_start} - {weeklyData.week_end})</h3>
                    <div className="weekly-grid">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                            const record = weeklyData.records?.find(r =>
                                new Date(r.date).getDay() === (index + 1) % 7
                            )
                            return (
                                <div key={day} className={`day-card ${record ? 'has-record' : ''}`}>
                                    <span className="day-name">{day}</span>
                                    {record ? (
                                        <>
                                            <span className={`badge ${getStatusBadge(record.status)}`}>
                                                {record.status}
                                            </span>
                                            <span className="day-hours">{record.work_hours}h</span>
                                        </>
                                    ) : (
                                        <span className="day-empty">-</span>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="card mb-lg">
                <h3 className="card-title mb-md">🔍 Filter Records</h3>
                <div className="filter-row">
                    {/* Employee Filter - Only for Admin/HR */}
                    {isAdminOrHR && (
                        <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
                            <label className="form-label">Employee</label>
                            <select
                                className="form-select"
                                value={filter.employee}
                                onChange={(e) => setFilter({ ...filter, employee: e.target.value })}
                            >
                                <option value="">All Employees</option>
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">Start Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={filter.start_date}
                            onChange={(e) => setFilter({ ...filter, start_date: e.target.value })}
                        />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">End Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={filter.end_date}
                            onChange={(e) => setFilter({ ...filter, end_date: e.target.value })}
                        />
                    </div>
                    <div className="filter-actions">
                        <button className="btn btn-primary" onClick={handleFilter}>
                            Apply Filter
                        </button>
                        <button className="btn btn-secondary" onClick={handleClearFilter}>
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* Records Table */}
            <div className="card">
                <h3 className="card-title mb-md">
                    📋 Attendance History
                    {filter.employee && employees.find(e => e.id == filter.employee) && (
                        <span className="filter-badge">
                            Showing: {employees.find(e => e.id == filter.employee)?.full_name}
                        </span>
                    )}
                </h3>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                {isAdminOrHR && <th>Employee</th>}
                                <th>Check In</th>
                                <th>Check Out</th>
                                <th>Hours</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdminOrHR ? 6 : 5} className="text-center text-muted">
                                        No attendance records found
                                    </td>
                                </tr>
                            ) : (
                                records.map((record) => (
                                    <tr key={record.id}>
                                        <td>{record.date}</td>
                                        {isAdminOrHR && <td>{record.employee_name}</td>}
                                        <td>
                                            {record.check_in
                                                ? new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : '-'}
                                        </td>
                                        <td>
                                            {record.check_out
                                                ? new Date(record.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                : '-'}
                                        </td>
                                        <td>{record.work_hours || 0}h</td>
                                        <td>
                                            <span className={`badge ${getStatusBadge(record.status)}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                .weekly-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: var(--spacing-sm);
                }
                .day-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: var(--spacing-xs);
                    padding: var(--spacing-md);
                    background: var(--bg-tertiary);
                    border-radius: var(--radius-md);
                    text-align: center;
                }
                .day-card.has-record {
                    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(14, 165, 233, 0.1));
                    border: 1px solid var(--primary);
                }
                .day-name { font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); }
                .day-hours { font-size: 0.75rem; color: var(--text-muted); }
                .day-empty { color: var(--text-muted); }
                
                .filter-row {
                    display: flex;
                    gap: var(--spacing-md);
                    align-items: flex-end;
                    flex-wrap: wrap;
                }
                .filter-actions {
                    display: flex;
                    gap: 8px;
                }
                .filter-badge {
                    margin-left: 12px;
                    font-size: 0.8rem;
                    font-weight: 400;
                    background: var(--primary);
                    color: white;
                    padding: 4px 10px;
                    border-radius: 20px;
                }
                .card-title { display: flex; align-items: center; }
                
                @media (max-width: 768px) {
                    .weekly-grid { grid-template-columns: repeat(4, 1fr); }
                }
            `}</style>
        </div>
    )
}

export default Attendance
