// Global state variables
let currentUser = null;
let db = {};

// Constants
const STORAGE_KEY = 'ipt_demo_v1';

// Initialize the application
function initApp() {
    // Load data from storage
    loadFromStorage();
    
    // Set up event listeners
    setupEventListeners();
    
    // Set up routing
    setupRouting();
    
    // Initialize UI
    updateAuthUI();
}

// Load data from localStorage
function loadFromStorage() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        
        if (data) {
            db = JSON.parse(data);
        } else {
            // Seed initial data
            seedInitialData();
        }
        
        // Check for auth token
        const authToken = localStorage.getItem('auth_token');
        if (authToken) {
            const user = db.accounts.find(acc => acc.email === authToken);
            if (user) {
                setAuthState(true, user);
            }
        }
    } catch (error) {
        console.error('Error loading from storage:', error);
        seedInitialData();
    }
}

// Seed initial data
function seedInitialData() {
    db = {
        accounts: [
            {
                id: 1,
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@example.com',
                password: 'Password123!',
                role: 'admin',
                verified: true
            }
        ],
        departments: [
            {
                id: 1,
                name: 'Engineering',
                description: 'Software development and engineering team'
            },
            {
                id: 2,
                name: 'HR',
                description: 'Human Resources department'
            }
        ],
        employees: [],
        requests: []
    };
    
    saveToStorage();
}

// Save data to localStorage
function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

// Set up event listeners
function setupEventListeners() {
    // Registration form
    document.getElementById('registerForm')?.addEventListener('submit', handleRegistration);
    
    // Login form
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    
    // Email verification
    document.getElementById('simulateVerification')?.addEventListener('click', handleEmailVerification);
    
    // Logout
    document.getElementById('logoutLink')?.addEventListener('click', handleLogout);
}

// Handle registration
function handleRegistration(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Check if email already exists
    const existingAccount = db.accounts.find(acc => acc.email === email);
    
    if (existingAccount) {
        alert('Email already registered. Please use a different email.');
        return;
    }
    
    // Create new account
    const newAccount = {
        id: db.accounts.length + 1,
        firstName,
        lastName,
        email,
        password,
        role: 'user',
        verified: false
    };
    
    db.accounts.push(newAccount);
    saveToStorage();
    
    // Store unverified email
    localStorage.setItem('unverified_email', email);
    
    // Navigate to verification page
    navigateTo('#/verify-email');
    
    // Update verification message
    document.getElementById('verificationEmail').textContent = email;
}

// Handle email verification
function handleEmailVerification() {
    const email = localStorage.getItem('unverified_email');
    
    if (!email) {
        alert('No unverified email found.');
        return;
    }
    
    // Find and verify the account
    const account = db.accounts.find(acc => acc.email === email);
    
    if (account) {
        account.verified = true;
        saveToStorage();
        localStorage.removeItem('unverified_email');
        
        alert('Email verified successfully! You can now login.');
        navigateTo('#/login');
    } else {
        alert('Account not found.');
    }
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorElement = document.getElementById('loginError');
    
    // Find account
    const account = db.accounts.find(acc => 
        acc.email === email && 
        acc.password === password && 
        acc.verified === true
    );
    
    if (account) {
        // Save auth token
        localStorage.setItem('auth_token', email);
        
        // Set auth state
        setAuthState(true, account);
        
        // Navigate to profile
        navigateTo('#/profile');
    } else {
        errorElement.textContent = 'Invalid email, password, or account not verified.';
        errorElement.style.display = 'block';
    }
}

// Handle logout
function handleLogout(e) {
    e.preventDefault();
    
    localStorage.removeItem('auth_token');
    setAuthState(false);
    navigateTo('#/');
}

// Set authentication state
function setAuthState(isAuth, user = null) {
    const body = document.querySelector('body');
    
    if (isAuth) {
        currentUser = user;
        body.classList.remove('not-authenticated');
        body.classList.add('authenticated');
        
        if (user.role === 'admin') {
            body.classList.add('is-admin');
        } else {
            body.classList.remove('is-admin');
        }
        
        // Update user display name
        document.getElementById('userDisplayName').textContent = 
            `${user.firstName} ${user.lastName}`;
    } else {
        currentUser = null;
        body.classList.remove('authenticated', 'is-admin');
        body.classList.add('not-authenticated');
    }
    
    updateAuthUI();
}

