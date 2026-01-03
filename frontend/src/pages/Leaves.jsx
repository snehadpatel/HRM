import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { leavesAPI } from '../services/api'

function Leaves() {
    const { isAdminOrHR } = useAuth()
    const [requests, setRequests] = useState([])
    const [leaveTypes, setLeaveTypes] = useState([])
    const [balances, setBalances] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        leave_type: '',
        start_date: '',
        end_date: '',
        reason: ''
    })
    const [filter, setFilter] = useState('all')

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
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to submit leave request')
        }
    }

    const handleApprove = async (id) => {
        try {
            await leavesAPI.approve(id, {})
            loadData()
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to approve')
        }
    }

    const handleReject = async (id) => {
        const notes = prompt('Enter rejection reason (optional):')
        try {
            await leavesAPI.reject(id, { review_notes: notes || '' })
            loadData()
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

    const filteredRequests = requests.filter(r =>
        filter === 'all' || r.status === filter
    )

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>
    }

    return (
        <div className="leaves-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Leave Management</h1>
                    <p className="page-subtitle">Apply for leaves and track your requests</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                    + Apply Leave
                </button>
            </div>

            {/* Leave Balance */}
            <div className="stats-grid mb-lg">
                {balances.map((balance) => (
                    <div key={balance.id} className="stat-card">
                        <div className="stat-value">{balance.remaining_days}/{balance.total_days}</div>
                        <div className="stat-label">{balance.leave_type_name}</div>
                    </div>
                ))}
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs mb-lg">
                {['all', 'pending', 'approved', 'rejected'].map((tab) => (
                    <button
                        key={tab}
                        className={`filter-tab ${filter === tab ? 'active' : ''}`}
                        onClick={() => setFilter(tab)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Leave Requests Table */}
            <div className="card">
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
                                            {isAdminOrHR && request.status === 'pending' && (
                                                <div className="action-btns">
                                                    <button
                                                        className="btn btn-sm btn-success"
                                                        onClick={() => handleApprove(request.id)}
                                                    >
                                                        ✓
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleReject(request.id)}
                                                    >
                                                        ✗
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
        
        .modal h2 {
          margin-bottom: var(--spacing-lg);
        }
        
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
