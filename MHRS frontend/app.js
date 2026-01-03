// ===========================
// DUMMY DATA
// ===========================

const currentUser = {
    id: 'EMP001',
    name: 'Sarah Johnson',
    role: 'HR Manager',
    department: 'Human Resources',
    email: 'sarah.johnson@dayflow.com',
    phone: '+1 (555) 123-4567',
    joinDate: '2020-03-15',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AdminUser&backgroundColor=4F46E5'
};

const employees = [
    {
        id: 'EMP001',
        name: 'Sarah Johnson',
        role: 'HR Manager',
        department: 'Human Resources',
        email: 'sarah.johnson@dayflow.com',
        phone: '+1 (555) 123-4567',
        joinDate: '2020-03-15',
        status: 'present',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AdminUser&backgroundColor=4F46E5'
    },
    {
        id: 'EMP002',
        name: 'Michael Chen',
        role: 'Senior Developer',
        department: 'Engineering',
        email: 'michael.chen@dayflow.com',
        phone: '+1 (555) 234-5678',
        joinDate: '2019-07-20',
        status: 'present',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael&backgroundColor=10B981'
    },
    {
        id: 'EMP003',
        name: 'Emily Rodriguez',
        role: 'Product Manager',
        department: 'Product',
        email: 'emily.rodriguez@dayflow.com',
        phone: '+1 (555) 345-6789',
        joinDate: '2021-01-10',
        status: 'on-leave',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily&backgroundColor=F59E0B'
    },
    {
        id: 'EMP004',
        name: 'James Wilson',
        role: 'UX Designer',
        department: 'Design',
        email: 'james.wilson@dayflow.com',
        phone: '+1 (555) 456-7890',
        joinDate: '2020-09-05',
        status: 'present',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James&backgroundColor=8B5CF6'
    },
    {
        id: 'EMP005',
        name: 'Sophia Martinez',
        role: 'Marketing Lead',
        department: 'Marketing',
        email: 'sophia.martinez@dayflow.com',
        phone: '+1 (555) 567-8901',
        joinDate: '2021-05-12',
        status: 'absent',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia&backgroundColor=EF4444'
    },
    {
        id: 'EMP006',
        name: 'David Kim',
        role: 'DevOps Engineer',
        department: 'Engineering',
        email: 'david.kim@dayflow.com',
        phone: '+1 (555) 678-9012',
        joinDate: '2020-11-08',
        status: 'present',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David&backgroundColor=06B6D4'
    },
    {
        id: 'EMP007',
        name: 'Olivia Thompson',
        role: 'Sales Manager',
        department: 'Sales',
        email: 'olivia.thompson@dayflow.com',
        phone: '+1 (555) 789-0123',
        joinDate: '2019-04-22',
        status: 'on-leave',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivia&backgroundColor=EC4899'
    },
    {
        id: 'EMP008',
        name: 'Daniel Brown',
        role: 'Full Stack Developer',
        department: 'Engineering',
        email: 'daniel.brown@dayflow.com',
        phone: '+1 (555) 890-1234',
        joinDate: '2021-08-30',
        status: 'present',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Daniel&backgroundColor=14B8A6'
    },
    {
        id: 'EMP009',
        name: 'Ava Garcia',
        role: 'Customer Success',
        department: 'Support',
        email: 'ava.garcia@dayflow.com',
        phone: '+1 (555) 901-2345',
        joinDate: '2022-02-14',
        status: 'present',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ava&backgroundColor=F59E0B'
    },
    {
        id: 'EMP010',
        name: 'Liam Anderson',
        role: 'Data Analyst',
        department: 'Analytics',
        email: 'liam.anderson@dayflow.com',
        phone: '+1 (555) 012-3456',
        joinDate: '2020-06-18',
        status: 'absent',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Liam&backgroundColor=6366F1'
    },
    {
        id: 'EMP011',
        name: 'Isabella Lee',
        role: 'Content Strategist',
        department: 'Marketing',
        email: 'isabella.lee@dayflow.com',
        phone: '+1 (555) 123-4567',
        joinDate: '2021-10-25',
        status: 'present',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Isabella&backgroundColor=A855F7'
    },
    {
        id: 'EMP012',
        name: 'Noah Taylor',
        role: 'QA Engineer',
        department: 'Engineering',
        email: 'noah.taylor@dayflow.com',
        phone: '+1 (555) 234-5678',
        joinDate: '2022-01-03',
        status: 'present',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Noah&backgroundColor=10B981'
    }
];