// Update UI based on authentication state
function updateAuthUI() {
    // This is handled by CSS rules, but we can add additional logic here if needed
}

// Client-side routing setup
function setupRouting() {
    // Handle initial route
    if (!window.location.hash) {
        window.location.hash = '#/';
    }
    
    // Handle routing on page load
    handleRouting();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleRouting);
}

// Navigate to a specific hash
function navigateTo(hash) {
    window.location.hash = hash;
}

// Handle routing
function handleRouting() {
    const hash = window.location.hash;
    const pageId = hash.replace('#/', '') + '-page';
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show the requested page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Handle protected routes
    handleProtectedRoutes(hash);
    
    // Handle admin routes
    handleAdminRoutes(hash);
    
    // Handle page-specific logic
    handlePageLogic(hash);
}

// Handle protected routes
function handleProtectedRoutes(hash) {
    const protectedRoutes = ['#/profile', '#/requests'];
    const isAuthenticated = document.body.classList.contains('authenticated');
    
    if (protectedRoutes.includes(hash) && !isAuthenticated) {
        navigateTo('#/login');
    }
}

// Handle admin routes
function handleAdminRoutes(hash) {
    const adminRoutes = ['#/employees', '#/accounts', '#/departments'];
    const isAdmin = document.body.classList.contains('is-admin');
    
    if (adminRoutes.includes(hash) && !isAdmin) {
        navigateTo('#/');
    }
}

// Handle page-specific logic
function handlePageLogic(hash) {
    switch (hash) {
        case '#/profile':
            renderProfile();
            break;
        case '#/employees':
            renderEmployees();
            break;
        case '#/accounts':
            renderAccounts();
            break;
        case '#/departments':
            renderDepartments();
            break;
        case '#/requests':
            renderRequests();
            break;
    }
}

// Render profile page
function renderProfile() {
    if (!currentUser) return;
    
    const profileContent = document.getElementById('profileContent');
    
    profileContent.innerHTML = `
        <div class="card">
            <div class="card-body">
                <h5 class="card-title">${currentUser.firstName} ${currentUser.lastName}</h5>
                <p class="card-text">Email: ${currentUser.email}</p>
                <p class="card-text">Role: ${currentUser.role}</p>
                <button class="btn btn-secondary" id="editProfileBtn">Edit Profile</button>
            </div>
        </div>
    `;
    
    // Add edit profile button handler
    document.getElementById('editProfileBtn')?.addEventListener('click', () => {
        alert('Edit profile functionality would be implemented here.');
    });
}

