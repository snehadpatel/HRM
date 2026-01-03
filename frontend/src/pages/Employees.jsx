import { useState, useEffect } from 'react'
import { employeesAPI } from '../services/api'

function Employees() {
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [filter, setFilter] = useState({ department: '', search: '' })
    const [formData, setFormData] = useState({
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        role: 'employee',
        department: '',
        position: '',
        employment_type: 'full_time',
        hire_date: '',
        phone: ''
    })

    useEffect(() => {
        loadEmployees()
    }, [])

    const loadEmployees = async () => {
        try {
            const response = await employeesAPI.getAll(filter)
            setEmployees(response.data.results || response.data)
        } catch (error) {
            console.error('Error loading employees:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await employeesAPI.create(formData)
            setShowForm(false)
            setFormData({
                email: '',
                first_name: '',
                last_name: '',
                password: '',
                role: 'employee',
                department: '',
                position: '',
                employment_type: 'full_time',
                hire_date: '',
                phone: ''
            })
            loadEmployees()
        } catch (error) {
            const errors = error.response?.data
            if (errors) {
                const firstError = Object.values(errors)[0]
                alert(Array.isArray(firstError) ? firstError[0] : firstError)
            } else {
                alert('Failed to create employee')
            }
        }
    }

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this employee?')) {
            try {
                await employeesAPI.delete(id)
                loadEmployees()
            } catch (error) {
                alert('Failed to delete employee')
            }
        }
    }

    const departments = [
        { value: 'engineering', label: 'Engineering' },
        { value: 'hr', label: 'Human Resources' },
        { value: 'finance', label: 'Finance' },
        { value: 'sales', label: 'Sales' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'operations', label: 'Operations' },
        { value: 'support', label: 'Customer Support' },
    ]

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>
    }

    return (
        <div className="employees-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Employees</h1>
                    <p className="page-subtitle">Manage all employees in the organization</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                    + Add Employee
                </button>
            </div>

            {/* Stats */}
            <div className="stats-grid mb-lg">
                <div className="stat-card">
                    <div className="stat-value">{employees.length}</div>
                    <div className="stat-label">Total Employees</div>
                </div>
                {departments.slice(0, 3).map((dept) => (
                    <div key={dept.value} className="stat-card">
                        <div className="stat-value">
                            {employees.filter(e => e.department === dept.value).length}
                        </div>
                        <div className="stat-label">{dept.label}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="card mb-lg">
                <div className="filter-row">
                    <div className="form-group" style={{ margin: 0, flex: 1 }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search by name or ID..."
                            value={filter.search}
                            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                        />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                        <select
                            className="form-select"
                            value={filter.department}
                            onChange={(e) => setFilter({ ...filter, department: e.target.value })}
                        >
                            <option value="">All Departments</option>
                            {departments.map((dept) => (
                                <option key={dept.value} value={dept.value}>{dept.label}</option>
                            ))}
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={loadEmployees}>
                        Search
                    </button>
                </div>
            </div>

            {/* Employees Grid */}
            <div className="employees-grid">
                {employees.length === 0 ? (
                    <div className="card text-center text-muted" style={{ gridColumn: '1/-1', padding: 'var(--spacing-2xl)' }}>
                        No employees found
                    </div>
                ) : (
                    employees.map((emp) => (
                        <div key={emp.id} className="employee-card card">
                            <div className="employee-header">
                                <div className="employee-avatar">
                                    {emp.profile_image ? (
                                        <img src={emp.profile_image} alt={emp.full_name} />
                                    ) : (
                                        <span>{emp.user?.first_name?.[0]}{emp.user?.last_name?.[0]}</span>
                                    )}
                                </div>
                                <div className="employee-info">
                                    <h4>{emp.full_name}</h4>
                                    <span className="employee-id">{emp.employee_id}</span>
                                </div>
                            </div>
                            <div className="employee-details">
                                <div className="detail-item">
                                    <span className="detail-label">Position</span>
                                    <span className="detail-value">{emp.position}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Department</span>
                                    <span className="badge badge-primary">{emp.department}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Email</span>
                                    <span className="detail-value">{emp.user?.email}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Phone</span>
                                    <span className="detail-value">{emp.phone || '-'}</span>
                                </div>
                            </div>
                            <div className="employee-actions">
                                <button className="btn btn-sm btn-secondary">Edit</button>
                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(emp.id)}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Employee Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                        <h2>Add New Employee</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">First Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Last Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Password</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Role</label>
                                    <select
                                        className="form-select"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="employee">Employee</option>
                                        <option value="hr">HR Manager</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Department</label>
                                    <select
                                        className="form-select"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map((dept) => (
                                            <option key={dept.value} value={dept.value}>{dept.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Position</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.position}
                                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Employment Type</label>
                                    <select
                                        className="form-select"
                                        value={formData.employment_type}
                                        onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                                    >
                                        <option value="full_time">Full Time</option>
                                        <option value="part_time">Part Time</option>
                                        <option value="contract">Contract</option>
                                        <option value="intern">Intern</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Hire Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.hire_date}
                                        onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Add Employee
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
        .employees-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: var(--spacing-lg);
        }
        
        .employee-card {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }
        
        .employee-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }
        
        .employee-avatar {
          width: 50px;
          height: 50px;
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: white;
          overflow: hidden;
        }
        
        .employee-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .employee-info h4 {
          margin: 0;
          font-size: 1rem;
        }
        
        .employee-id {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        
        .employee-details {
          display: grid;
          gap: var(--spacing-sm);
        }
        
        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .detail-label {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        
        .detail-value {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        
        .employee-actions {
          display: flex;
          gap: var(--spacing-sm);
          margin-top: auto;
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--border-color);
        }
        
        .filter-row {
          display: flex;
          gap: var(--spacing-md);
          align-items: center;
          flex-wrap: wrap;
        }
        
        .modal-lg {
          max-width: 600px;
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
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .modal h2 {
          margin-bottom: var(--spacing-lg);
        }
      `}</style>
        </div>
    )
}

export default Employees