// ===========================
// STATE MANAGEMENT
// ===========================

let attendanceState = {
    isCheckedIn: false,
    checkInTime: null,
    durationInterval: null
};

// Load attendance state from localStorage
function loadAttendanceState() {
    const saved = localStorage.getItem('dayflow_attendance');
    if (saved) {
        const data = JSON.parse(saved);
        // Check if it's from today
        const today = new Date().toDateString();
        if (data.date === today && data.isCheckedIn) {
            attendanceState = {
                isCheckedIn: true,
                checkInTime: new Date(data.checkInTime),
                durationInterval: null
            };
            updateAttendanceUI();
            startDurationCounter();
        }
    }
}

// Save attendance state to localStorage
function saveAttendanceState() {
    const data = {
        date: new Date().toDateString(),
        isCheckedIn: attendanceState.isCheckedIn,
        checkInTime: attendanceState.checkInTime ? attendanceState.checkInTime.toISOString() : null
    };
    localStorage.setItem('dayflow_attendance', JSON.stringify(data));
}

// ===========================
// INITIALIZATION
// ===========================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Set current date
    updateCurrentDate();
    
    // Load attendance state
    loadAttendanceState();
    
    // Render employees
    renderEmployees(employees);
    
    // Setup event listeners
    setupEventListeners();
}

// ===========================
// DATE & TIME FUNCTIONS
// ===========================

function updateCurrentDate() {
    const dateElement = document.getElementById('currentDate');
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = now.toLocaleDateString('en-US', options);
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
}

function getTimeDuration(startTime) {
    const now = new Date();
    const diff = now - startTime;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// ===========================
// EVENT LISTENERS
// ===========================

function setupEventListeners() {
    // Navigation tabs
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => handleTabClick(tab));
    });
    
    // Profile dropdown
    const userAvatar = document.getElementById('userAvatar');
    const profileDropdown = document.getElementById('profileDropdown');
    userAvatar.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('show');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        profileDropdown.classList.remove('show');
    });
    
    // My Profile button
    document.getElementById('myProfileBtn').addEventListener('click', () => {
        showEmployeeDetails(currentUser);
        profileDropdown.classList.remove('show');
    });
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
    
    // Attendance buttons
    document.getElementById('checkInBtn').addEventListener('click', handleCheckIn);
    document.getElementById('checkOutBtn').addEventListener('click', handleCheckOut);
    
    // Modal close
    document.getElementById('closeModal').addEventListener('click', closeEmployeeModal);
    document.getElementById('employeeModal').addEventListener('click', (e) => {
        if (e.target.id === 'employeeModal') {
            closeEmployeeModal();
        }
    });
}

// ===========================
// NAVIGATION
// ===========================