// Render accounts management page
function renderAccounts() {
    const accountsContent = document.getElementById('accountsContent');
    
    if (!currentUser || currentUser.role !== 'admin') {
        accountsContent.innerHTML = '<p>You do not have permission to view this page.</p>';
        return;
    }
    
    let html = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h3>Accounts List</h3>
            <button class="btn btn-primary" id="addAccountBtn">+ Add Account</button>
        </div>
        <table class="table table-hover">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Verified</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="accountsTableBody">
                <!-- Accounts will be populated here -->
            </tbody>
        </table>
    `;
    
    accountsContent.innerHTML = html;
    
    // Populate accounts table
    renderAccountsList();
    
    // Add event listeners
    document.getElementById('addAccountBtn').addEventListener('click', showAddAccountForm);
}

// Render accounts list
function renderAccountsList() {
    const tableBody = document.getElementById('accountsTableBody');
    tableBody.innerHTML = '';
    
    db.accounts.forEach(account => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${account.id}</td>
            <td>${account.firstName} ${account.lastName}</td>
            <td>${account.email}</td>
            <td>${account.role}</td>
            <td>${account.verified ? '✅' : '❌'}</td>
            <td>
                <button class="btn btn-sm btn-warning edit-account" data-id="${account.id}">Edit</button>
                <button class="btn btn-sm btn-danger delete-account" data-id="${account.id}">Delete</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-account').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const accountId = parseInt(e.target.getAttribute('data-id'));
            showEditAccountForm(accountId);
        });
    });
    
    document.querySelectorAll('.delete-account').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const accountId = parseInt(e.target.getAttribute('data-id'));
            deleteAccount(accountId);
        });
    });
}

// Show add account form
function showAddAccountForm() {
    const accountsContent = document.getElementById('accountsContent');
    
    let html = `
        <div class="card mb-4">
            <div class="card-header">
                <h4>Add New Account</h4>
            </div>
            <div class="card-body">
                <form id="addAccountForm">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label for="newFirstName" class="form-label">First Name</label>
                            <input type="text" class="form-control" id="newFirstName" required>
                        </div>
                        <div class="col-md-6">
                            <label for="newLastName" class="form-label">Last Name</label>
                            <input type="text" class="form-control" id="newLastName" required>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label for="newEmail" class="form-label">Email</label>
                        <input type="email" class="form-control" id="newEmail" required>
                    </div>
                    <div class="mb-3">
                        <label for="newPassword" class="form-label">Password (min 6 characters)</label>
                        <input type="password" class="form-control" id="newPassword" minlength="6" required>
                    </div>
                    <div class="mb-3">
                        <label for="newRole" class="form-label">Role</label>
                        <select class="form-select" id="newRole" required>
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div class="mb-3 form-check">
                        <input type="checkbox" class="form-check-input" id="newVerified">
                        <label class="form-check-label" for="newVerified">Verified</label>
                    </div>
                    <div class="d-flex gap-2">
                        <button type="submit" class="btn btn-primary">Save</button>
                        <button type="button" class="btn btn-secondary" id="cancelAddAccount">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    accountsContent.innerHTML = html;
    
    // Add event listeners
    document.getElementById('addAccountForm').addEventListener('submit', saveNewAccount);
    document.getElementById('cancelAddAccount').addEventListener('click', renderAccounts);
}

