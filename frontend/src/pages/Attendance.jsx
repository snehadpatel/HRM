import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { attendanceAPI } from '../services/api'

function Attendance() {
    const { isAdminOrHR } = useAuth()
    const [records, setRecords] = useState([])
    const [weeklyData, setWeeklyData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState({ start_date: '', end_date: '' })

    useEffect(() => {
        loadAttendance()
    }, [])

    const loadAttendance = async () => {
        try {
            const [recordsRes, weeklyRes] = await Promise.all([
                attendanceAPI.getAll(filter),
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
        setLoading(true)
        loadAttendance()
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

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>
    }

    return (
        <div className="attendance-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Attendance</h1>
                    <p className="page-subtitle">Track your daily attendance records</p>
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
                <div className="filter-row">
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
                    <button className="btn btn-primary" onClick={handleFilter}>
                        Apply Filter
                    </button>
                </div>
            </div>

            {/* Records Table */}
            <div className="card">
                <h3 className="card-title mb-md">Attendance History</h3>
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
                                                ? new Date(record.check_in).toLocaleTimeString()
                                                : '-'}
                                        </td>
                                        <td>
                                            {record.check_out
                                                ? new Date(record.check_out).toLocaleTimeString()
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
        
        .day-name {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        
        .day-hours {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        
        .day-empty {
          color: var(--text-muted);
        }
        
        .filter-row {
          display: flex;
          gap: var(--spacing-md);
          align-items: flex-end;
          flex-wrap: wrap;
        }
        
        @media (max-width: 768px) {
          .weekly-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>
        </div>
    )
}

export default Attendance
