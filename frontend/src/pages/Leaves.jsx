import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { leavesAPI, employeesAPI } from '../services/api'

function Leaves() {
    const { user, isAdminOrHR } = useAuth()
    const [requests, setRequests] = useState([])
    const [leaveTypes, setLeaveTypes] = useState([])
    const [balances, setBalances] = useState([])
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        leave_type: '',
        start_date: '',
        end_date: '',
        reason: ''
    })
    const [filter, setFilter] = useState({ status: 'all', employee: '' })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [requestsRes, typesRes, balanceRes] = await Promise.all([
                leavesAPI.getRequests(),
                leavesAPI.getTypes(),
                leavesAPI.getBalance()
            ])

            setRequests(requestsRes.data.results || requestsRes.data)
            setLeaveTypes(typesRes.data.results || typesRes.data)
            setBalances(balanceRes.data.results || balanceRes.data)

            // Load employees for Admin/HR filter
            if (isAdminOrHR) {
                const empRes = await employeesAPI.getAll()
                setEmployees(empRes.data.results || empRes.data || [])
            }
        } catch (error) {
            console.error('Error loading leaves:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await leavesAPI.create(formData)
            setShowForm(false)
            setFormData({ leave_type: '', start_date: '', end_date: '', reason: '' })
            loadData()
            alert('Leave request submitted successfully!')
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to submit leave request')
        }
    }

    const handleApprove = async (id) => {
        try {
            await leavesAPI.approve(id, {})
            loadData()
            alert('Leave approved!')
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to approve')
        }
    }

    const handleReject = async (id) => {
        const notes = prompt('Enter rejection reason (optional):')
        try {
            await leavesAPI.reject(id, { review_notes: notes || '' })
            loadData()
            alert('Leave rejected.')
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to reject')
        }
    }

    const handleCancel = async (id) => {
        if (confirm('Are you sure you want to cancel this request?')) {
            try {
                await leavesAPI.cancel(id)
                loadData()
            } catch (error) {
                alert(error.response?.data?.error || 'Failed to cancel')
            }
        }
    }

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'badge-warning',
            approved: 'badge-success',
            rejected: 'badge-error',
            cancelled: 'badge-info'
        }
        return badges[status] || 'badge-info'
    }

    // Filter requests by status and employee
    const filteredRequests = requests.filter(r => {
        const statusMatch = filter.status === 'all' || r.status === filter.status
        const employeeMatch = !filter.employee || r.employee == filter.employee
        return statusMatch && employeeMatch
    })

    const getCurrentEmployeeId = () => {
        if (!user || employees.length === 0) return null
        const emp = employees.find(e => e.user?.email === user.email)
        return emp ? emp.id : null
    }

    const currentEmployeeId = getCurrentEmployeeId()

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>
    }

    return (
        <div className="leaves-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Time Off Management</h1>
                    <p className="page-subtitle">
                        {isAdminOrHR ? 'Manage employee leave requests' : 'Apply for leaves and track your requests'}
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                    + Apply Leave
                </button>
            </div>

            {/* KPI Stats */}
            <div className="kpi-grid mb-lg">
                {isAdminOrHR ? (
                    <>
                        <div className="kpi-card">
                            <div className="kpi-icon-wrapper orange">⏳</div>
                            <div className="kpi-content">
                                <span className="kpi-label">Pending Requests</span>
                                <span className="kpi-value">{requests.filter(r => r.status === 'pending').length}</span>
                            </div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-icon-wrapper green">✓</div>
                            <div className="kpi-content">
                                <span className="kpi-label">Approved Requests</span>
                                <span className="kpi-value">{requests.filter(r => r.status === 'approved').length}</span>
                            </div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-icon-wrapper red">✕</div>
                            <div className="kpi-content">
                                <span className="kpi-label">Rejected Requests</span>
                                <span className="kpi-value">{requests.filter(r => r.status === 'rejected').length}</span>
                            </div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-icon-wrapper blue">🌴</div>
                            <div className="kpi-content">
                                <span className="kpi-label">On Leave Today</span>
                                <span className="kpi-value">
                                    {requests.filter(r => {
                                        if (r.status !== 'approved') return false;
                                        const today = new Date().toISOString().split('T')[0];
                                        return r.start_date <= today && r.end_date >= today;
                                    }).length}
                                </span>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {balances.map((balance, index) => (
                            <div key={balance.id} className="kpi-card">
                                <div className={`kpi-icon-wrapper ${index % 2 === 0 ? 'blue' : 'purple'}`}>
                                    {index % 2 === 0 ? '🏖️' : '🤒'}
                                </div>
                                <div className="kpi-content">
                                    <span className="kpi-label">{balance.leave_type_name}</span>
                                    <span className="kpi-value">{balance.remaining_days} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ {balance.total_days}</span></span>
                                </div>
                            </div>
                        ))}
                        <div className="kpi-card">
                            <div className="kpi-icon-wrapper orange">⏳</div>
                            <div className="kpi-content">
                                <span className="kpi-label">Pending Requests</span>
                                <span className="kpi-value">{requests.filter(r => r.status === 'pending').length}</span>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Filters Section */}
            <div className="card mb-lg">
                <h3 className="card-title mb-md">🔍 Filter Requests</h3>
                <div className="filter-container">
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
                        <label className="form-label">Status</label>
                        <div className="filter-tabs">
                            {['all', 'pending', 'approved', 'rejected'].map((tab) => (
                                <button
                                    key={tab}
                                    className={`filter-tab ${filter.status === tab ? 'active' : ''}`}
                                    onClick={() => setFilter({ ...filter, status: tab })}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    {filter.employee && (
                        <button
                            className="btn btn-secondary"
                            onClick={() => setFilter({ ...filter, employee: '' })}
                            style={{ alignSelf: 'flex-end' }}
                        >
                            Clear Employee Filter
                        </button>
                    )}
                </div>
            </div>

            {/* Leave Requests Table */}
            <div className="card">
                <h3 className="card-title mb-md">
                    📋 Leave Requests
                    {filter.employee && employees.find(e => e.id == filter.employee) && (
                        <span className="filter-badge">
                            Employee: {employees.find(e => e.id == filter.employee)?.full_name}
                        </span>
                    )}
                </h3>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                {isAdminOrHR && <th>Employee</th>}
                                <th>Type</th>
                                <th>From</th>
                                <th>To</th>
                                <th>Days</th>
                                <th>Reason</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdminOrHR ? 8 : 7} className="text-center text-muted">
                                        No leave requests found
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((request) => (
                                    <tr key={request.id}>
                                        {isAdminOrHR && <td>{request.employee_name}</td>}
                                        <td>{request.leave_type_name}</td>
                                        <td>{request.start_date}</td>
                                        <td>{request.end_date}</td>
                                        <td>{request.total_days}</td>
                                        <td className="reason-cell">{request.reason}</td>
                                        <td>
                                            <span className={`badge ${getStatusBadge(request.status)}`}>
                                                {request.status}
                                            </span>
                                        </td>
                                        <td>
                                            {isAdminOrHR && request.status === 'pending' && request.employee !== currentEmployeeId && (
                                                <div className="action-btns">
                                                    <button
                                                        className="btn btn-sm btn-success"
                                                        onClick={() => handleApprove(request.id)}
                                                        title="Approve"
                                                    >
                                                        ✓ Approve
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleReject(request.id)}
                                                        title="Reject"
                                                    >
                                                        ✗ Reject
                                                    </button>
                                                </div>
                                            )}
                                            {!isAdminOrHR && request.status === 'pending' && (
                                                <button
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => handleCancel(request.id)}
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Leave Application Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Apply for Leave</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">Leave Type</label>
                                <select
                                    className="form-select"
                                    value={formData.leave_type}
                                    onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                                    required
                                >
                                    <option value="">Select type</option>
                                    {leaveTypes.map((type) => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Start Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">End Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Reason</label>
                                <textarea
                                    className="form-textarea"
                                    rows={3}
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    required
                                    placeholder="Provide a reason for your leave request"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .kpi-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                }
                .kpi-card {
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: 16px;
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
                }
                .kpi-icon-wrapper {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                }
                .kpi-icon-wrapper.blue { background: #eff6ff; color: #3b82f6; }
                .kpi-icon-wrapper.purple { background: #f5f3ff; color: #8b5cf6; }
                .kpi-icon-wrapper.green { background: #ecfdf5; color: #10b981; }
                .kpi-icon-wrapper.orange { background: #fff7ed; color: #f97316; }
                .kpi-icon-wrapper.red { background: #fef2f2; color: #ef4444; }
                
                .kpi-content {
                    display: flex;
                    flex-direction: column;
                }
                .kpi-label {
                    color: var(--text-muted);
                    font-size: 0.85rem;
                    margin-bottom: 4px;
                }
                .kpi-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--text-primary);
                }
                
                .filter-container {
                    display: flex;
                    gap: var(--spacing-lg);
                    align-items: flex-end;
                    flex-wrap: wrap;
                }
                .filter-tabs {
                    display: flex;
                    gap: var(--spacing-sm);
                }
                .filter-tab {
                    padding: var(--spacing-sm) var(--spacing-md);
                    background: var(--bg-tertiary);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-md);
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: all var(--transition-fast);
                }
                .filter-tab:hover, .filter-tab.active {
                    background: var(--primary);
                    border-color: var(--primary);
                    color: white;
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
                .reason-cell {
                    max-width: 200px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .action-btns {
                    display: flex;
                    gap: var(--spacing-xs);
                }
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .modal {
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-xl);
                    padding: var(--spacing-xl);
                    width: 100%;
                    max-width: 500px;
                    max-height: 90vh;
                    overflow-y: auto;
                }
                .modal h2 { margin-bottom: var(--spacing-lg); }
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: var(--spacing-md);
                }
                .modal-actions {
                    display: flex;
                    gap: var(--spacing-md);
                    justify-content: flex-end;
                    margin-top: var(--spacing-lg);
                }
            `}</style>
        </div>
    )
}

export default Leaves
