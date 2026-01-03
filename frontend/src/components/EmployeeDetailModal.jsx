import React, { useState, useEffect } from 'react'
import { payrollAPI, attendanceAPI, leavesAPI, employeesAPI } from '../services/api'

const EmployeeDetailModal = ({ employee, onClose, departments }) => {
    const [activeTab, setActiveTab] = useState('overview')
    const [loading, setLoading] = useState(true)
    const [details, setDetails] = useState({
        salary: null,
        attendance: [],
        leaves: [],
        documents: []
    })

    useEffect(() => {
        const fetchDetails = async () => {
            if (!employee) return
            try {
                setLoading(true)
                const [salaryRes, attendanceRes, leavesRes] = await Promise.all([
                    payrollAPI.getSalaries({ employee_id: employee.employee_id }), // Assuming filter support
                    attendanceAPI.getAll({ employee_id: employee.employee_id }),
                    leavesAPI.getRequests({ employee_id: employee.employee_id })
                ])

                // salaryRes might return a list, pick the first active one
                const salary = Array.isArray(salaryRes.data.results) ? salaryRes.data.results[0] : salaryRes.data[0] || null

                setDetails({
                    salary: salary,
                    attendance: attendanceRes.data.results || attendanceRes.data || [],
                    leaves: leavesRes.data.results || leavesRes.data || [],
                    documents: employee.documents || [] // Assuming documents are in employee object from serializer
                })
            } catch (error) {
                console.error("Error fetching employee details", error)
            } finally {
                setLoading(false)
            }
        }
        fetchDetails()
    }, [employee])

    if (!employee) return null

    const renderOverview = () => (
        <div className="detail-section">
            <div className="detail-grid">
                <div className="info-group">
                    <label>Employee ID</label>
                    <div className="value">{employee.employee_id}</div>
                </div>
                <div className="info-group">
                    <label>Department</label>
                    <div className="value badge badge-primary">
                        {departments.find(d => d.value === employee.department)?.label || employee.department}
                    </div>
                </div>
                <div className="info-group">
                    <label>Position</label>
                    <div className="value">{employee.position}</div>
                </div>
                <div className="info-group">
                    <label>Status</label>
                    <div className="value" style={{ textTransform: 'capitalize' }}>{employee.employment_type?.replace('_', ' ')}</div>
                </div>
                <div className="info-group">
                    <label>Email</label>
                    <div className="value">{employee.user?.email || employee.personal_email}</div>
                </div>
                <div className="info-group">
                    <label>Phone</label>
                    <div className="value">{employee.phone || '-'}</div>
                </div>
                <div className="info-group">
                    <label>Hire Date</label>
                    <div className="value">{employee.hire_date}</div>
                </div>
                <div className="info-group">
                    <label>Manager</label>
                    <div className="value">{employee.manager_name || '-'}</div>
                </div>
            </div>

            <h4 className="subsection-title">About</h4>
            <div className="bio-box">
                {employee.about_me || "No bio available."}
            </div>

            {employee.job_passion && (
                <>
                    <h4 className="subsection-title">Passion</h4>
                    <p className="text-secondary">{employee.job_passion}</p>
                </>
            )}

            {(employee.skills && employee.skills.length > 0) && (
                <>
                    <h4 className="subsection-title">Skills</h4>
                    <div className="tags-container">
                        {employee.skills.map((skill, i) => (
                            <span key={i} className="tag">{skill}</span>
                        ))}
                    </div>
                </>
            )}
            {(employee.interests && employee.interests.length > 0) && (
                <>
                    <h4 className="subsection-title">Interests</h4>
                    <div className="tags-container">
                        {employee.interests.map((interest, i) => (
                            <span key={i} className="tag tag-secondary">{interest}</span>
                        ))}
                    </div>
                </>
            )}
        </div>
    )

    const renderPersonal = () => (
        <div className="detail-section">
            <h4 className="subsection-title mt-0">Personal Information</h4>
            <div className="detail-grid">
                <div className="info-group">
                    <label>Date of Birth</label>
                    <div className="value">{employee.date_of_birth || '-'}</div>
                </div>
                <div className="info-group">
                    <label>Gender</label>
                    <div className="value" style={{ textTransform: 'capitalize' }}>{employee.gender || '-'}</div>
                </div>
                <div className="info-group">
                    <label>Marital Status</label>
                    <div className="value" style={{ textTransform: 'capitalize' }}>{employee.marital_status || '-'}</div>
                </div>
                <div className="info-group">
                    <label>Personal Email</label>
                    <div className="value">{employee.personal_email || '-'}</div>
                </div>
                <div className="info-group full-width">
                    <label>Address</label>
                    <div className="value">{employee.address || '-'}</div>
                </div>
            </div>

            <div className="divider"></div>

            <h4 className="subsection-title">Bank & Statutory Details</h4>
            <div className="detail-grid">
                <div className="info-group">
                    <label>Bank Name</label>
                    <div className="value">{employee.bank_name || '-'}</div>
                </div>
                <div className="info-group">
                    <label>Account Number</label>
                    <div className="value">{employee.bank_account || '-'}</div>
                </div>
                <div className="info-group">
                    <label>IFSC Code</label>
                    <div className="value">{employee.ifsc_code || '-'}</div>
                </div>
                <div className="info-group">
                    <label>PAN Number</label>
                    <div className="value">{employee.pan_number || '-'}</div>
                </div>
                <div className="info-group">
                    <label>UAN</label>
                    <div className="value">{employee.uan_number || '-'}</div>
                </div>
                <div className="info-group">
                    <label>EPF Code</label>
                    <div className="value">{employee.epf_code || '-'}</div>
                </div>
            </div>
        </div>
    )

    const renderSalary = () => (
        <div className="detail-section">
            {details.salary ? (
                <div className="salary-card">
                    <div className="salary-header">
                        <div className="salary-title">Current Salary Structure</div>
                        <div className="salary-amount">₹{parseFloat(details.salary.net_salary).toLocaleString()} <span className="text-muted">/ month</span></div>
                    </div>
                    <div className="salary-breakdown">
                        <div className="breakdown-item">
                            <span>Basic Salary</span>
                            <span>₹{parseFloat(details.salary.basic_salary).toLocaleString()}</span>
                        </div>
                        <div className="breakdown-item">
                            <span>HRA</span>
                            <span>₹{parseFloat(details.salary.hra).toLocaleString()}</span>
                        </div>
                        <div className="breakdown-item">
                            <span>Allowances</span>
                            <span>₹{(parseFloat(details.salary.standard_allowance || 0) + parseFloat(details.salary.fixed_allowance || 0)).toLocaleString()}</span>
                        </div>
                        <div className="breakdown-item">
                            <span>Performance Bonus</span>
                            <span>₹{parseFloat(details.salary.performance_bonus || 0).toLocaleString()}</span>
                        </div>
                        <div className="breakdown-divider"></div>
                        <div className="breakdown-item text-danger">
                            <span>Deductions (PF, Tax)</span>
                            <span>-₹{parseFloat(details.salary.total_deductions).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="empty-state">No salary structure defined.</div>
            )}
        </div>
    )

    const renderAttendance = () => (
        <div className="detail-section">
            <div className="table-responsive">
                <table className="detail-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Check In</th>
                            <th>Check Out</th>
                            <th>Hours</th>
                        </tr>
                    </thead>
                    <tbody>
                        {details.attendance.length > 0 ? (
                            details.attendance.map(att => (
                                <tr key={att.id}>
                                    <td>{att.date}</td>
                                    <td>
                                        <span className={`status-badge ${att.status}`}>
                                            {att.status}
                                        </span>
                                    </td>
                                    <td>{att.check_in ? new Date(att.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                    <td>{att.check_out ? new Date(att.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                    <td>{att.working_hours || '-'}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colspan="5" className="text-center">No attendance records found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )

    const renderLeaves = () => (
        <div className="detail-section">
            <div className="table-responsive">
                <table className="detail-table">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Dates</th>
                            <th>Uniq</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {details.leaves.length > 0 ? (
                            details.leaves.map(leave => (
                                <tr key={leave.id}>
                                    <td>{leave.leave_type_name}</td>
                                    <td>
                                        <div>{leave.start_date}</div>
                                        <div className="text-muted text-xs">to {leave.end_date}</div>
                                    </td>
                                    <td>{leave.duration_days} days</td>
                                    <td>
                                        <span className={`status-badge ${leave.status}`}>
                                            {leave.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colspan="4" className="text-center">No leave requests found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal modal-360" onClick={e => e.stopPropagation()}>
                <div className="modal-header-profile">
                    <div className="profile-hero">
                        <div className="avatar-xl">
                            {employee.profile_image ? (
                                <img src={employee.profile_image} alt={employee.full_name} />
                            ) : (
                                <span>{(employee.first_name?.[0] || '') + (employee.last_name?.[0] || '')}</span>
                            )}
                        </div>
                        <div className="hero-info">
                            <h2>{employee.full_name}</h2>
                            <p>{employee.position}</p>
                        </div>
                        <button className="close-btn" onClick={onClose}>×</button>
                    </div>
                    <div className="profile-tabs">
                        {['overview', 'personal', 'salary', 'attendance', 'leaves'].map(tab => (
                            <button
                                key={tab}
                                className={`profile-tab ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="modal-content-scroll">
                    {loading ? (
                        <div className="p-4 text-center">Loading details...</div>
                    ) : (
                        <>
                            {activeTab === 'overview' && renderOverview()}
                            {activeTab === 'personal' && renderPersonal()}
                            {activeTab === 'salary' && renderSalary()}
                            {activeTab === 'attendance' && renderAttendance()}
                            {activeTab === 'leaves' && renderLeaves()}
                        </>
                    )}
                </div>
            </div>
            <style jsx>{`
                .modal-360 {
                    max-width: 800px;
                    padding: 0;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    height: 85vh;
                }
                .modal-header-profile {
                    background: white;
                    border-bottom: 1px solid var(--border-color);
                }
                .profile-hero {
                    padding: 24px;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    background: linear-gradient(to right, #f8fafc, #fff);
                    position: relative;
                }
                .close-btn {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: var(--text-muted);
                }
                .avatar-xl {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: var(--primary);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    font-weight: 600;
                }
                .hero-info h2 { margin: 0 0 4px 0; font-size: 1.5rem; }
                .hero-info p { margin: 0; color: var(--text-secondary); }
                
                .profile-tabs {
                    display: flex;
                    padding: 0 24px;
                    gap: 24px;
                }
                .profile-tab {
                    padding: 16px 0;
                    background: none;
                    border: none;
                    border-bottom: 2px solid transparent;
                    color: var(--text-secondary);
                    cursor: pointer;
                    font-weight: 500;
                }
                .profile-tab.active {
                    color: var(--primary);
                    border-bottom-color: var(--primary);
                }
                
                .modal-content-scroll {
                    flex: 1;
                    overflow-y: auto;
                    padding: 24px;
                    background: #f8fafc;
                }
                
                .detail-section {
                    background: white;
                    border-radius: 12px;
                    padding: 24px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                }
                .detail-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 24px;
                }
                .info-group label {
                    display: block;
                    font-size: 0.8rem;
                    color: var(--text-muted);
                    margin-bottom: 4px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .info-group .value {
                    font-weight: 500;
                    color: var(--text-primary);
                }
                .subsection-title { margin: 24px 0 12px; color: var(--text-primary); }
                .bio-box { color: var(--text-secondary); line-height: 1.5; }
                
                /* Salary Card */
                .salary-card {
                    background: #fff;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                }
                .salary-header {
                    padding: 16px;
                    background: #f1f5f9;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .salary-title { font-weight: 600; }
                .salary-amount { font-size: 1.2rem; font-weight: 700; color: var(--primary); }
                .salary-breakdown { padding: 16px; }
                .breakdown-item { display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.95rem; }
                .breakdown-divider { height: 1px; background: var(--border-color); margin: 8px 0; }
                
                /* Tables */
                .detail-table { width: 100%; border-collapse: collapse; }
                .detail-table th { text-align: left; padding: 12px; color: var(--text-muted); font-weight: 500; border-bottom: 1px solid var(--border-color); }
                .detail-table td { padding: 12px; border-bottom: 1px solid var(--border-color); font-size: 0.9rem; }
                .detail-table tr:last-child td { border-bottom: none; }
                .status-badge {
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    font-weight: 500;
                    text-transform: capitalize;
                }
                .status-badge.present { background: #dcfce7; color: #166534; }
                .status-badge.absent { background: #fee2e2; color: #991b1b; }
                .status-badge.late { background: #fef9c3; color: #854d0e; }
                .status-badge.approved { background: #dcfce7; color: #166534; }
                .status-badge.pending { background: #ffedd5; color: #9a3412; }
                .status-badge.rejected { background: #fee2e2; color: #991b1b; }

                 /* Profile Additional Styles */
                .tags-container { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
                .tag {
                    background: #eff6ff;
                    color: #1d4ed8;
                    padding: 4px 12px;
                    border-radius: 16px;
                    font-size: 0.8rem;
                    font-weight: 500;
                }
                .tag-secondary { background: #f1f5f9; color: #475569; }
                .divider { height: 1px; background: var(--border-color); margin: 32px 0; }
                .mt-0 { margin-top: 0; }
                .full-width { grid-column: 1 / -1; }
            `}</style>
        </div>
    )
}

export default EmployeeDetailModal
