import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { employeesAPI, authAPI } from '../services/api'

function Profile() {
    const { user } = useAuth()
    const [profile, setProfile] = useState(null)
    const [salaryInfo, setSalaryInfo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('resume')

    // Password change state
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    })
    const [passwordError, setPasswordError] = useState('')
    const [passwordSuccess, setPasswordSuccess] = useState('')

    useEffect(() => {
        loadProfile()
    }, [])

    const loadProfile = async () => {
        try {
            const response = await employeesAPI.getMyProfile()
            setProfile(response.data)

            // Load salary info if admin
            if (user?.role === 'admin' && response.data?.id) {
                try {
                    const salaryRes = await employeesAPI.getSalary(response.data.id)
                    setSalaryInfo(salaryRes.data)
                } catch (err) {
                    console.log('No salary info available')
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error)
        } finally {
            setLoading(false)
        }
    }

    const handlePasswordChange = async (e) => {
        e.preventDefault()
        setPasswordError('')
        setPasswordSuccess('')

        if (passwordData.new_password !== passwordData.confirm_password) {
            setPasswordError('New passwords do not match')
            return
        }

        try {
            await authAPI.changePassword(passwordData)
            setPasswordSuccess('Password changed successfully')
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
        } catch (error) {
            setPasswordError(error.response?.data?.error || 'Failed to change password')
        }
    }

    const tabs = [
        { id: 'resume', label: 'Resume' },
        { id: 'private', label: 'Private Info' },
    ]

    // Only show Salary Info tab for Admin
    if (user?.role === 'admin') {
        tabs.push({ id: 'salary', label: 'Salary Info' })
    }

    tabs.push({ id: 'security', label: 'Security' })

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>
    }

    return (
        <div className="profile-page">
            <h1 className="page-title">My Profile</h1>

            {/* Profile Header */}
            <div className="profile-header card">
                <div className="profile-photo">
                    {profile?.profile_image ? (
                        <img src={profile.profile_image} alt="Profile" />
                    ) : (
                        <div className="photo-placeholder">
                            {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                        </div>
                    )}
                </div>
                <div className="profile-basic">
                    <h2>{user?.first_name} {user?.last_name}</h2>
                    <div className="profile-details">
                        <div className="detail-item">
                            <span className="label">Login ID:</span>
                            <span className="value">{profile?.login_id || user?.login_id || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">Email:</span>
                            <span className="value">{user?.email}</span>
                        </div>
                        <div className="detail-item">
                            <span className="label">Mobile:</span>
                            <span className="value">{profile?.phone || 'Not set'}</span>
                        </div>
                    </div>
                </div>
                <div className="profile-work">
                    <div className="detail-item">
                        <span className="label">Company:</span>
                        <span className="value">{profile?.company_name || 'Odoo India'}</span>
                    </div>
                    <div className="detail-item">
                        <span className="label">Department:</span>
                        <span className="value">{profile?.department || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                        <span className="label">Manager:</span>
                        <span className="value">{profile?.manager_name || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                        <span className="label">Location:</span>
                        <span className="value">{profile?.location || 'N/A'}</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="profile-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="tab-content card">
                {/* Resume Tab */}
                {activeTab === 'resume' && (
                    <div className="resume-tab">
                        <div className="section">
                            <h3>About Me</h3>
                            <p>{profile?.about_me || 'No information provided'}</p>
                        </div>
                        <div className="section">
                            <h3>What I love about my job</h3>
                            <p>{profile?.job_passion || 'No information provided'}</p>
                        </div>
                        <div className="section">
                            <h3>My interests and hobbies</h3>
                            <p>{profile?.interests || 'No information provided'}</p>
                        </div>
                        <div className="section">
                            <h3>Skills</h3>
                            {profile?.skills?.length > 0 ? (
                                <div className="skills-list">
                                    {profile.skills.map((skill, i) => (
                                        <span key={i} className="skill-tag">{skill}</span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted">No skills added</p>
                            )}
                        </div>
                        <div className="section">
                            <h3>Certifications</h3>
                            {profile?.certifications?.length > 0 ? (
                                <ul className="cert-list">
                                    {profile.certifications.map((cert, i) => (
                                        <li key={i}>{cert}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-muted">No certifications added</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Private Info Tab */}
                {activeTab === 'private' && (
                    <div className="private-info-tab">
                        <div className="info-grid">
                            <div className="info-section">
                                <h3>Personal Information</h3>
                                <div className="info-row">
                                    <span className="label">Date of Birth:</span>
                                    <span className="value">{profile?.date_of_birth || 'Not set'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Gender:</span>
                                    <span className="value">{profile?.gender || 'Not set'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Marital Status:</span>
                                    <span className="value">{profile?.marital_status || 'Not set'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Personal Email:</span>
                                    <span className="value">{profile?.personal_email || 'Not set'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Address:</span>
                                    <span className="value">{profile?.address || 'Not set'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Date of Joining:</span>
                                    <span className="value">{profile?.hire_date || 'Not set'}</span>
                                </div>
                            </div>

                            <div className="info-section">
                                <h3>Bank Details</h3>
                                <div className="info-row">
                                    <span className="label">Account Number:</span>
                                    <span className="value">{profile?.bank_account || 'Not set'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Bank Name:</span>
                                    <span className="value">{profile?.bank_name || 'Not set'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">IFSC Code:</span>
                                    <span className="value">{profile?.ifsc_code || 'Not set'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">PAN No:</span>
                                    <span className="value">{profile?.pan_number || 'Not set'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">UAN No:</span>
                                    <span className="value">{profile?.uan_number || 'Not set'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">EPF Code:</span>
                                    <span className="value">{profile?.epf_code || 'Not set'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Salary Info Tab (Admin Only) */}
                {activeTab === 'salary' && user?.role === 'admin' && (
                    <div className="salary-tab">
                        {salaryInfo ? (
                            <>
                                <div className="salary-summary">
                                    <div className="salary-box">
                                        <span className="label">Month Wage</span>
                                        <span className="value">₹{salaryInfo.monthly_wage?.toLocaleString()}</span>
                                    </div>
                                    <div className="salary-box">
                                        <span className="label">Yearly Wage</span>
                                        <span className="value">₹{salaryInfo.yearly_wage?.toLocaleString()}</span>
                                    </div>
                                    <div className="salary-box">
                                        <span className="label">Working Days/Week</span>
                                        <span className="value">{salaryInfo.working_days_per_week}</span>
                                    </div>
                                    <div className="salary-box">
                                        <span className="label">Break Time</span>
                                        <span className="value">{salaryInfo.break_time_hours} hrs</span>
                                    </div>
                                </div>

                                <h3>Salary Components</h3>
                                <div className="salary-breakdown">
                                    <div className="component-row">
                                        <span>Basic Salary ({salaryInfo.basic_percent}%)</span>
                                        <span>₹{salaryInfo.basic_salary?.toLocaleString()}</span>
                                    </div>
                                    <div className="component-row">
                                        <span>HRA ({salaryInfo.hra_percent}% of Basic)</span>
                                        <span>₹{salaryInfo.hra?.toLocaleString()}</span>
                                    </div>
                                    <div className="component-row">
                                        <span>Standard Allowance</span>
                                        <span>₹{salaryInfo.standard_allowance?.toLocaleString()}</span>
                                    </div>
                                    <div className="component-row">
                                        <span>Performance Bonus ({salaryInfo.performance_bonus_percent}%)</span>
                                        <span>₹{salaryInfo.performance_bonus?.toLocaleString()}</span>
                                    </div>
                                    <div className="component-row">
                                        <span>Leave Travel Allowance ({salaryInfo.lta_percent}%)</span>
                                        <span>₹{salaryInfo.lta?.toLocaleString()}</span>
                                    </div>
                                    <div className="component-row total">
                                        <span>Gross Salary</span>
                                        <span>₹{salaryInfo.gross_salary?.toLocaleString()}</span>
                                    </div>
                                </div>

                                <h3>Deductions</h3>
                                <div className="salary-breakdown deductions">
                                    <div className="component-row">
                                        <span>PF Employee ({salaryInfo.pf_employee_percent}% of Basic)</span>
                                        <span>- ₹{salaryInfo.pf_employee_deduction?.toLocaleString()}</span>
                                    </div>
                                    <div className="component-row">
                                        <span>Professional Tax</span>
                                        <span>- ₹{salaryInfo.professional_tax?.toLocaleString()}</span>
                                    </div>
                                    <div className="component-row total">
                                        <span>Net Salary</span>
                                        <span>₹{salaryInfo.net_salary?.toLocaleString()}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <p className="text-muted">No salary information available</p>
                        )}
                    </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                    <div className="security-tab">
                        <h3>Change Password</h3>

                        {passwordError && <div className="alert alert-error">{passwordError}</div>}
                        {passwordSuccess && <div className="alert alert-success">{passwordSuccess}</div>}

                        <form onSubmit={handlePasswordChange} className="password-form">
                            <div className="form-group">
                                <label className="form-label">Current Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={passwordData.current_password}
                                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={passwordData.new_password}
                                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirm New Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={passwordData.confirm_password}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-primary">Change Password</button>
                        </form>
                    </div>
                )}
            </div>

            <style>{`
                .profile-page { max-width: 1000px; }
                
                .profile-header {
                    display: grid;
                    grid-template-columns: auto 1fr 1fr;
                    gap: 24px;
                    align-items: start;
                }
                
                .profile-photo { width: 100px; height: 100px; }
                .profile-photo img, .photo-placeholder {
                    width: 100%; height: 100%;
                    border-radius: 50%;
                    object-fit: cover;
                }
                .photo-placeholder {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    font-weight: 600;
                }
                
                .profile-basic h2 { margin-bottom: 12px; }
                .profile-details, .profile-work { display: flex; flex-direction: column; gap: 8px; }
                .detail-item { display: flex; gap: 8px; font-size: 0.9rem; }
                .detail-item .label { color: var(--text-muted); min-width: 80px; }
                .detail-item .value { font-weight: 500; }
                
                .profile-tabs {
                    display: flex;
                    gap: 4px;
                    margin: 20px 0 0;
                    border-bottom: 1px solid var(--border-color);
                }
                .tab-btn {
                    padding: 10px 20px;
                    background: none;
                    border: none;
                    border-bottom: 2px solid transparent;
                    cursor: pointer;
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                }
                .tab-btn.active {
                    color: var(--primary);
                    border-bottom-color: var(--primary);
                    font-weight: 500;
                }
                .tab-btn:hover { color: var(--primary); }
                
                .tab-content { margin-top: 0; border-radius: 0 0 8px 8px; }
                
                .section { margin-bottom: 24px; }
                .section h3 { margin-bottom: 8px; font-size: 1rem; }
                .section p { color: var(--text-secondary); }
                
                .skills-list { display: flex; flex-wrap: wrap; gap: 8px; }
                .skill-tag {
                    background: #e0e7ff;
                    color: var(--primary);
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                }
                
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
                .info-section h3 { margin-bottom: 16px; font-size: 1rem; }
                .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-color); }
                .info-row .label { color: var(--text-muted); }
                .info-row .value { font-weight: 500; }
                
                .salary-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
                .salary-box { background: var(--bg-tertiary); padding: 16px; border-radius: 8px; text-align: center; }
                .salary-box .label { display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 4px; }
                .salary-box .value { font-size: 1.2rem; font-weight: 600; color: var(--primary); }
                
                .salary-breakdown { background: var(--bg-tertiary); border-radius: 8px; padding: 16px; margin-bottom: 24px; }
                .component-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border-color); }
                .component-row:last-child { border-bottom: none; }
                .component-row.total { font-weight: 600; border-top: 2px solid var(--border-color); margin-top: 8px; padding-top: 16px; }
                .deductions .component-row span:last-child { color: var(--error); }
                .deductions .component-row.total span:last-child { color: var(--success); }
                
                .password-form { max-width: 400px; }
                
                @media (max-width: 768px) {
                    .profile-header { grid-template-columns: 1fr; text-align: center; }
                    .profile-photo { margin: 0 auto; }
                    .info-grid { grid-template-columns: 1fr; }
                    .salary-summary { grid-template-columns: repeat(2, 1fr); }
                }
            `}</style>
        </div>
    )
}

export default Profile
