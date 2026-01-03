import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { payrollAPI } from '../services/api'

function Payroll() {
    const { isAdminOrHR } = useAuth()
    const [salary, setSalary] = useState(null)
    const [payslips, setPayslips] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadPayrollData()
    }, [])

    const loadPayrollData = async () => {
        try {
            if (isAdminOrHR) {
                const [salariesRes, payslipsRes] = await Promise.all([
                    payrollAPI.getSalaries(),
                    payrollAPI.getPayslips()
                ])
                setSalary(salariesRes.data.results || salariesRes.data)
                setPayslips(payslipsRes.data.results || payslipsRes.data)
            } else {
                const [salaryRes, payslipsRes] = await Promise.all([
                    payrollAPI.getMySalary(),
                    payrollAPI.getMyPayslips()
                ])
                setSalary(salaryRes.data)
                setPayslips(payslipsRes.data.results || payslipsRes.data)
            }
        } catch (error) {
            console.error('Error loading payroll:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount)
    }

    if (loading) {
        return <div className="loading"><div className="spinner"></div></div>
    }

    // For employee view
    const singleSalary = !Array.isArray(salary) ? salary : null
    const salaryList = Array.isArray(salary) ? salary : []

    return (
        <div className="payroll-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Payroll</h1>
                    <p className="page-subtitle">View salary details and payslips</p>
                </div>
            </div>

            {/* Employee Salary View */}
            {singleSalary && (
                <div className="salary-card card mb-lg">
                    <h3 className="card-title mb-lg">Your Salary Structure</h3>
                    <div className="salary-grid">
                        <div className="salary-section">
                            <h4>Earnings</h4>
                            <div className="salary-items">
                                <div className="salary-item">
                                    <span>Basic Salary</span>
                                    <span className="amount">{formatCurrency(singleSalary.basic_salary)}</span>
                                </div>
                                <div className="salary-item">
                                    <span>HRA</span>
                                    <span className="amount">{formatCurrency(singleSalary.hra)}</span>
                                </div>
                                <div className="salary-item">
                                    <span>Transport Allowance</span>
                                    <span className="amount">{formatCurrency(singleSalary.transport_allowance)}</span>
                                </div>
                                <div className="salary-item">
                                    <span>Medical Allowance</span>
                                    <span className="amount">{formatCurrency(singleSalary.medical_allowance)}</span>
                                </div>
                                <div className="salary-item total">
                                    <span>Gross Salary</span>
                                    <span className="amount">{formatCurrency(singleSalary.gross_salary)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="salary-section">
                            <h4>Deductions</h4>
                            <div className="salary-items">
                                <div className="salary-item">
                                    <span>Provident Fund</span>
                                    <span className="amount text-error">-{formatCurrency(singleSalary.pf_deduction)}</span>
                                </div>
                                <div className="salary-item">
                                    <span>Tax Deduction</span>
                                    <span className="amount text-error">-{formatCurrency(singleSalary.tax_deduction)}</span>
                                </div>
                                <div className="salary-item">
                                    <span>Other Deductions</span>
                                    <span className="amount text-error">-{formatCurrency(singleSalary.other_deductions)}</span>
                                </div>
                                <div className="salary-item total">
                                    <span>Total Deductions</span>
                                    <span className="amount text-error">-{formatCurrency(singleSalary.total_deductions)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="net-salary">
                        <span>Net Salary (Monthly)</span>
                        <span className="amount">{formatCurrency(singleSalary.net_salary)}</span>
                    </div>
                </div>
            )}

            {/* Admin View - All Salaries */}
            {isAdminOrHR && salaryList.length > 0 && (
                <div className="card mb-lg">
                    <h3 className="card-title mb-md">All Salary Structures</h3>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Basic</th>
                                    <th>Gross</th>
                                    <th>Deductions</th>
                                    <th>Net</th>
                                    <th>Effective From</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salaryList.map((sal) => (
                                    <tr key={sal.id}>
                                        <td>{sal.employee_name}</td>
                                        <td>{formatCurrency(sal.basic_salary)}</td>
                                        <td>{formatCurrency(sal.gross_salary)}</td>
                                        <td className="text-error">{formatCurrency(sal.total_deductions)}</td>
                                        <td className="text-success">{formatCurrency(sal.net_salary)}</td>
                                        <td>{sal.effective_from}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Payslips */}
            <div className="card">
                <h3 className="card-title mb-md">Payslips</h3>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                {isAdminOrHR && <th>Employee</th>}
                                <th>Period</th>
                                <th>Working Days</th>
                                <th>Days Worked</th>
                                <th>Gross</th>
                                <th>Deductions</th>
                                <th>Net Salary</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payslips.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdminOrHR ? 8 : 7} className="text-center text-muted">
                                        No payslips available
                                    </td>
                                </tr>
                            ) : (
                                payslips.map((slip) => (
                                    <tr key={slip.id}>
                                        {isAdminOrHR && <td>{slip.employee_name}</td>}
                                        <td>{slip.pay_period_start} - {slip.pay_period_end}</td>
                                        <td>{slip.working_days}</td>
                                        <td>{slip.days_worked}</td>
                                        <td>{formatCurrency(slip.gross_salary)}</td>
                                        <td className="text-error">{formatCurrency(slip.total_deductions)}</td>
                                        <td className="text-success">{formatCurrency(slip.net_salary)}</td>
                                        <td>
                                            <span className={`badge ${slip.status === 'paid' ? 'badge-success' : slip.status === 'processed' ? 'badge-info' : 'badge-warning'}`}>
                                                {slip.status}
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
        .salary-card {
          background: linear-gradient(135deg, var(--bg-card), var(--bg-tertiary));
        }
        
        .salary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-xl);
        }
        
        .salary-section h4 {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-bottom: var(--spacing-md);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .salary-items {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }
        
        .salary-item {
          display: flex;
          justify-content: space-between;
          padding: var(--spacing-sm) 0;
          border-bottom: 1px solid var(--border-color);
        }
        
        .salary-item.total {
          border-bottom: none;
          border-top: 2px solid var(--border-light);
          padding-top: var(--spacing-md);
          font-weight: 600;
        }
        
        .amount {
          font-weight: 500;
          font-family: 'JetBrains Mono', monospace;
        }
        
        .net-salary {
          display: flex;
          justify-content: space-between;
          margin-top: var(--spacing-xl);
          padding: var(--spacing-lg);
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(14, 165, 233, 0.1));
          border-radius: var(--radius-lg);
          font-size: 1.25rem;
          font-weight: 600;
        }
        
        .net-salary .amount {
          color: var(--success);
          font-size: 1.5rem;
        }
        
        @media (max-width: 768px) {
          .salary-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    )
}

export default Payroll
