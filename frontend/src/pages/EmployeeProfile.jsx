import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { employeesAPI } from '../services/api'
import EmployeeDetailModal from '../components/EmployeeDetailModal'

function EmployeeProfile() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [employee, setEmployee] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const departments = [
        { value: 'engineering', label: 'Engineering' },
        { value: 'hr', label: 'Human Resources' },
        { value: 'finance', label: 'Finance' },
        { value: 'sales', label: 'Sales' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'operations', label: 'Operations' },
        { value: 'support', label: 'Customer Support' },
    ]

    useEffect(() => {
        loadEmployee()
    }, [id])

    const loadEmployee = async () => {
        try {
            const response = await employeesAPI.getById(id)
            setEmployee(response.data)
        } catch (err) {
            console.error('Error loading employee:', err)
            setError('Employee not found')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        navigate(-1) // Go back
    }

    if (loading) return <div className="loading"><div className="spinner"></div></div>

    if (error) return (
        <div className="p-8 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">{error}</h2>
            <button className="btn btn-primary" onClick={handleClose}>Go Back</button>
        </div>
    )

    // Reuse the modal content but rendered as a page or force the modal open
    // Since EmployeeDetailModal is designed as a modal with "onClose", let's wrap it
    // But logically, if we are at a dedicated route, maybe we want it to look like a page?
    // For speed/consistency, we'll render the Modal component effectively "fullscreen" or just trigger it.
    // Actually, looking at EmployeeDetailModal, it has a fixed position overlay. 
    // We can just render it.

    return (
        <div className="employee-profile-page" style={{ minHeight: '80vh', position: 'relative' }}>
            {/* 
                We render the modal. The modal has an overlay. 
                Since we are inside the Layout -> Page Content, the fixed overlay might be weird 
                if we don't handle z-index or context correctly, but it should work.
                However, typically a route-based view shouldn't check for "isOpen".
             */}
            <EmployeeDetailModal
                employee={employee}
                departments={departments}
                onClose={handleClose}
            />
        </div>
    )
}

export default EmployeeProfile
