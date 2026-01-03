import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { payrollAPI, employeesAPI } from '../services/api'

function Payroll() {
    const { user, isAdminOrHR } = useAuth()
    const [activeTab, setActiveTab] = useState('structures')
    const [salaries, setSalaries] = useState([])
    const [templates, setTemplates] = useState([])
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)

    // Structure Modal State
    const [showSalaryModal, setShowSalaryModal] = useState(false)
    const [editingSalary, setEditingSalary] = useState(null)
    const [salaryForm, setSalaryForm] = useState({
        employee: '',
        template: '',
        monthly_wage: '',
        performance_bonus_percent: 0,
        fixed_allowance: 0,
        effective_from: new Date().toISOString().split('T')[0]
    })

    // Template Modal State
    const [showTemplateModal, setShowTemplateModal] = useState(false)
    const [editingTemplate, setEditingTemplate] = useState(null)
    const [templateForm, setTemplateForm] = useState({
        name: '',
        description: '',
        basic_percent: 50,
        hra_percent: 50,
        lta_percent: 8.33,
        pf_employee_percent: 12,
        pf_employer_percent: 12,
        standard_allowance: 0,
        professional_tax: 200
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const promises = [payrollAPI.getSalaries()]
            if (isAdminOrHR) {
                promises.push(employeesAPI.getAll())
                promises.push(payrollAPI.getTemplates())
            } else {
                promises.push(Promise.resolve({ data: [] })) // Employees placeholder
                promises.push(Promise.resolve({ data: [] })) // Templates placeholder
            }

            const [salariesRes, employeesRes, templatesRes] = await Promise.all(promises)

            setSalaries(salariesRes.data.results || salariesRes.data || [])
            setEmployees(employeesRes.data.results || employeesRes.data || [])
            setTemplates(templatesRes.data.results || templatesRes.data || [])
        } catch (error) {
            console.error('Error loading payroll data:', error)
        } finally {
            setLoading(false)
        }
    }

    // --- Template Handlers ---
    const handleCreateTemplate = () => {
        setEditingTemplate(null)
        setTemplateForm({
            name: '', description: '',
            basic_percent: 50, hra_percent: 50, lta_percent: 8.33,
            pf_employee_percent: 12, pf_employer_percent: 12,
            standard_allowance: 0, professional_tax: 200
        })
        setShowTemplateModal(true)
    }

    const handleEditTemplate = (tmpl) => {
        setEditingTemplate(tmpl)
        setTemplateForm({ ...tmpl })
        setShowTemplateModal(true)
    }

    const submitTemplate = async (e) => {
        e.preventDefault()
        try {
            if (editingTemplate) {
                await payrollAPI.updateTemplate(editingTemplate.id, templateForm)
            } else {
                await payrollAPI.createTemplate(templateForm)
            }
            setShowTemplateModal(false)
            loadData()
            alert('Template saved!')
        } catch (error) {
            alert('Error saving template')
        }
    }

    // --- Salary Structure Handlers ---
    const handleCreateSalary = () => {
        setEditingSalary(null)
        setSalaryForm({
            employee: '',
            template: '',
            monthly_wage: '',
            performance_bonus_percent: 0,
            fixed_allowance: 0,
            effective_from: new Date().toISOString().split('T')[0]
        })
        setShowSalaryModal(true)
    }

    const handleEditSalary = (salary) => {
        setEditingSalary(salary)
        setSalaryForm({
            employee: salary.employee,
            template: salary.template,
            monthly_wage: salary.monthly_wage,
            performance_bonus_percent: salary.performance_bonus_percent,
            fixed_allowance: salary.fixed_allowance,
            effective_from: salary.effective_from || new Date().toISOString().split('T')[0]
        })
        setShowSalaryModal(true)
    }

    const submitSalary = async (e) => {
        e.preventDefault()
        try {
            if (editingSalary) {
                await payrollAPI.updateSalary(editingSalary.id, salaryForm)
            } else {
                await payrollAPI.createSalary(salaryForm)
            }
            setShowSalaryModal(false)
            loadData()
            alert('Salary structure saved!')
        } catch (error) {
            alert('Error saving salary: ' + (error.response?.data?.error || 'Unknown error'))
        }
    }

    // --- Calculation Preview ---
    const calculatePreview = () => {
        const tmplId = salaryForm.template
        const tmpl = templates.find(t => t.id == tmplId)

        const wage = parseFloat(salaryForm.monthly_wage) || 0
        const perfBonusPct = parseFloat(salaryForm.performance_bonus_percent) || 0
        const fixedAllow = parseFloat(salaryForm.fixed_allowance) || 0

        if (!tmpl) return null // Can't calculate without template

        const basic = wage * (tmpl.basic_percent / 100)
        const hra = basic * (tmpl.hra_percent / 100)
        const lta = wage * (tmpl.lta_percent / 100)
        const perfBonus = wage * (perfBonusPct / 100)
        const stdAllow = parseFloat(tmpl.standard_allowance)

        const gross = basic + hra + lta + perfBonus + stdAllow + fixedAllow

        const pfEmp = basic * (tmpl.pf_employee_percent / 100)
        const profTax = parseFloat(tmpl.professional_tax)
        const totalDed = pfEmp + profTax // + other deductions if any

        const net = gross - totalDed

        return { basic, hra, lta, perfBonus, stdAllow, gross, pfEmp, profTax, totalDed, net }
    }

    const preview = calculatePreview()

    if (loading) return <div className="loading"><div className="spinner"></div></div>

    return (
        <div className="payroll-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Payroll Management</h1>
                    <p className="page-subtitle">Manage salaries and templates</p>
                </div>
                <div>
                    {isAdminOrHR && activeTab === 'templates' && (
                        <button className="btn btn-primary" onClick={handleCreateTemplate}>+ Add Template</button>
                    )}
                    {isAdminOrHR && activeTab === 'structures' && (
                        <button className="btn btn-primary" onClick={handleCreateSalary}>+ Add Salary</button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'structures' ? 'active' : ''}`}
                    onClick={() => setActiveTab('structures')}
                >
                    Salary Structures
                </button>
                {isAdminOrHR && (
                    <button
                        className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
                        onClick={() => setActiveTab('templates')}
                    >
                        Salary Templates
                    </button>
                )}
            </div>

            {/* Structures Tab */}
            {activeTab === 'structures' && (
                <div className="card">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Template</th>
                                    <th>Wage</th>
                                    <th>Bonus %</th>
                                    <th>Net Salary</th>
                                    {isAdminOrHR && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {salaries.map(sal => (
                                    <tr key={sal.id}>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{sal.employee_name}</div>
                                            <div className="text-muted text-sm">{sal.employee_id}</div>
                                        </td>
                                        <td><span className="badge badge-info">{sal.template_name || '-'}</span></td>
                                        <td>₹{parseFloat(sal.monthly_wage).toLocaleString()}</td>
                                        <td>{sal.performance_bonus_percent}%</td>
                                        <td className="text-success" style={{ fontWeight: 600 }}>
                                            ₹{parseFloat(sal.net_salary).toLocaleString()}
                                        </td>
                                        {isAdminOrHR && (
                                            <td>
                                                <button className="btn btn-sm btn-secondary" onClick={() => handleEditSalary(sal)}>
                                                    Edit
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {salaries.length === 0 && (
                                    <tr><td colSpan="6" className="text-center">No salary structures found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Templates Tab */}
            {activeTab === 'templates' && (
                <div className="card">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Basic %</th>
                                    <th>HRA %</th>
                                    <th>PF %</th>
                                    <th>Allowances</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {templates.map(tmpl => (
                                    <tr key={tmpl.id}>
                                        <td style={{ fontWeight: 500 }}>{tmpl.name}</td>
                                        <td>{tmpl.basic_percent}%</td>
                                        <td>{tmpl.hra_percent}%</td>
                                        <td>{tmpl.pf_employee_percent}%</td>
                                        <td>
                                            Std: ₹{tmpl.standard_allowance}<br />
                                            PT: ₹{tmpl.professional_tax}
                                        </td>
                                        <td>
                                            <button className="btn btn-sm btn-secondary" onClick={() => handleEditTemplate(tmpl)}>
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {templates.length === 0 && (
                                    <tr><td colSpan="6" className="text-center">No templates found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Template Modal */}
            {showTemplateModal && (
                <div className="modal-overlay" onClick={() => setShowTemplateModal(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <h2>{editingTemplate ? 'Edit Template' : 'Create Template'}</h2>
                        <form onSubmit={submitTemplate}>
                            <div className="form-group">
                                <label className="form-label">Template Name</label>
                                <input className="form-input" value={templateForm.name} onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })} required />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Basic (% of Wage)</label>
                                    <input type="number" step="0.01" className="form-input" value={templateForm.basic_percent} onChange={e => setTemplateForm({ ...templateForm, basic_percent: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">HRA (% of Basic)</label>
                                    <input type="number" step="0.01" className="form-input" value={templateForm.hra_percent} onChange={e => setTemplateForm({ ...templateForm, hra_percent: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">LTA (% of Wage)</label>
                                    <input type="number" step="0.01" className="form-input" value={templateForm.lta_percent} onChange={e => setTemplateForm({ ...templateForm, lta_percent: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">PF Employee (%)</label>
                                    <input type="number" step="0.01" className="form-input" value={templateForm.pf_employee_percent} onChange={e => setTemplateForm({ ...templateForm, pf_employee_percent: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Standard Allowance (₹)</label>
                                    <input type="number" className="form-input" value={templateForm.standard_allowance} onChange={e => setTemplateForm({ ...templateForm, standard_allowance: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Professional Tax (₹)</label>
                                    <input type="number" className="form-input" value={templateForm.professional_tax} onChange={e => setTemplateForm({ ...templateForm, professional_tax: e.target.value })} />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowTemplateModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Template</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Salary Modal */}
            {showSalaryModal && (
                <div className="modal-overlay" onClick={() => setShowSalaryModal(false)}>
                    <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
                        <h2>{editingSalary ? 'Edit Salary' : 'Define Salary Structure'}</h2>
                        <form onSubmit={submitSalary}>
                            <div className="salary-form-grid">
                                <div className="form-section">
                                    {!editingSalary && (
                                        <div className="form-group">
                                            <label className="form-label">Employee</label>
                                            <select className="form-select" value={salaryForm.employee} onChange={e => setSalaryForm({ ...salaryForm, employee: e.target.value })} required>
                                                <option value="">Select Employee</option>
                                                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.full_name}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    <div className="form-group">
                                        <label className="form-label">Salary Template (Position)</label>
                                        <select className="form-select" value={salaryForm.template} onChange={e => setSalaryForm({ ...salaryForm, template: e.target.value })} required>
                                            <option value="">Select Template</option>
                                            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Monthly Wage (₹)</label>
                                        <input type="number" className="form-input" value={salaryForm.monthly_wage} onChange={e => setSalaryForm({ ...salaryForm, monthly_wage: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Performance Bonus (% of Wage)</label>
                                        <input type="number" step="0.1" className="form-input" value={salaryForm.performance_bonus_percent} onChange={e => setSalaryForm({ ...salaryForm, performance_bonus_percent: e.target.value })} />
                                        <small className="text-muted">Unique per person</small>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Fixed Allowance (₹)</label>
                                        <input type="number" className="form-input" value={salaryForm.fixed_allowance} onChange={e => setSalaryForm({ ...salaryForm, fixed_allowance: e.target.value })} />
                                        <small className="text-muted">Unique per person</small>
                                    </div>
                                </div>
                                <div className="preview-section">
                                    <h3>Salary Breakdown</h3>
                                    {preview ? (
                                        <div className="preview-card">
                                            <div className="preview-row"><span>Basic</span><span>₹{preview.basic.toLocaleString()}</span></div>
                                            <div className="preview-row"><span>HRA</span><span>₹{preview.hra.toLocaleString()}</span></div>
                                            <div className="preview-row"><span>Bonus</span><span>₹{preview.perfBonus.toLocaleString()}</span></div>
                                            <div className="preview-row"><span>LTA</span><span>₹{preview.lta.toLocaleString()}</span></div>
                                            <div className="preview-divider" />
                                            <div className="preview-row preview-total"><span>Gross</span><span>₹{preview.gross.toLocaleString()}</span></div>
                                            <div className="preview-row text-danger"><span>Deductions</span><span>-₹{preview.totalDed.toLocaleString()}</span></div>
                                            <div className="preview-divider" />
                                            <div className="preview-row preview-total text-success"><span>Net Pay</span><span>₹{preview.net.toLocaleString()}</span></div>
                                        </div>
                                    ) : (
                                        <div className="text-center text-muted p-4">Select a template and wage to see breakdown</div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowSalaryModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Structure</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .tabs { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); }
                .tab { padding: 10px 20px; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; color: var(--text-secondary); }
                .tab.active { border-bottom-color: var(--primary); color: var(--primary); font-weight: 500; }
                
                .salary-form-grid { display: grid; grid-template-columns: 1fr 300px; gap: 24px; }
                .preview-card { background: var(--bg-tertiary); padding: 16px; border-radius: 8px; }
                .preview-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 0.9em; }
                .preview-divider { height: 1px; background: var(--border-color); margin: 8px 0; }
                .preview-total { font-weight: 600; }
                .text-sm { font-size: 0.8rem; }
                
                .modal-xl { max-width: 900px; }
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

export default Payroll