// Show edit account form
function showEditAccountForm(accountId) {
    const account = window.db.accounts.find(acc => acc.id === accountId);
    if (!account) return;
    
    const accountsContent = document.getElementById('accountsContent');
    
    let html = `
        <div class="card mb-4">
            <div class="card-header">
                <h4>Edit Account</h4>
            </div>
            <div class="card-body">
                <form id="editAccountForm">
                    <input type="hidden" id="editAccountId" value="${account.id}">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label for="editFirstName" class="form-label">First Name</label>
                            <input type="text" class="form-control" id="editFirstName" value="${account.firstName}" required>
                        </div>
                        <div class="col-md-6">
                            <label for="editLastName" class="form-label">Last Name</label>
                            <input type="text" class="form-control" id="editLastName" value="${account.lastName}" required>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label for="editEmail" class="form-label">Email</label>
                        <input type="email" class="form-control" id="editEmail" value="${account.email}" required>
                    </div>
                    <div class="mb-3">
                        <label for="editRole" class="form-label">Role</label>
                        <select class="form-select" id="editRole" required>
                            <option value="user" ${account.role === 'user' ? 'selected' : ''}>User</option>
                            <option value="admin" ${account.role === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                    </div>
                    <div class="mb-3 form-check">
                        <input type="checkbox" class="form-check-input" id="editVerified" ${account.verified ? 'checked' : ''}>
                        <label class="form-check-label" for="editVerified">Verified</label>
                    </div>
                    <div class="d-flex gap-2">
                        <button type="submit" class="btn btn-primary">Update</button>
                        <button type="button" class="btn btn-secondary" id="cancelEditAccount">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    accountsContent.innerHTML = html;
    
    // Add event listeners
    document.getElementById('editAccountForm').addEventListener('submit', saveEditedAccount);
    document.getElementById('cancelEditAccount').addEventListener('click', renderAccounts);
}

// Save new account
function saveNewAccount(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('newFirstName').value;
    const lastName = document.getElementById('newLastName').value;
    const email = document.getElementById('newEmail').value;
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('newRole').value;
    const verified = document.getElementById('newVerified').checked;
    
    // Check if email already exists
    const existingAccount = db.accounts.find(acc => acc.email === email);
    
    if (existingAccount) {
        alert('Email already registered. Please use a different email.');
        return;
    }
    
    // Create new account
    const newAccount = {
        id: db.accounts.length + 1,
        firstName,
        lastName,
        email,
        password,
        role,
        verified
    };
    
    db.accounts.push(newAccount);
    saveToStorage();
    
    alert('Account created successfully!');
    renderAccounts();
}

// Save edited account
function saveEditedAccount(e) {
    e.preventDefault();
    
    const accountId = parseInt(document.getElementById('editAccountId').value);
    const firstName = document.getElementById('editFirstName').value;
    const lastName = document.getElementById('editLastName').value;
    const email = document.getElementById('editEmail').value;
    const role = document.getElementById('editRole').value;
    const verified = document.getElementById('editVerified').checked;
    
    // Find and update account
    const account = db.accounts.find(acc => acc.id === accountId);
    
    if (account) {
        account.firstName = firstName;
        account.lastName = lastName;
        account.email = email;
        account.role = role;
        account.verified = verified;
        
        saveToStorage();
        alert('Account updated successfully!');
        renderAccounts();
    }
}

// Delete account
function deleteAccount(accountId) {
    if (accountId === currentUser.id) {
        alert('You cannot delete your own account!');
        return;
    }
    
    if (confirm('Are you sure you want to delete this account?')) {
        db.accounts = db.accounts.filter(acc => acc.id !== accountId);
        saveToStorage();
        alert('Account deleted successfully!');
        renderAccounts();
    }
}

// Render departments management page
function renderDepartments() {
    const departmentsContent = document.getElementById('departmentsContent');
    
    if (!currentUser || currentUser.role !== 'admin') {
        departmentsContent.innerHTML = '<p>You do not have permission to view this page.</p>';
        return;
    }
    
    let html = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h3>Departments List</h3>
            <button class="btn btn-primary" id="addDepartmentBtn">+ Add Department</button>
        </div>
        <table class="table table-hover">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="departmentsTableBody">
                <!-- Departments will be populated here -->
            </tbody>
        </table>
    `;
    
    departmentsContent.innerHTML = html;
    
    // Populate departments table
    renderDepartmentsList();
    
    // Add event listeners
    document.getElementById('addDepartmentBtn').addEventListener('click', () => {
        alert('Add department functionality would be implemented here.');
    });
}