function handleTabClick(tab) {
    // Update active tab
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // Show corresponding view
    const targetView = tab.dataset.tab;
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${targetView}View`).classList.add('active');
}

// ===========================
// SEARCH FUNCTIONALITY
// ===========================

function handleSearch(query) {
    const searchTerm = query.toLowerCase().trim();
    
    if (searchTerm === '') {
        renderEmployees(employees);
        return;
    }
    
    const filtered = employees.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm) || 
        emp.id.toLowerCase().includes(searchTerm) ||
        emp.role.toLowerCase().includes(searchTerm)
    );
    
    renderEmployees(filtered);
}

// ===========================
// EMPLOYEE RENDERING
// ===========================

function renderEmployees(employeeList) {
    const grid = document.getElementById('employeesGrid');
    
    if (employeeList.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--color-text-secondary);">
                <p>No employees found</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = employeeList.map(emp => createEmployeeCard(emp)).join('');
    
    // Add click listeners to cards
    const cards = grid.querySelectorAll('.employee-card');
    cards.forEach((card, index) => {
        card.addEventListener('click', () => showEmployeeDetails(employeeList[index]));
    });
}

function createEmployeeCard(employee) {
    const statusClass = employee.status === 'present' ? 'status-present' :
                       employee.status === 'on-leave' ? 'status-on-leave' :
                       'status-absent';
    
    return `
        <div class="employee-card">
            <div class="status-indicator-dot ${statusClass}"></div>
            <div class="employee-card-header">
                <div class="employee-avatar">
                    <img src="${employee.avatar}" alt="${employee.name}">
                </div>
                <div class="employee-info">
                    <h3 class="employee-name">${employee.name}</h3>
                    <p class="employee-role">${employee.role}</p>
                    <p class="employee-id">${employee.id}</p>
                </div>
            </div>
        </div>
    `;
}

// ===========================
// EMPLOYEE MODAL
// ===========================

function showEmployeeDetails(employee) {
    const modal = document.getElementById('employeeModal');
    const detailsContainer = document.getElementById('employeeDetails');
    
    const statusClass = employee.status === 'present' ? 'status-present' :
                       employee.status === 'on-leave' ? 'status-on-leave' :
                       'status-absent';
    
    const statusText = employee.status === 'present' ? 'Present in Office' :
                      employee.status === 'on-leave' ? 'On Approved Leave' :
                      'Absent';
    
    detailsContainer.innerHTML = `
        <div class="employee-detail-header">
            <div class="employee-detail-avatar">
                <img src="${employee.avatar}" alt="${employee.name}">
            </div>
            <div class="employee-detail-info">
                <h3>${employee.name}</h3>
                <p class="employee-detail-role">${employee.role} - ${employee.department}</p>
                <span class="employee-detail-status ${statusClass}">
                    <span class="employee-detail-status-dot"></span>
                    ${statusText}
                </span>
            </div>
        </div>
        
        <div class="employee-detail-fields">
            <div class="detail-field">
                <span class="detail-label">Employee ID</span>
                <span class="detail-value">${employee.id}</span>
            </div>
            <div class="detail-field">
                <span class="detail-label">Email</span>
                <span class="detail-value">${employee.email}</span>
            </div>
            <div class="detail-field">
                <span class="detail-label">Phone</span>
                <span class="detail-value">${employee.phone}</span>
            </div>
            <div class="detail-field">
                <span class="detail-label">Department</span>
                <span class="detail-value">${employee.department}</span>
            </div>
            <div class="detail-field">
                <span class="detail-label">Join Date</span>
                <span class="detail-value">${new Date(employee.joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
        </div>
    `;
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeEmployeeModal() {
    const modal = document.getElementById('employeeModal');
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

// ===========================
// ATTENDANCE FUNCTIONALITY
// ===========================

function handleCheckIn() {
    attendanceState.isCheckedIn = true;
    attendanceState.checkInTime = new Date();
    
    // Update UI
    updateAttendanceUI();
    
    // Start duration counter
    startDurationCounter();
    
    // Update current user's status
    const currentEmp = employees.find(e => e.id === currentUser.id);
    if (currentEmp) {
        currentEmp.status = 'present';
        renderEmployees(employees);
    }
    
    // Save state
    saveAttendanceState();
}

function handleCheckOut() {
    attendanceState.isCheckedIn = false;
    attendanceState.checkInTime = null;
    
    // Stop duration counter
    if (attendanceState.durationInterval) {
        clearInterval(attendanceState.durationInterval);
        attendanceState.durationInterval = null;
    }
    
    // Update UI
    updateAttendanceUI();
    
    // Save state
    saveAttendanceState();
}

function updateAttendanceUI() {
    const checkInBtn = document.getElementById('checkInBtn');
    const checkinInfo = document.getElementById('checkinInfo');
    const statusDot = document.getElementById('myStatusDot');
    const statusText = document.getElementById('statusText');
    
    if (attendanceState.isCheckedIn) {
        checkInBtn.style.display = 'none';
        checkinInfo.style.display = 'block';
        statusDot.classList.add('active');
        statusText.textContent = 'Checked In';
        
        // Update time display
        const timeEl = document.getElementById('checkinTime');
        timeEl.textContent = formatTime(attendanceState.checkInTime);
    } else {
        checkInBtn.style.display = 'flex';
        checkinInfo.style.display = 'none';
        statusDot.classList.remove('active');
        statusText.textContent = 'Not Checked In';
    }
}

function startDurationCounter() {
    // Update immediately
    updateDuration();
    
    // Update every second
    attendanceState.durationInterval = setInterval(updateDuration, 1000);
}

function updateDuration() {
    if (attendanceState.isCheckedIn && attendanceState.checkInTime) {
        const durationEl = document.getElementById('workDuration');
        durationEl.textContent = getTimeDuration(attendanceState.checkInTime);
    }
}

// ===========================
// LOGOUT
// ===========================

function handleLogout() {
    // Clear attendance state
    localStorage.removeItem('dayflow_attendance');
    
    // Show logout message
    alert('You have been logged out successfully!');
    
    // In a real app, redirect to login page
    // For demo purposes, reload the page
    location.reload();
}
