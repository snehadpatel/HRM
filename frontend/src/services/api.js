import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/api'

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                const refreshToken = localStorage.getItem('refresh_token')
                if (refreshToken) {
                    const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
                        refresh: refreshToken,
                    })

                    const { access } = response.data
                    localStorage.setItem('access_token', access)

                    originalRequest.headers.Authorization = `Bearer ${access}`
                    return api(originalRequest)
                }
            } catch (refreshError) {
                localStorage.removeItem('access_token')
                localStorage.removeItem('refresh_token')
                window.location.href = '/login'
            }
        }

        return Promise.reject(error)
    }
)

export default api

// API helper functions
export const authAPI = {
    login: (data) => api.post('/auth/login/', data),
    register: (data) => api.post('/auth/register/', data),
    logout: (data) => api.post('/auth/logout/', data),
    getProfile: () => api.get('/auth/profile/'),
    changePassword: (data) => api.post('/auth/change-password/', data),
}

export const employeesAPI = {
    getAll: (params) => api.get('/employees/', { params }),
    getById: (id) => api.get(`/employees/${id}/`),
    getMe: () => api.get('/employees/me/'),
    create: (data) => api.post('/employees/', data),
    update: (id, data) => api.patch(`/employees/${id}/`, data),
    delete: (id) => api.delete(`/employees/${id}/`),
}

export const attendanceAPI = {
    checkIn: (data) => api.post('/attendance/check-in/', data),
    checkOut: (data) => api.post('/attendance/check-out/', data),
    getToday: () => api.get('/attendance/today/'),
    getWeekly: () => api.get('/attendance/weekly/'),
    getAll: (params) => api.get('/attendance/', { params }),
    getSummary: (params) => api.get('/attendance/summary/', { params }),
}

export const leavesAPI = {
    getTypes: () => api.get('/leaves/types/'),
    getBalance: (params) => api.get('/leaves/balance/', { params }),
    getRequests: (params) => api.get('/leaves/requests/', { params }),
    create: (data) => api.post('/leaves/requests/', data),
    approve: (id, data) => api.post(`/leaves/requests/${id}/approve/`, data),
    reject: (id, data) => api.post(`/leaves/requests/${id}/reject/`, data),
    cancel: (id) => api.post(`/leaves/requests/${id}/cancel/`),
    getPending: () => api.get('/leaves/pending/'),
}

export const payrollAPI = {
    getSalaries: (params) => api.get('/payroll/salaries/', { params }),
    getMySalary: () => api.get('/payroll/salaries/my_salary/'),
    createSalary: (data) => api.post('/payroll/salaries/', data),
    getPayslips: (params) => api.get('/payroll/payslips/', { params }),
    getMyPayslips: () => api.get('/payroll/payslips/my_payslips/'),
    generatePayslips: (data) => api.post('/payroll/generate/', data),
    markPaid: (id) => api.post(`/payroll/payslips/${id}/mark_paid/`),
}