// Render departments list
function renderDepartmentsList() {
    const tableBody = document.getElementById('departmentsTableBody');
    tableBody.innerHTML = '';
    
    window.db.departments.forEach(department => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${department.id}</td>
            <td>${department.name}</td>
            <td>${department.description}</td>
            <td>
                <button class="btn btn-sm btn-warning">Edit</button>
                <button class="btn btn-sm btn-danger">Delete</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Render employees management page
function renderEmployees() {
    const employeesContent = document.getElementById('employeesContent');
    
    if (!currentUser || currentUser.role !== 'admin') {
        employeesContent.innerHTML = '<p>You do not have permission to view this page.</p>';
        return;
    }
    
    let html = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h3>Employees List</h3>
            <button class="btn btn-primary" id="addEmployeeBtn">+ Add Employee</button>
        </div>
        <table class="table table-hover">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Employee ID</th>
                    <th>User</th>
                    <th>Position</th>
                    <th>Department</th>
                    <th>Hire Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="employeesTableBody">
                <!-- Employees will be populated here -->
            </tbody>
        </table>
    `;
    
    employeesContent.innerHTML = html;
    
    // Populate employees table
    renderEmployeesList();
    
    // Add event listeners
    document.getElementById('addEmployeeBtn').addEventListener('click', showAddEmployeeForm);
}

// Render employees list
function renderEmployeesList() {
    const tableBody = document.getElementById('employeesTableBody');
    tableBody.innerHTML = '';
    
    window.db.employees.forEach(employee => {
        const user = window.db.accounts.find(acc => acc.email === employee.userEmail);
        const department = window.db.departments.find(dept => dept.id === employee.departmentId);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${employee.id}</td>
            <td>${employee.employeeId}</td>
            <td>${user ? `${user.firstName} ${user.lastName}` : 'Unknown'}</td>
            <td>${employee.position}</td>
            <td>${department ? department.name : 'Unknown'}</td>
            <td>${employee.hireDate}</td>
            <td>
                <button class="btn btn-sm btn-warning edit-employee" data-id="${employee.id}">Edit</button>
                <button class="btn btn-sm btn-danger delete-employee" data-id="${employee.id}">Delete</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-employee').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const employeeId = parseInt(e.target.getAttribute('data-id'));
            showEditEmployeeForm(employeeId);
        });
    });
    
    document.querySelectorAll('.delete-employee').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const employeeId = parseInt(e.target.getAttribute('data-id'));
            deleteEmployee(employeeId);
        });
    });
}

// Show add employee form
function showAddEmployeeForm() {
    const employeesContent = document.getElementById('employeesContent');
    
    let html = `
        <div class="card mb-4">
            <div class="card-header">
                <h4>Add New Employee</h4>
            </div>
            <div class="card-body">
                <form id="addEmployeeForm">
                    <div class="mb-3">
                        <label for="employeeId" class="form-label">Employee ID</label>
                        <input type="text" class="form-control" id="employeeId" required>
                    </div>
                    <div class="mb-3">
                        <label for="employeeUserEmail" class="form-label">User Email</label>
                        <select class="form-select" id="employeeUserEmail" required>
                            ${window.db.accounts.map(account => 
                                `<option value="${account.email}">${account.firstName} ${account.lastName} (${account.email})</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="employeePosition" class="form-label">Position</label>
                        <input type="text" class="form-control" id="employeePosition" required>
                    </div>
                    <div class="mb-3">
                        <label for="employeeDepartment" class="form-label">Department</label>
                        <select class="form-select" id="employeeDepartment" required>
                            ${window.db.departments.map(department => 
                                `<option value="${department.id}">${department.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="employeeHireDate" class="form-label">Hire Date</label>
                        <input type="date" class="form-control" id="employeeHireDate" required>
                    </div>
                    <div class="d-flex gap-2">
                        <button type="submit" class="btn btn-primary">Save</button>
                        <button type="button" class="btn btn-secondary" id="cancelAddEmployee">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    employeesContent.innerHTML = html;
    
    // Add event listeners
    document.getElementById('addEmployeeForm').addEventListener('submit', saveNewEmployee);
    document.getElementById('cancelAddEmployee').addEventListener('click', renderEmployees);
}

// Show edit employee form
function showEditEmployeeForm(employeeId) {
    const employee = window.db.employees.find(emp => emp.id === employeeId);
    if (!employee) return;
    
    const employeesContent = document.getElementById('employeesContent');
    
    let html = `
        <div class="card mb-4">
            <div class="card-header">
                <h4>Edit Employee</h4>
            </div>
            <div class="card-body">
                <form id="editEmployeeForm">
                    <input type="hidden" id="editEmployeeId" value="${employee.id}">
                    <div class="mb-3">
                        <label for="editEmployeeIdField" class="form-label">Employee ID</label>
                        <input type="text" class="form-control" id="editEmployeeIdField" value="${employee.employeeId}" required>
                    </div>
                    <div class="mb-3">
                        <label for="editEmployeeUserEmail" class="form-label">User Email</label>
                        <select class="form-select" id="editEmployeeUserEmail" required>
                            ${window.db.accounts.map(account => 
                                `<option value="${account.email}" ${account.email === employee.userEmail ? 'selected' : ''}>${account.firstName} ${account.lastName} (${account.email})</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="editEmployeePosition" class="form-label">Position</label>
                        <input type="text" class="form-control" id="editEmployeePosition" value="${employee.position}" required>
                    </div>
                    <div class="mb-3">
                        <label for="editEmployeeDepartment" class="form-label">Department</label>
                        <select class="form-select" id="editEmployeeDepartment" required>
                            ${window.db.departments.map(department => 
                                `<option value="${department.id}" ${department.id === employee.departmentId ? 'selected' : ''}>${department.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="editEmployeeHireDate" class="form-label">Hire Date</label>
                        <input type="date" class="form-control" id="editEmployeeHireDate" value="${employee.hireDate}" required>
                    </div>
                    <div class="d-flex gap-2">
                        <button type="submit" class="btn btn-primary">Update</button>
                        <button type="button" class="btn btn-secondary" id="cancelEditEmployee">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    employeesContent.innerHTML = html;
    
    // Add event listeners
    document.getElementById('editEmployeeForm').addEventListener('submit', saveEditedEmployee);
    document.getElementById('cancelEditEmployee').addEventListener('click', renderEmployees);
}

// Save new employee
function saveNewEmployee(e) {
    e.preventDefault();
    
    const employeeId = document.getElementById('employeeId').value;
    const userEmail = document.getElementById('employeeUserEmail').value;
    const position = document.getElementById('employeePosition').value;
    const departmentId = parseInt(document.getElementById('employeeDepartment').value);
    const hireDate = document.getElementById('employeeHireDate').value;
    
    // Create new employee
    const newEmployee = {
        id: window.db.employees.length + 1,
        employeeId,
        userEmail,
        position,
        departmentId,
        hireDate
    };
    
    window.db.employees.push(newEmployee);
    saveToStorage();
    
    alert('Employee added successfully!');
    renderEmployees();
}

// Save edited employee
function saveEditedEmployee(e) {
    e.preventDefault();
    
    const employeeId = parseInt(document.getElementById('editEmployeeId').value);
    const employeeIdField = document.getElementById('editEmployeeIdField').value;
    const userEmail = document.getElementById('editEmployeeUserEmail').value;
    const position = document.getElementById('editEmployeePosition').value;
    const departmentId = parseInt(document.getElementById('editEmployeeDepartment').value);
    const hireDate = document.getElementById('editEmployeeHireDate').value;
    
    // Find and update employee
    const employee = window.db.employees.find(emp => emp.id === employeeId);
    
    if (employee) {
        employee.employeeId = employeeIdField;
        employee.userEmail = userEmail;
        employee.position = position;
        employee.departmentId = departmentId;
        employee.hireDate = hireDate;
        
        saveToStorage();
        alert('Employee updated successfully!');
        renderEmployees();
    }
}

// Delete employee
function deleteEmployee(employeeId) {
    if (confirm('Are you sure you want to delete this employee?')) {
        window.db.employees = window.db.employees.filter(emp => emp.id !== employeeId);
        saveToStorage();
        alert('Employee deleted successfully!');
        renderEmployees();
    }
}

// Render requests page
function renderRequests() {
    const requestsContent = document.getElementById('requestsContent');
    
    if (!currentUser) {
        requestsContent.innerHTML = '<p>Please login to view your requests.</p>';
        return;
    }
    
    // Filter requests by current user's email
    const userRequests = window.db.requests.filter(req => req.employeeEmail === currentUser.email);
    
    let html = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h3>My Requests</h3>
            <button class="btn btn-primary" id="addRequestBtn">+ New Request</button>
        </div>
        <table class="table table-hover">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Items</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="requestsTableBody">
                <!-- Requests will be populated here -->
            </tbody>
        </table>
    `;
    
    requestsContent.innerHTML = html;
    
    // Populate requests table
    renderRequestsList(userRequests);
    
    // Add event listeners
    document.getElementById('addRequestBtn').addEventListener('click', showAddRequestForm);
}

// Render requests list
function renderRequestsList(requests) {
    const tableBody = document.getElementById('requestsTableBody');
    tableBody.innerHTML = '';
    
    if (requests.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" class="text-center">No requests found.</td>';
        tableBody.appendChild(row);
        return;
    }
    
    requests.forEach(request => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${request.id}</td>
            <td>${request.type}</td>
            <td>${request.items.map(item => `${item.name} (${item.qty})`).join(', ')}</td>
            <td><span class="badge bg-${getStatusBadgeClass(request.status)}">${request.status}</span></td>
            <td>${request.date}</td>
            <td>
                <button class="btn btn-sm btn-danger delete-request" data-id="${request.id}">Delete</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-request').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const requestId = parseInt(e.target.getAttribute('data-id'));
            deleteRequest(requestId);
        });
    });
}

// Get status badge class
function getStatusBadgeClass(status) {
    switch (status) {
        case 'Pending': return 'warning';
        case 'Approved': return 'success';
        case 'Rejected': return 'danger';
        default: return 'secondary';
    }
}

// Show add request form
function showAddRequestForm() {
    const requestsContent = document.getElementById('requestsContent');
    
    let html = `
        <div class="card mb-4">
            <div class="card-header">
                <h4>New Request</h4>
            </div>
            <div class="card-body">
                <form id="addRequestForm">
                    <div class="mb-3">
                        <label for="requestType" class="form-label">Request Type</label>
                        <select class="form-select" id="requestType" required>
                            <option value="Equipment">Equipment</option>
                            <option value="Leave">Leave</option>
                            <option value="Resources">Resources</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Items</label>
                        <div id="requestItemsContainer">
                            <div class="request-item mb-2">
                                <div class="row g-2">
                                    <div class="col-md-5">
                                        <input type="text" class="form-control" placeholder="Item name" required>
                                    </div>
                                    <div class="col-md-3">
                                        <input type="number" class="form-control" placeholder="Quantity" min="1" value="1" required>
                                    </div>
                                    <div class="col-md-2">
                                        <button type="button" class="btn btn-danger remove-item">×</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button type="button" class="btn btn-secondary btn-sm mt-2" id="addRequestItem">+ Add Item</button>
                    </div>
                    <div class="d-flex gap-2">
                        <button type="submit" class="btn btn-primary">Submit Request</button>
                        <button type="button" class="btn btn-secondary" id="cancelAddRequest">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    requestsContent.innerHTML = html;
    
    // Add event listeners
    document.getElementById('addRequestItem').addEventListener('click', addRequestItem);
    document.getElementById('addRequestForm').addEventListener('submit', saveNewRequest);
    document.getElementById('cancelAddRequest').addEventListener('click', renderRequests);
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.request-item').remove();
        });
    });
}

// Add request item
function addRequestItem() {
    const container = document.getElementById('requestItemsContainer');
    const newItem = document.createElement('div');
    newItem.className = 'request-item mb-2';
    newItem.innerHTML = `
        <div class="row g-2">
            <div class="col-md-5">
                <input type="text" class="form-control" placeholder="Item name" required>
            </div>
            <div class="col-md-3">
                <input type="number" class="form-control" placeholder="Quantity" min="1" value="1" required>
            </div>
            <div class="col-md-2">
                <button type="button" class="btn btn-danger remove-item">×</button>
            </div>
        </div>
    `;
    
    container.appendChild(newItem);
    
    // Add event listener to the new remove button
    newItem.querySelector('.remove-item').addEventListener('click', (e) => {
        e.target.closest('.request-item').remove();
    });
}

// Save new request
function saveNewRequest(e) {
    e.preventDefault();
    
    const requestType = document.getElementById('requestType').value;
    const itemElements = document.querySelectorAll('.request-item');
    
    // Validate at least one item
    if (itemElements.length === 0) {
        alert('Please add at least one item to the request.');
        return;
    }
    
    // Collect items
    const items = [];
    itemElements.forEach(itemElement => {
        const nameInput = itemElement.querySelector('input[type="text"]');
        const qtyInput = itemElement.querySelector('input[type="number"]');
        
        if (nameInput.value.trim() === '') {
            alert('Please fill in all item names.');
            return;
        }
        
        items.push({
            name: nameInput.value.trim(),
            qty: parseInt(qtyInput.value)
        });
    });
    
    // Create new request
    const newRequest = {
        id: window.db.requests.length + 1,
        type: requestType,
        items: items,
        status: 'Pending',
        date: new Date().toISOString().split('T')[0],
        employeeEmail: currentUser.email
    };
    
    window.db.requests.push(newRequest);
    saveToStorage();
    
    alert('Request submitted successfully!');
    renderRequests();
}

// Delete request
function deleteRequest(requestId) {
    if (confirm('Are you sure you want to delete this request?')) {
        window.db.requests = window.db.requests.filter(req => req.id !== requestId);
        saveToStorage();
        alert('Request deleted successfully!');
        renderRequests();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);