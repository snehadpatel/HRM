import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { employeesAPI } from '../services/api'
import EmployeeDetailModal from '../components/EmployeeDetailModal'

function Employees() {
    const navigate = useNavigate()
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [showEditForm, setShowEditForm] = useState(false)
    const [editingEmployee, setEditingEmployee] = useState(null)
    const [viewingEmployee, setViewingEmployee] = useState(null)
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
    const [editData, setEditData] = useState({
        department: '',
        position: '',
        employment_type: '',
        phone: '',
        address: '',
        date_of_birth: '',
        gender: '',
        marital_status: '',
        bank_account: '',
        bank_name: '',
        ifsc_code: '',
        pan_number: '',
        uan_number: '',
        epf_code: ''
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
            alert('Employee created successfully!')
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

    const handleEdit = (employee) => {
        setEditingEmployee(employee)
        setEditData({
            department: employee.department || '',
            position: employee.position || '',
            employment_type: employee.employment_type || 'full_time',
            phone: employee.phone || '',
            address: employee.address || '',
            date_of_birth: employee.date_of_birth || '',
            gender: employee.gender || '',
            marital_status: employee.marital_status || '',
            bank_account: employee.bank_account || '',
            bank_name: employee.bank_name || '',
            ifsc_code: employee.ifsc_code || '',
            pan_number: employee.pan_number || '',
            uan_number: employee.uan_number || '',
            epf_code: employee.epf_code || ''
        })
        setShowEditForm(true)
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        try {
            await employeesAPI.update(editingEmployee.id, editData)
            setShowEditForm(false)
            setEditingEmployee(null)
            loadEmployees()
            alert('Employee updated successfully!')
        } catch (error) {
            alert('Failed to update employee: ' + (error.response?.data?.error || 'Unknown error'))
        }
    }

    const handleDelete = async (id, name) => {
        if (confirm(`Are you sure you want to delete ${name}?`)) {
            try {
                await employeesAPI.delete(id)
                loadEmployees()
                alert('Employee deleted successfully!')
            } catch (error) {
                alert('Failed to delete employee')
            }
        }
    }

    const handleViewProfile = (employee) => {
        setViewingEmployee(employee)
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

    const getInitials = (firstName, lastName) => {
        return (firstName?.[0] || '') + (lastName?.[0] || '')
    }

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
            {/* KPI Stats */}
            <div className="kpi-grid mb-lg">
                <div className="kpi-card">
                    <div className="kpi-icon-wrapper blue">👥</div>
                    <div className="kpi-content">
                        <span className="kpi-label">Total Employees</span>
                        <span className="kpi-value">{employees.length}</span>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon-wrapper purple">🏢</div>
                    <div className="kpi-content">
                        <span className="kpi-label">Departments</span>
                        <span className="kpi-value">{[...new Set(employees.map(e => e.department))].length}</span>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon-wrapper green">✅</div>
                    <div className="kpi-content">
                        <span className="kpi-label">Present Today</span>
                        <span className="kpi-value">{employees.filter(e => e.attendance_status === 'present').length}</span>
                    </div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-icon-wrapper orange">🌴</div>
                    <div className="kpi-content">
                        <span className="kpi-label">On Leave</span>
                        <span className="kpi-value">{employees.filter(e => e.attendance_status === 'leave').length}</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="card mb-lg">
                <div className="filter-row">
                    <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '200px' }}>
                        <div className="search-input-wrapper">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                className="form-input search-input"
                                placeholder="Search by name, ID, or email..."
                                value={filter.search}
                                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
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
                    <div className="no-data-state">
                        <p>No employees found matching your filters.</p>
                    </div>
                ) : (
                    employees.map((emp) => (
                        <div key={emp.id} className="employee-card-modern">
                            <div className="card-header-modern">
                                <div className="avatar-lg">
                                    {emp.profile_image ? (
                                        <img src={emp.profile_image} alt={emp.full_name} />
                                    ) : (
                                        <span>{getInitials(emp.user?.first_name, emp.user?.last_name)}</span>
                                    )}
                                </div>
                                <div className="header-info">
                                    <h3>{emp.full_name}</h3>
                                    <span className="position-text">{emp.position}</span>
                                    <span className="badge badge-primary department-badge">
                                        {departments.find(d => d.value === emp.department)?.label || emp.department}
                                    </span>
                                </div>
                            </div>

                            <div className="card-body-modern">
                                <div className="info-row">
                                    <div className="info-label">ID</div>
                                    <div className="info-value">{emp.employee_id}</div>
                                </div>
                                <div className="info-row">
                                    <div className="info-label">Email</div>
                                    <div className="info-value email-text" title={emp.user?.email}>{emp.user?.email}</div>
                                </div>
                                <div className="info-row">
                                    <div className="info-label">Phone</div>
                                    <div className="info-value">{emp.phone || '-'}</div>
                                </div>
                                <div className="info-row">
                                    <div className="info-label">Type</div>
                                    <div className="info-value" style={{ textTransform: 'capitalize' }}>
                                        {(emp.employment_type || 'Full Time').replace('_', ' ')}
                                    </div>
                                </div>
                            </div>

                            <div className="card-actions-modern">
                                <button
                                    className="action-btn-modern view"
                                    onClick={() => handleViewProfile(emp)}
                                    title="View Profile"
                                >
                                    View
                                </button>
                                <button
                                    className="action-btn-modern edit"
                                    onClick={() => handleEdit(emp)}
                                    title="Edit Details"
                                >
                                    Edit
                                </button>
                                <button
                                    className="action-btn-modern delete"
                                    onClick={() => handleDelete(emp.id, emp.full_name)}
                                    title="Delete Employee"
                                >
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
                                        <option value="hr">HR Officer</option>
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
                                    <label className="form-label">Hire Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.hire_date}
                                        onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                                        required
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

            {/* Edit Employee Modal */}
            {showEditForm && editingEmployee && (
                <div className="modal-overlay" onClick={() => setShowEditForm(false)}>
                    <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                        <h2>Edit Employee: {editingEmployee.full_name}</h2>
                        <form onSubmit={handleEditSubmit}>
                            <h3 className="section-title">Work Information</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Department</label>
                                    <select
                                        className="form-select"
                                        value={editData.department}
                                        onChange={(e) => setEditData({ ...editData, department: e.target.value })}
                                    >
                                        {departments.map((dept) => (
                                            <option key={dept.value} value={dept.value}>{dept.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Position</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={editData.position}
                                        onChange={(e) => setEditData({ ...editData, position: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        value={editData.phone}
                                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Address</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={editData.address}
                                        onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                    />
                                </div>
                            </div>

                            <h3 className="section-title">Personal Information</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Date of Birth</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={editData.date_of_birth}
                                        onChange={(e) => setEditData({ ...editData, date_of_birth: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Gender</label>
                                    <select
                                        className="form-select"
                                        value={editData.gender}
                                        onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                                    >
                                        <option value="">Select</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Marital Status</label>
                                    <select
                                        className="form-select"
                                        value={editData.marital_status}
                                        onChange={(e) => setEditData({ ...editData, marital_status: e.target.value })}
                                    >
                                        <option value="">Select</option>
                                        <option value="single">Single</option>
                                        <option value="married">Married</option>
                                        <option value="divorced">Divorced</option>
                                    </select>
                                </div>
                                <div className="form-group"></div>
                            </div>

                            <h3 className="section-title">Bank Details</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Account Number</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={editData.bank_account}
                                        onChange={(e) => setEditData({ ...editData, bank_account: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Bank Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={editData.bank_name}
                                        onChange={(e) => setEditData({ ...editData, bank_name: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">IFSC Code</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={editData.ifsc_code}
                                        onChange={(e) => setEditData({ ...editData, ifsc_code: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">PAN Number</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={editData.pan_number}
                                        onChange={(e) => setEditData({ ...editData, pan_number: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">UAN Number</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={editData.uan_number}
                                        onChange={(e) => setEditData({ ...editData, uan_number: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">EPF Code</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={editData.epf_code}
                                        onChange={(e) => setEditData({ ...editData, epf_code: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEditForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Employee Detail 360 Modal */}
            {viewingEmployee && (
                <EmployeeDetailModal
                    employee={viewingEmployee}
                    departments={departments}
                    onClose={() => setViewingEmployee(null)}
                />
            )}

            <style>{`
                /* Filters */
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

                .filter-row {
                    display: flex;
                    gap: var(--spacing-md);
                    align-items: center;
                    flex-wrap: wrap;
                }
                .search-input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .search-icon {
                    position: absolute;
                    left: 12px;
                    color: var(--text-muted);
                    font-size: 0.9rem;
                }
                .search-input {
                    padding-left: 36px;
                }

                /* Grid Layout */
                .employees-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 20px;
                }
                .no-data-state {
                    grid-column: 1 / -1;
                    padding: 40px;
                    text-align: center;
                    background: var(--bg-tertiary);
                    border-radius: var(--radius-lg);
                    color: var(--text-secondary);
                }

                /* Modern Card */
                .employee-card-modern {
                    background: var(--bg-card);
                    border: 1px solid var(--border-color);
                    border-radius: 16px;
                    overflow: hidden;
                    transition: transform 0.2s, box-shadow 0.2s;
                    display: flex;
                    flex-direction: column;
                }
                .employee-card-modern:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06);
                    border-color: var(--primary);
                }

                .card-header-modern {
                    padding: 20px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    border-bottom: 1px solid var(--bg-body);
                }
                .avatar-lg {
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    font-weight: 600;
                    flex-shrink: 0;
                }
                .header-info h3 {
                    font-size: 1.1rem;
                    margin-bottom: 4px;
                }
                .position-text {
                    display: block;
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    margin-bottom: 8px;
                }
                .department-badge {
                    font-size: 0.7rem;
                    padding: 2px 8px;
                    border-radius: 6px;
                }

                .card-body-modern {
                    padding: 20px;
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.9rem;
                }
                .info-label {
                    color: var(--text-muted);
                }
                .info-value {
                    color: var(--text-primary);
                    font-weight: 500;
                    text-align: right;
                }
                .email-text {
                    max-width: 180px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .card-actions-modern {
                    padding: 16px;
                    background: var(--bg-tertiary);
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 8px;
                }
                .action-btn-modern {
                    padding: 8px;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    background: white;
                    color: var(--text-secondary);
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-weight: 500;
                }
                .action-btn-modern:hover {
                    border-color: var(--primary);
                    color: var(--primary);
                    background: #eef2ff;
                }
                .action-btn-modern.delete:hover {
                    border-color: var(--error);
                    color: var(--error);
                    background: #fef2f2;
                }

                /* Modal Styles (reused) */
                .modal-lg { max-width: 650px; }
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: var(--spacing-md);
                }
                .section-title {
                    font-size: 0.95rem;
                    margin: 20px 0 12px;
                    padding-top: 16px;
                    border-top: 1px solid var(--border-color);
                    color: var(--text-primary);
                }
                .section-title:first-of-type {
                    margin-top: 0;
                    padding-top: 0;
                    border-top: none;
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
                .modal h2 { margin-bottom: var(--spacing-lg); }
            `}</style>
        </div>
    )
}

export default Employees
