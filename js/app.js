import { DataManager } from './dataManager.js';
import { UIManager } from './uiManager.js';
import { ReceiptManager } from './receiptManager.js';
import { ReportManager } from './reportManager.js';

export class BusinessManagementSystem {
    constructor() {
        this.dataManager = new DataManager();
        this.uiManager = new UIManager();
        this.receiptManager = new ReceiptManager();
        this.reportManager = new ReportManager();
        this.cart = []; // Cart for multi-item purchases
        
        this.isAdmin = sessionStorage.getItem('isAdmin') === 'true'; // Track admin status

        this.currentSection = 'dashboard';
        this.currentBusiness = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSettings();
        this.loadDashboard();
        this.setupMobileMenu();
        this.applyTheme();
        this.setupAdminLogin();
        this.updateAdminUI();
        
        // Add test employee if none exist
        this.initializeTestData();
    }

    initializeTestData() {
        const employees = this.dataManager.getEmployees();
        if (employees.length === 0) {
            // Add a test employee
            const testEmployee = {
                name: 'John Doe',
                contact: '+254700000000',
                grossSalary: 50000,
                deductions: 5000,
                advance: 0,
                payFrequency: 'Monthly',
                payMonth: 'January',
                payDay: 30
            };
            
            this.dataManager.addEmployee(testEmployee);
            console.log('Added test employee:', testEmployee);
        }
    }

    setupAdminLogin() {
        // Admin login form
        document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAdminLogin();
        });

        document.getElementById('closeAdminLogin').addEventListener('click', () => {
            if (!this.isAdmin) {
                this.uiManager.showNotification('Admin login required to continue', 'warning');
            } else {
                this.uiManager.hideModal('adminLoginModal');
            }
        });
    }

    handleAdminLogin() {
        const username = document.getElementById('adminUsername').value.trim();
        const password = document.getElementById('adminPassword').value.trim();

        if (username === 'admin' && password === 'jeff001') {
            this.isAdmin = true;
            sessionStorage.setItem('isAdmin', 'true');
            this.uiManager.hideModal('adminLoginModal');
            this.uiManager.showNotification('Admin login successful!');
            this.updateAdminUI();
        } else {
            this.uiManager.showNotification('Invalid admin credentials', 'error');
        }
    }

    updateAdminUI() {
        // Show/hide admin-only elements
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(element => {
            element.style.display = this.isAdmin ? 'block' : 'none';
        });

        // Disable admin-only buttons
        const adminButtons = document.querySelectorAll('.admin-button');
        adminButtons.forEach(button => {
            if (!this.isAdmin) {
                button.disabled = true;
                button.title = 'Admin access required';
                button.style.opacity = '0.5';
                button.style.cursor = 'not-allowed';
            } else {
                button.disabled = false;
                button.title = '';
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
            }
        });

        // Update settings button
        const settingsBtn = document.getElementById('settingsBtn');
        if (!this.isAdmin) {
            settingsBtn.disabled = true;
            settingsBtn.title = 'Admin access required';
            settingsBtn.style.opacity = '0.5';
        } else {
            settingsBtn.disabled = false;
            settingsBtn.title = 'Settings';
            settingsBtn.style.opacity = '1';
        }
    }

    // Override existing methods to check admin access
    switchSection(section) {
        // Check if section requires admin access
        const adminSections = ['sales', 'reports'];
        if (adminSections.includes(section) && !this.isAdmin) {
            this.uiManager.showNotification('Admin access required for this section', 'warning');
            this.promptAdminLogin(() => {
                if (this.isAdmin) {
                    this.switchSection(section);
                }
            });
            return;
        }

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Update sections
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.remove('active');
        });
        document.getElementById(`${section}-section`).classList.add('active');

        this.currentSection = section;

        // Load section data
        switch(section) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'guesthouse':
                this.loadGuesthouse();
                break;
            case 'butchery':
                this.loadButchery();
                break;
            case 'workshop':
                this.loadWorkshop();
                break;
            case 'customers':
                this.loadCustomers();
                break;
            case 'employees':
                this.loadEmployees();
                break;
            case 'sales':
                this.loadSales();
                break;
            case 'reports':
                this.loadReports();
                break;
        }

        // Close mobile menu
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('active');
        }
    }

    promptAdminLogin(callback) {
        this.uiManager.showNotification('Admin login required', 'warning');
        document.getElementById('adminLoginModal').classList.add('active');
        
        // Store callback for after login
        const checkLogin = setInterval(() => {
            if (this.isAdmin) {
                clearInterval(checkLogin);
                if (callback) callback();
            }
        }, 500);
    }

    // Override settings access
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('.nav-link').dataset.section;
                this.switchSection(section);
            });
        });

        // Settings - admin only
        document.getElementById('settingsBtn').addEventListener('click', () => {
            if (!this.isAdmin) {
                this.promptAdminLogin(() => {
                    if (this.isAdmin) {
                        this.uiManager.showModal('settingsModal');
                    }
                });
            } else {
                this.uiManager.showModal('settingsModal');
            }
        });

        document.getElementById('closeSettings').addEventListener('click', () => {
            this.uiManager.hideModal('settingsModal');
        });

        document.getElementById('settingsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });

        // Customer management
        document.getElementById('addCustomer').addEventListener('click', () => {
            this.openCustomerModal();
        });

        document.getElementById('closeCustomerModal').addEventListener('click', () => {
            this.uiManager.hideModal('customerModal');
        });

        document.getElementById('customerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCustomer();
        });

        // Employee management
        document.getElementById('addEmployee').addEventListener('click', () => {
            this.openEmployeeModal();
        });

        document.getElementById('closeEmployeeModal').addEventListener('click', () => {
            this.uiManager.hideModal('employeeModal');
        });

        document.getElementById('employeeForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEmployee();
        });

        // Add items
        document.getElementById('addGuesthouseItem').addEventListener('click', () => {
            this.openItemModal('guesthouse');
        });

        document.getElementById('addButcheryItem').addEventListener('click', () => {
            this.openItemModal('butchery');
        });

        document.getElementById('addWorkshopService').addEventListener('click', () => {
            this.openItemModal('workshop-service');
        });

        document.getElementById('addWorkshopProduct').addEventListener('click', () => {
            this.openItemModal('workshop-product');
        });

        // Item modal
        document.getElementById('closeItemModal').addEventListener('click', () => {
            this.uiManager.hideModal('itemModal');
        });

        document.getElementById('itemForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveItem();
        });

        // Receipt
        document.getElementById('closeReceipt').addEventListener('click', () => {
            this.uiManager.hideModal('receiptModal');
        });

        // Payslip
        document.getElementById('closePayslip').addEventListener('click', () => {
            this.uiManager.hideModal('payslipModal');
        });

        document.getElementById('printPayslip').addEventListener('click', () => {
            this.printPayslip();
        });

        document.getElementById('downloadPayslip').addEventListener('click', () => {
            this.downloadPayslip();
        });

        document.getElementById('printReceipt').addEventListener('click', () => {
            this.receiptManager.printReceipt();
        });

        document.getElementById('downloadReceipt').addEventListener('click', () => {
            this.receiptManager.downloadReceipt();
        });

        // Reports
        document.getElementById('generateReport').addEventListener('click', () => {
            this.generateReport();
        });

        document.getElementById('printReport').addEventListener('click', () => {
            this.printReport();
        });

        // Report type change handler
        document.getElementById('reportType').addEventListener('change', (e) => {
            const type = e.target.value;
            const dateRangeContainer = document.getElementById('dateRangeContainer');
            const singleDateContainer = document.getElementById('singleDateContainer');
            
            if (type === 'custom') {
                dateRangeContainer.style.display = 'flex';
                singleDateContainer.style.display = 'none';
            } else {
                dateRangeContainer.style.display = 'none';
                singleDateContainer.style.display = 'block';
            }
        });

        // Cart functionality
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.cart.length > 0) {
                this.clearCart();
            }
        });
    }

    setupMobileMenu() {
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');

        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });

        // Close sidebar when clicking on main content (mobile)
        document.getElementById('mainContent').addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
            }
        });
    }

    applyTheme() {
        const settings = this.dataManager.getSettings();
        const theme = settings.theme || {};

        if (theme.primaryColor) {
            document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
        }
        if (theme.secondaryColor) {
            document.documentElement.style.setProperty('--secondary-color', theme.secondaryColor);
        }
        if (theme.guesthouseColor) {
            document.documentElement.style.setProperty('--guesthouse-color', theme.guesthouseColor);
        }
        if (theme.butcheryColor) {
            document.documentElement.style.setProperty('--butchery-color', theme.butcheryColor);
        }
        if (theme.workshopColor) {
            document.documentElement.style.setProperty('--workshop-color', theme.workshopColor);
        }
        
        // NEW: Apply navbar colors
        if (theme.navbarBackground) {
            document.documentElement.style.setProperty('--navbar-background', theme.navbarBackground);
            document.querySelector('.header').style.backgroundColor = theme.navbarBackground;
            document.querySelector('.sidebar').style.backgroundColor = theme.navbarBackground;
        }
        if (theme.navbarText) {
            document.documentElement.style.setProperty('--navbar-text', theme.navbarText);
            document.querySelector('.header').style.color = theme.navbarText;
            document.querySelector('.app-title').style.color = theme.navbarText;
            document.querySelectorAll('.nav-link').forEach(link => {
                link.style.color = theme.navbarText;
            });
        }
        if (theme.navbarHover) {
            document.documentElement.style.setProperty('--navbar-hover', theme.navbarHover);
            // Update hover styles dynamically
            const style = document.createElement('style');
            style.textContent = `
                .nav-link:hover {
                    color: ${theme.navbarHover} !important;
                    background-color: ${theme.navbarHover}1a !important;
                }
            `;
            document.head.appendChild(style);
        }
        if (theme.navbarActive) {
            document.documentElement.style.setProperty('--navbar-active', theme.navbarActive);
            // Update active nav link color
            document.querySelectorAll('.nav-link.active').forEach(link => {
                link.style.backgroundColor = theme.navbarActive;
                link.style.color = 'white';
            });
        }

        // NEW: Apply sidebar colors
        if (theme.sidebarBackground) {
            document.documentElement.style.setProperty('--sidebar-background', theme.sidebarBackground);
            document.querySelector('.sidebar').style.backgroundColor = theme.sidebarBackground;
        }
        if (theme.sidebarText) {
            document.documentElement.style.setProperty('--sidebar-text', theme.sidebarText);
            document.querySelectorAll('.nav-link').forEach(link => {
                link.style.color = theme.sidebarText;
            });
        }
        if (theme.sidebarHover) {
            document.documentElement.style.setProperty('--sidebar-hover', theme.sidebarHover);
            // Update hover styles dynamically
            const style = document.createElement('style');
            style.textContent = `
                .nav-link:hover {
                    color: ${theme.sidebarHover} !important;
                    background-color: ${theme.sidebarHover}1a !important;
                }
            `;
            document.head.appendChild(style);
        }
        if (theme.sidebarActive) {
            document.documentElement.style.setProperty('--sidebar-active', theme.sidebarActive);
            // Update active nav link color
            document.querySelectorAll('.nav-link.active').forEach(link => {
                link.style.backgroundColor = theme.sidebarActive;
                link.style.color = 'white';
            });
        }
    }

    loadSettings() {
        const settings = this.dataManager.getSettings();
        document.getElementById('businessName').value = settings.businessName;
        document.getElementById('businessAddress').value = settings.businessAddress;
        document.getElementById('currency').value = settings.currency;
        document.getElementById('taxRate').value = settings.taxRate || 16;
        document.getElementById('appTitle').textContent = settings.businessName || 'Business Management System';

        // Load theme settings
        const theme = settings.theme || {};
        document.getElementById('primaryColor').value = theme.primaryColor || '#3498db';
        document.getElementById('secondaryColor').value = theme.secondaryColor || '#2c3e50';
        document.getElementById('guesthouseColor').value = theme.guesthouseColor || '#9b59b6';
        document.getElementById('butcheryColor').value = theme.butcheryColor || '#e67e22';
        document.getElementById('workshopColor').value = theme.workshopColor || '#34495e';
        
        // NEW: Load navbar color settings
        document.getElementById('navbarBackground').value = theme.navbarBackground || '#ffffff';
        document.getElementById('navbarText').value = theme.navbarText || '#2c3e50';
        document.getElementById('navbarHover').value = theme.navbarHover || '#3498db';
        document.getElementById('navbarActive').value = theme.navbarActive || '#3498db';
        
        // NEW: Load sidebar color settings
        document.getElementById('sidebarBackground').value = theme.sidebarBackground || '#ffffff';
        document.getElementById('sidebarText').value = theme.sidebarText || '#2c3e50';
        document.getElementById('sidebarHover').value = theme.sidebarHover || '#3498db';
        document.getElementById('sidebarActive').value = theme.sidebarActive || '#3498db';
    }

    saveSettings() {
        const settings = {
            businessName: document.getElementById('businessName').value,
            businessAddress: document.getElementById('businessAddress').value,
            currency: document.getElementById('currency').value,
            taxRate: parseFloat(document.getElementById('taxRate').value) || 16,
            theme: {
                primaryColor: document.getElementById('primaryColor').value,
                secondaryColor: document.getElementById('secondaryColor').value,
                guesthouseColor: document.getElementById('guesthouseColor').value,
                butcheryColor: document.getElementById('butcheryColor').value,
                workshopColor: document.getElementById('workshopColor').value,
                // NEW: Save navbar color settings
                navbarBackground: document.getElementById('navbarBackground').value,
                navbarText: document.getElementById('navbarText').value,
                navbarHover: document.getElementById('navbarHover').value,
                navbarActive: document.getElementById('navbarActive').value,
                // NEW: Save sidebar color settings
                sidebarBackground: document.getElementById('sidebarBackground').value,
                sidebarText: document.getElementById('sidebarText').value,
                sidebarHover: document.getElementById('sidebarHover').value,
                sidebarActive: document.getElementById('sidebarActive').value
            }
        };

        this.dataManager.saveSettings(settings);
        this.uiManager.hideModal('settingsModal');
        this.uiManager.showNotification('Settings saved successfully!');
        this.loadSettings();
        this.applyTheme();
    }

    loadDashboard() {
        const revenue = this.dataManager.getTodayRevenue();
        document.getElementById('guesthouseRevenue').textContent = 
            `KES ${revenue.guesthouse.toLocaleString()}`;
        document.getElementById('butcheryRevenue').textContent = 
            `KES ${revenue.butchery.toLocaleString()}`;
        document.getElementById('workshopRevenue').textContent = 
            `KES ${revenue.workshop.toLocaleString()}`;

        // Update customers count
        const customers = this.dataManager.getCustomers();
        document.getElementById('customersCount').textContent = customers.length.toLocaleString();

        // Update employees count
        const employees = this.dataManager.getEmployees();
        document.getElementById('employeesCount').textContent = employees.length.toLocaleString();

        this.loadRecentTransactions();
        this.loadDashboardEmployees(); // NEW: Load employees on dashboard
    }

    // NEW: Load employees for dashboard display
    loadDashboardEmployees() {
        const employees = this.dataManager.getEmployees().slice(0, 5); // Show latest 5 employees
        const container = document.getElementById('dashboardEmployees');
        
        if (employees.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No employees found</p>';
            return;
        }

        container.innerHTML = employees.map(employee => {
            const netPay = this.dataManager.calculateNetPay(employee.grossSalary, employee.deductions);
            return `
                <tr>
                    <td>${employee.id}</td>
                    <td>${employee.name}</td>
                    <td>${employee.contact}</td>
                    <td>KES ${employee.grossSalary.toLocaleString()}</td>
                    <td>KES ${employee.deductions.toLocaleString()}</td>
                    <td>KES ${netPay.toLocaleString()}</td>
                    <td>KES ${(employee.advance || 0).toLocaleString()}</td>
                    <td>${employee.payFrequency}</td>
                    <td>${employee.payMonth}</td>
                    <td>${employee.payDay}</td>
                    <td>
                        <div class="actions">
                            <button class="btn btn-sm btn-info" onclick="app.generatePayslip('${employee.id}')">
                                <i class="fas fa-file-invoice"></i> Payslip
                            </button>
                            <button class="btn btn-sm btn-secondary" onclick="app.editEmployee('${employee.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    loadRecentTransactions() {
        const transactions = this.dataManager.getRecentTransactions();
        const container = document.getElementById('recentTransactions');

        container.innerHTML = transactions.map(transaction => `
            <div class="activity-item">
                <div class="activity-info">
                    <h4>${transaction.description}</h4>
                    <p>${new Date(transaction.date).toLocaleString()}</p>
                </div>
                <div class="activity-amount">KES ${transaction.amount.toLocaleString()}</div>
            </div>
        `).join('');
    }

    loadCustomers() {
        const customers = this.dataManager.getCustomers();
        const tbody = document.getElementById('customersTableBody');

        tbody.innerHTML = customers.map(customer => `
            <tr>
                <td>${customer.name}</td>
                <td>${customer.phone}</td>
                <td>${customer.nationalId}</td>
                <td>${customer.address}</td>
                <td>${new Date(customer.createdAt).toLocaleDateString()}</td>
                <td>
                    <div class="actions">
                        <button class="btn btn-sm btn-secondary" onclick="app.editCustomer('${customer.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="app.deleteCustomer('${customer.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    openCustomerModal(customerId = null) {
        const title = document.getElementById('customerModalTitle');
        title.textContent = customerId ? 'Edit Customer' : 'Add Customer';

        // Clear form
        document.getElementById('customerForm').reset();

        if (customerId) {
            const customer = this.dataManager.getCustomer(customerId);
            if (customer) {
                document.getElementById('customerName').value = customer.name;
                document.getElementById('customerPhone').value = customer.phone;
                document.getElementById('customerId').value = customer.nationalId;
                document.getElementById('customerAddress').value = customer.address;
            }
        }

        this.uiManager.showModal('customerModal');
    }

    saveCustomer() {
        const customer = {
            name: document.getElementById('customerName').value,
            phone: document.getElementById('customerPhone').value,
            nationalId: document.getElementById('customerId').value,
            address: document.getElementById('customerAddress').value
        };

        this.dataManager.addCustomer(customer);
        this.uiManager.hideModal('customerModal');
        this.uiManager.showNotification('Customer saved successfully!');
        this.loadCustomers();
    }

    deleteCustomer(customerId) {
        if (confirm('Are you sure you want to delete this customer?')) {
            this.dataManager.customers = this.dataManager.customers.filter(c => c.id !== customerId);
            this.dataManager.saveData('customers', this.dataManager.customers);
            this.uiManager.showNotification('Customer deleted successfully!');
            this.loadCustomers();
        }
    }

    editCustomer(customerId) {
        this.openCustomerModal(customerId);
    }

    loadGuesthouse() {
        const rooms = this.dataManager.getGuesthouseRooms();
        const tbody = document.getElementById('guesthouseTableBody');

        tbody.innerHTML = rooms.map(room => `
            <tr>
                <td>${room.roomNumber}</td>
                <td>${room.roomType}</td>
                <td>KES ${room.pricePerNight.toLocaleString()}</td>
                <td>
                    <span class="status-badge status-${room.status.toLowerCase()}">
                        ${room.status}
                    </span>
                </td>
                <td>${new Date(room.createdAt || Date.now()).toLocaleDateString()}</td>
                <td>
                    <div class="actions">
                        <button class="btn btn-sm btn-secondary" onclick="app.bookRoom('${room.id}')">
                            <i class="fas fa-bed"></i> Book
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="app.deleteItem('guesthouse', '${room.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    loadButchery() {
        const products = this.dataManager.getButcheryProducts();
        const tbody = document.getElementById('butcheryTableBody');

        tbody.innerHTML = products.map(product => `
            <tr>
                <td>${product.name}</td>
                <td>KES ${product.pricePerKg.toLocaleString()}</td>
                <td>
                    <span class="status-badge status-${product.stock > 10 ? 'instock' : 'lowstock'}">
                        ${product.stock} kg
                    </span>
                </td>
                <td>${new Date(product.createdAt || Date.now()).toLocaleDateString()}</td>
                <td>
                    <div class="actions">
                        <button class="btn btn-sm btn-secondary" onclick="app.addToCart('butchery', '${product.id}')">
                            <i class="fas fa-cart-plus"></i> Add to Cart
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="app.sellProduct('${product.id}')">
                            <i class="fas fa-shopping-cart"></i> Quick Sell
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="app.deleteItem('butchery', '${product.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Add cart indicator
        this.updateCartIndicator();
    }

    loadWorkshop() {
        // Load services
        const services = this.dataManager.getWorkshopServices();
        const servicesTbody = document.getElementById('workshopServicesTableBody');

        servicesTbody.innerHTML = services.map(service => `
            <tr>
                <td>${service.name}</td>
                <td>KES ${service.price.toLocaleString()}</td>
                <td>${service.duration}</td>
                <td>${new Date(service.createdAt || Date.now()).toLocaleDateString()}</td>
                <td>
                    <div class="actions">
                        <button class="btn btn-sm btn-secondary" onclick="app.editService('${service.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="app.bookService('${service.id}')">
                            <i class="fas fa-wrench"></i> Book
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="app.deleteItem('workshop', '${service.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Load products
        const products = this.dataManager.getWorkshopProducts();
        const productsTbody = document.getElementById('workshopProductsTableBody');

        productsTbody.innerHTML = products.map(product => `
            <tr>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>KES ${product.price.toLocaleString()}</td>
                <td>${new Date(product.createdAt || Date.now()).toLocaleDateString()}</td>
                <td>
                    <div class="actions">
                        <button class="btn btn-sm btn-secondary" onclick="app.addToCart('workshop-product', '${product.id}')">
                            <i class="fas fa-cart-plus"></i> Add to Cart
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="app.sellWorkshopProduct('${product.id}')">
                            <i class="fas fa-shopping-cart"></i> Quick Sell
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="app.deleteWorkshopProduct('${product.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Add cart indicator
        this.updateCartIndicator();
    }

    openItemModal(business, itemId = null) {
        this.currentBusiness = business;
        const title = document.getElementById('itemModalTitle');
        const formFields = document.getElementById('itemFormFields');

        title.textContent = itemId ? 'Edit Item' : 'Add Item';

        // Clear form
        formFields.innerHTML = '';

        // Add fields based on business type
        switch(business) {
            case 'guesthouse':
                formFields.innerHTML = `
                    <div class="form-group">
                        <label for="roomNumber">Room Number</label>
                        <input type="text" id="roomNumber" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="roomType">Room Type</label>
                        <select id="roomType" class="form-control" required>
                            <option value="Single">Single</option>
                            <option value="Double">Double</option>
                            <option value="Suite">Suite</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="pricePerNight">Price per Night (KES)</label>
                        <input type="number" id="pricePerNight" class="form-control" required>
                    </div>
                `;
                break;
            case 'butchery':
                formFields.innerHTML = `
                    <div class="form-group">
                        <label for="productName">Product Name</label>
                        <input type="text" id="productName" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="pricePerKg">Price per Kg (KES)</label>
                        <input type="number" id="pricePerKg" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="stock">Stock Available (kg)</label>
                        <input type="number" id="stock" class="form-control" required>
                    </div>
                `;
                break;
            case 'workshop-service':
                formFields.innerHTML = `
                    <div class="form-group">
                        <label for="serviceName">Service Name</label>
                        <input type="text" id="serviceName" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="servicePrice">Price (KES)</label>
                        <input type="number" id="servicePrice" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="serviceDuration">Duration (hours)</label>
                        <input type="number" id="serviceDuration" class="form-control" required>
                    </div>
                `;
                break;
            case 'workshop-product':
                formFields.innerHTML = `
                    <div class="form-group">
                        <label for="productName">Product Name</label>
                        <input type="text" id="productName" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="productCategory">Category</label>
                        <select id="productCategory" class="form-control" required>
                            <option value="Furniture">Furniture</option>
                            <option value="Metal Work">Metal Work</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="productPrice">Price (KES)</label>
                        <input type="number" id="productPrice" class="form-control" required>
                    </div>
                `;
                break;
        }

        this.uiManager.showModal('itemModal');
    }

    saveItem() {
        const business = this.currentBusiness;
        let item = {};

        switch(business) {
            case 'guesthouse':
                item = {
                    roomNumber: document.getElementById('roomNumber').value,
                    roomType: document.getElementById('roomType').value,
                    pricePerNight: parseFloat(document.getElementById('pricePerNight').value),
                    status: 'Available'
                };
                break;
            case 'butchery':
                item = {
                    name: document.getElementById('productName').value,
                    pricePerKg: parseFloat(document.getElementById('pricePerKg').value),
                    stock: parseFloat(document.getElementById('stock').value)
                };
                break;
            case 'workshop-service':
                item = {
                    name: document.getElementById('serviceName').value,
                    price: parseFloat(document.getElementById('servicePrice').value),
                    duration: parseFloat(document.getElementById('serviceDuration').value),
                    type: 'service'
                };
                break;
            case 'workshop-product':
                item = {
                    name: document.getElementById('productName').value,
                    category: document.getElementById('productCategory').value,
                    price: parseFloat(document.getElementById('productPrice').value),
                    type: 'product'
                };
                break;
        }

        this.dataManager.addItem(business.replace('-service', '').replace('-product', ''), item);
        this.uiManager.hideModal('itemModal');
        this.uiManager.showNotification('Item saved successfully!');

        // Reload the current section
        switch(business) {
            case 'guesthouse':
                this.loadGuesthouse();
                break;
            case 'butchery':
                this.loadButchery();
                break;
            case 'workshop-service':
            case 'workshop-product':
                this.loadWorkshop();
                break;
        }
    }

    deleteWorkshopProduct(productId) {
        if (confirm('Are you sure you want to delete this product?')) {
            this.dataManager.deleteWorkshopProduct(productId);
            this.uiManager.showNotification('Product deleted successfully!');
            this.loadWorkshop();
        }
    }

    // Add generic deleteItem so onclick="app.deleteItem(...)" works
    deleteItem(business, itemId) {
        if (!confirm('Are you sure you want to delete this item?')) return;

        // Delegate deletion to DataManager
        this.dataManager.deleteItem(business, itemId);

        // Notify user
        this.uiManager.showNotification('Item deleted successfully!');

        // Reload the appropriate section to reflect changes
        switch (business) {
            case 'guesthouse':
                this.loadGuesthouse();
                break;
            case 'butchery':
                this.loadButchery();
                break;
            case 'workshop':
                this.loadWorkshop();
                break;
            default:
                // fallback: reload current section if unknown
                this.switchSection(this.currentSection);
        }
    }

    // Cart functionality
    addToCart(type, itemId) {
        let item;
        let cartItem;

        switch(type) {
            case 'butchery':
                item = this.dataManager.getButcheryProduct(itemId);
                if (item) {
                    const quantity = prompt(`Enter quantity for ${item.name} (kg):`);
                    if (quantity && parseFloat(quantity) > 0) {
                        const qty = parseFloat(quantity);
                        if (qty > item.stock) {
                            this.uiManager.showNotification('Insufficient stock!', 'error');
                            return;
                        }
                        cartItem = {
                            id: item.id,
                            name: item.name,
                            description: `${item.name} - ${qty} kg`,
                            quantity: qty,
                            price: item.pricePerKg,
                            subtotal: item.pricePerKg * qty,
                            type: 'butchery'
                        };
                        this.cart.push(cartItem);
                        this.uiManager.showNotification(`${item.name} added to cart!`);
                    }
                }
                break;
            case 'workshop-product':
                item = this.dataManager.getWorkshopProducts().find(p => p.id === itemId);
                if (item) {
                    const quantity = prompt(`Enter quantity for ${item.name}:`);
                    if (quantity && parseInt(quantity) > 0) {
                        const qty = parseInt(quantity);
                        cartItem = {
                            id: item.id,
                            name: item.name,
                            description: `${item.name} - ${qty} unit(s)`,
                            quantity: qty,
                            price: item.price,
                            subtotal: item.price * qty,
                            type: 'workshop-product'
                        };
                        this.cart.push(cartItem);
                        this.uiManager.showNotification(`${item.name} added to cart!`);
                    }
                }
                break;
        }

        this.updateCartIndicator();
        this.checkCartForCheckout();
    }

    updateCartIndicator() {
        // Remove existing cart indicator
        const existingIndicator = document.querySelector('.cart-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        if (this.cart.length > 0) {
            // Add cart indicator to header
            const headerActions = document.querySelector('.header-actions');
            const cartIndicator = document.createElement('div');
            cartIndicator.className = 'cart-indicator';
            cartIndicator.innerHTML = `
                <button class="btn btn-primary" style="position: relative;">
                    <i class="fas fa-shopping-cart"></i>
                    Cart
                    <span class="cart-count">${this.cart.length}</span>
                </button>
            `;
            cartIndicator.addEventListener('click', () => this.showCart());
            headerActions.insertBefore(cartIndicator, headerActions.firstChild);
        }
    }

    checkCartForCheckout() {
        if (this.cart.length > 0) {
            // Add checkout button to butchery and workshop sections
            const butcherySection = document.getElementById('butchery-section');
            const workshopSection = document.getElementById('workshop-section');
            
            [butcherySection, workshopSection].forEach(section => {
                if (section && !section.querySelector('.cart-checkout')) {
                    const checkoutBtn = document.createElement('button');
                    checkoutBtn.className = 'btn btn-primary cart-checkout';
                    checkoutBtn.innerHTML = '<i class="fas fa-cash-register"></i> Checkout Cart';
                    checkoutBtn.onclick = () => this.checkoutCart();
                    checkoutBtn.style.cssText = 'margin: 1rem 0; background: #27ae60; border-color: #27ae60;';
                    section.querySelector('.section-header').appendChild(checkoutBtn);
                }
            });
        }
    }

    showCart() {
        if (this.cart.length === 0) {
            this.uiManager.showNotification('Cart is empty!', 'info');
            return;
        }

        let cartHTML = '<h3>Shopping Cart</h3>';
        cartHTML += '<div style="margin: 1rem 0;">';
        
        this.cart.forEach((item, index) => {
            cartHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border-bottom: 1px solid #eee;">
                    <div>
                        <strong>${item.name}</strong><br>
                        <small>${item.description}</small>
                    </div>
                    <div>
                        <strong>KES ${item.subtotal.toLocaleString()}</strong>
                        <button class="btn btn-sm btn-danger" onclick="app.removeFromCart(${index})" style="margin-left: 1rem;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        const total = this.cart.reduce((sum, item) => sum + item.subtotal, 0);
        const taxRate = this.dataManager.getSettings().taxRate || 16;
        const taxAmount = (total * taxRate) / 100;
        const grandTotal = total + taxAmount;

        cartHTML += `
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid #333;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span>Subtotal:</span>
                    <strong>KES ${total.toLocaleString()}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span>VAT (${taxRate}%):</span>
                    <strong>KES ${taxAmount.toLocaleString()}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: bold;">
                    <span>Total:</span>
                    <strong>KES ${grandTotal.toLocaleString()}</strong>
                </div>
            </div>
            
            <div style="margin-top: 1rem; text-align: center;">
                <button class="btn btn-primary" onclick="app.checkoutCart()" style="margin-right: 0.5rem;">
                    <i class="fas fa-credit-card"></i> Checkout
                </button>
                <button class="btn btn-secondary" onclick="app.clearCart()">
                    <i class="fas fa-trash"></i> Clear Cart
                </button>
            </div>
        `;
        
        cartHTML += '</div>';

        // Show cart in a modal
        const cartModal = document.createElement('div');
        cartModal.className = 'modal active';
        cartModal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>Shopping Cart</h3>
                    <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    ${cartHTML}
                </div>
            </div>
        `;
        document.body.appendChild(cartModal);
    }

    removeFromCart(index) {
        this.cart.splice(index, 1);
        this.updateCartIndicator();
        this.showCart(); // Refresh cart display
    }

    clearCart() {
        this.cart = [];
        this.updateCartIndicator();
        // Remove cart checkout buttons
        document.querySelectorAll('.cart-checkout').forEach(btn => btn.remove());
        this.uiManager.showNotification('Cart cleared!');
    }

    checkoutCart() {
        if (this.cart.length === 0) {
            this.uiManager.showNotification('Cart is empty!', 'info');
            return;
        }

        // Get customer information
        const customerId = prompt('Enter Customer ID (optional):');
        let customerName = '';
        let customerNationalId = '';

        if (customerId) {
            const customer = this.dataManager.getCustomer(customerId);
            if (customer) {
                customerName = customer.name;
                customerNationalId = customer.nationalId;
            }
        }

        // Process cart items
        const settings = this.dataManager.getSettings();
        const taxRate = settings.taxRate || 16;
        const subtotal = this.cart.reduce((sum, item) => sum + item.subtotal, 0);
        const taxAmount = (subtotal * taxRate) / 100;
        const total = subtotal + taxAmount;

        // Reduce stock for butchery items
        for (const item of this.cart) {
            if (item.type === 'butchery') {
                if (!this.dataManager.reduceProductStock(item.id, item.quantity)) {
                    this.uiManager.showNotification(`Insufficient stock for ${item.name}!`, 'error');
                    return;
                }
            }
        }

        const transaction = {
            type: 'multi-item',
            items: this.cart,
            subtotal: subtotal,
            taxAmount: taxAmount,
            taxRate: taxRate,
            amount: total,
            customerId: customerId,
            customerName: customerName,
            customerNationalId: customerNationalId,
            date: new Date().toISOString()
        };

        this.dataManager.addTransaction(transaction);
        this.dataManager.addSale(transaction);
        this.receiptManager.showReceipt(transaction);
        this.receiptManager.generateBarcode();
        
        // Clear cart
        this.clearCart();
        
        // Refresh relevant sections
        this.loadDashboard();
        this.loadSales();
        
        this.uiManager.showNotification('Checkout completed successfully!');
    }

    sellProduct(productId) {
        const product = this.dataManager.getButcheryProduct(productId);
        if (product) {
            const quantity = prompt('Enter quantity (kg):');
            if (quantity && parseFloat(quantity) > 0) {
                const qty = parseFloat(quantity);
                
                // Check if we have enough stock
                if (!this.dataManager.reduceProductStock(productId, qty)) {
                    this.uiManager.showNotification('Insufficient stock!', 'error');
                    return;
                }

                // Get customer information
                const customerId = prompt('Enter Customer ID (optional):');
                let customerName = '';
                let customerNationalId = '';

                if (customerId) {
                    const customer = this.dataManager.getCustomer(customerId);
                    if (customer) {
                        customerName = customer.name;
                        customerNationalId = customer.nationalId;
                    }
                }

                const settings = this.dataManager.getSettings();
                const taxRate = settings.taxRate || 16;
                const subtotal = product.pricePerKg * qty;
                const taxAmount = (subtotal * taxRate) / 100;
                const total = subtotal + taxAmount;

                const transaction = {
                    type: 'butchery',
                    description: `${product.name} - ${qty} kg`,
                    amount: total,
                    subtotal: subtotal,
                    taxAmount: taxAmount,
                    taxRate: taxRate,
                    customerId: customerId,
                    customerName: customerName,
                    customerNationalId: customerNationalId,
                    date: new Date().toISOString()
                };

                // Add to transactions and sales
                this.dataManager.addTransaction(transaction);
                this.dataManager.addSale(transaction);
                this.receiptManager.showReceipt(transaction);
                this.receiptManager.generateBarcode();
                this.loadDashboard();
                this.loadButchery(); // Refresh butchery table to show updated stock
                this.loadSales(); // Refresh sales table
            }
        }
    }

    sellWorkshopProduct(productId) {
        const product = this.dataManager.getWorkshopProducts().find(p => p.id === productId);
        if (product) {
            const quantity = prompt('Enter quantity:');
            if (quantity && parseInt(quantity) > 0) {
                // Get customer information
                const customerId = prompt('Enter Customer ID (optional):');
                let customerName = '';
                let customerNationalId = '';

                if (customerId) {
                    const customer = this.dataManager.getCustomer(customerId);
                    if (customer) {
                        customerName = customer.name;
                        customerNationalId = customer.nationalId;
                    }
                }

                const settings = this.dataManager.getSettings();
                const taxRate = settings.taxRate || 16;
                const subtotal = product.price * parseInt(quantity);
                const taxAmount = (subtotal * taxRate) / 100;
                const total = subtotal + taxAmount;

                const transaction = {
                    type: 'workshop',
                    description: `${product.name} - ${quantity} unit(s)`,
                    amount: total,
                    subtotal: subtotal,
                    taxAmount: taxAmount,
                    taxRate: taxRate,
                    customerId: customerId,
                    customerName: customerName,
                    customerNationalId: customerNationalId,
                    date: new Date().toISOString()
                };

                this.dataManager.addTransaction(transaction);
                this.dataManager.addSale(transaction);
                this.receiptManager.showReceipt(transaction);
                this.receiptManager.generateBarcode();
                this.loadDashboard();
                this.loadSales(); // Refresh sales table
            }
        }
    }

    bookService(serviceId) {
        const service = this.dataManager.getWorkshopService(serviceId);
        if (service) {
            // Get customer information
            const customerId = prompt('Enter Customer ID (optional):');
            let customerName = '';
            let customerNationalId = '';

            if (customerId) {
                const customer = this.dataManager.getCustomer(customerId);
                if (customer) {
                    customerName = customer.name;
                    customerNationalId = customer.nationalId;
                }
            }

            const settings = this.dataManager.getSettings();
            const taxRate = settings.taxRate || 16;
            const taxAmount = (service.price * taxRate) / 100;
            const total = service.price + taxAmount;

            const transaction = {
                type: 'workshop',
                description: `${service.name} service - ${service.duration} hour(s)`,
                amount: total,
                subtotal: service.price,
                taxAmount: taxAmount,
                taxRate: taxRate,
                customerId: customerId,
                customerName: customerName,
                customerNationalId: customerNationalId,
                date: new Date().toISOString()
            };

            this.dataManager.addTransaction(transaction);
            this.dataManager.addSale(transaction);
            this.receiptManager.showReceipt(transaction);
            this.receiptManager.generateBarcode();
            this.loadDashboard();
            this.loadSales(); // Refresh sales table
            this.uiManager.showNotification('Service booked successfully!');
        }
    }

    bookRoom(roomId) {
        const room = this.dataManager.getGuesthouseRoom(roomId);
        if (room) {
            const nights = prompt('Enter number of nights:');
            if (nights && parseInt(nights) > 0) {
                // Get customer information
                const customerId = prompt('Enter Customer ID (optional):');
                let customerName = '';
                let customerNationalId = '';

                if (customerId) {
                    const customer = this.dataManager.getCustomer(customerId);
                    if (customer) {
                        customerName = customer.name;
                        customerNationalId = customer.nationalId;
                    }
                }

                const settings = this.dataManager.getSettings();
                const taxRate = settings.taxRate || 16;
                const subtotal = room.pricePerNight * parseInt(nights);
                const taxAmount = (subtotal * taxRate) / 100;
                const total = subtotal + taxAmount;

                const transaction = {
                    type: 'guesthouse',
                    description: `Room ${room.roomNumber} - ${room.roomType} for ${nights} night(s)`,
                    amount: total,
                    subtotal: subtotal,
                    taxAmount: taxAmount,
                    taxRate: taxRate,
                    customerId: customerId,
                    customerName: customerName,
                    customerNationalId: customerNationalId,
                    date: new Date().toISOString()
                };

                this.dataManager.addTransaction(transaction);
                this.dataManager.addSale(transaction);
                this.dataManager.updateRoomStatus(roomId, 'Occupied');
                this.receiptManager.showReceipt(transaction);
                this.loadDashboard();
                this.loadGuesthouse();
                this.loadSales(); // Refresh sales table
                this.uiManager.showNotification('Room booked successfully!');
            }
        }
    }

    generateReport() {
        const reportType = document.getElementById('reportType').value;
        let startDate, endDate;

        if (reportType === 'custom') {
            startDate = document.getElementById('startDate').value;
            endDate = document.getElementById('endDate').value;
            
            if (!startDate || !endDate) {
                this.uiManager.showNotification('Please select both start and end dates', 'error');
                return;
            }
        } else {
            startDate = document.getElementById('reportDate').value;
            endDate = null;
            
            if (!startDate) {
                this.uiManager.showNotification('Please select a date', 'error');
                return;
            }
        }

        const report = this.reportManager.generateReport(reportType, startDate, endDate);
        document.getElementById('reportContent').innerHTML = report;
        this.uiManager.showNotification('Report generated successfully!');
    }

    printReport() {
        const reportContent = document.getElementById('reportContent').innerHTML;
        const settings = this.dataManager.getSettings();
        
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Sales Report - ${settings.businessName}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .report-header { text-align: center; margin-bottom: 30px; }
                    .report-header h3 { margin-bottom: 10px; }
                    .summary-cards { display: flex; gap: 20px; margin: 20px 0; }
                    .summary-card { background: #f5f5f5; padding: 15px; border-radius: 5px; }
                    .summary-value { font-size: 1.5em; font-weight: bold; color: #3498db; }
                    .report-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    .report-table th, .report-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    .report-table th { background-color: #f5f5f5; }
                    .report-footer { text-align: center; margin-top: 30px; font-size: 0.9em; color: #666; }
                </style>
            </head>
            <body>
                <div class="report-header">
                    <h2>${settings.businessName}</h2>
                    <p>${settings.businessAddress}</p>
                </div>
                ${reportContent}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    loadSales() {
        const sales = this.dataManager.getAllSales();
        const tbody = document.getElementById('salesTableBody');

        // Calculate totals
        const totals = {
            subtotal: sales.reduce((sum, sale) => sum + (sale.subtotal || sale.amount), 0),
            taxAmount: sales.reduce((sum, sale) => sum + (sale.taxAmount || 0), 0),
            total: sales.reduce((sum, sale) => sum + sale.amount, 0)
        };

        tbody.innerHTML = sales.map(sale => `
            <tr>
                <td>${new Date(sale.date).toLocaleDateString()}</td>
                <td>${sale.customerName || 'Walk-in Customer'}</td>
                <td>${sale.description}</td>
                <td>${sale.subtotal ? sale.subtotal.toLocaleString() : sale.amount.toLocaleString()}</td>
                <td>${sale.taxAmount ? sale.taxAmount.toLocaleString() : '0'}</td>
                <td>${sale.amount.toLocaleString()}</td>
                <td>
                    <div class="actions">
                        <button class="btn btn-sm btn-secondary" onclick="app.viewSaleReceipt('${sale.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Add totals row
        tbody.innerHTML += `
            <tr style="font-weight: bold; background-color: #f5f5f5; border-top: 2px solid #333;">
                <td colspan="3" style="text-align: right;"><strong>TOTALS</strong></td>
                <td><strong>KES ${totals.subtotal.toLocaleString()}</strong></td>
                <td><strong>KES ${totals.taxAmount.toLocaleString()}</strong></td>
                <td><strong>KES ${totals.total.toLocaleString()}</strong></td>
                <td></td>
            </tr>
        `;
    }

    viewSaleReceipt(saleId) {
        const sale = this.dataManager.getAllSales().find(s => s.id === saleId);
        if (sale) {
            this.receiptManager.showReceipt(sale);
            this.receiptManager.generateBarcode();
        }
    }

    printTable(tableType) {
        const settings = this.dataManager.getSettings();
        let tableData = '';
        let title = '';
        let headers = [];

        switch(tableType) {
            case 'sales':
                const sales = this.dataManager.getAllSales();
                title = 'Sales Records';
                headers = ['Date', 'Customer', 'Description', 'Subtotal', 'VAT', 'Total'];
                tableData = sales.map(sale => `
                    <tr>
                        <td>${new Date(sale.date).toLocaleDateString()}</td>
                        <td>${sale.customerName || 'Walk-in Customer'}</td>
                        <td>${sale.description}</td>
                        <td>${sale.subtotal ? sale.subtotal.toLocaleString() : sale.amount.toLocaleString()}</td>
                        <td>${sale.taxAmount ? sale.taxAmount.toLocaleString() : '0'}</td>
                        <td>${sale.amount.toLocaleString()}</td>
                    </tr>
                `).join('');
                break;
            case 'guesthouse':
                const rooms = this.dataManager.getGuesthouseRooms();
                title = 'Guest House Rooms';
                headers = ['Room Number', 'Room Type', 'Price per Night', 'Status', 'Created'];
                tableData = rooms.map(room => `
                    <tr>
                        <td>${room.roomNumber}</td>
                        <td>${room.roomType}</td>
                        <td>KES ${room.pricePerNight.toLocaleString()}</td>
                        <td>${room.status}</td>
                        <td>${new Date(room.createdAt || Date.now()).toLocaleDateString()}</td>
                    </tr>
                `).join('');
                break;
            case 'butchery':
                const products = this.dataManager.getButcheryProducts();
                title = 'Butchery Products';
                headers = ['Product Name', 'Price per Kg', 'Stock Available', 'Created'];
                tableData = products.map(product => `
                    <tr>
                        <td>${product.name}</td>
                        <td>KES ${product.pricePerKg.toLocaleString()}</td>
                        <td>${product.stock} kg</td>
                        <td>${new Date(product.createdAt || Date.now()).toLocaleDateString()}</td>
                    </tr>
                `).join('');
                break;
            case 'workshop-services':
                const services = this.dataManager.getWorkshopServices();
                title = 'Workshop Services';
                headers = ['Service Name', 'Price', 'Duration (hrs)', 'Created'];
                tableData = services.map(service => `
                    <tr>
                        <td>${service.name}</td>
                        <td>KES ${service.price.toLocaleString()}</td>
                        <td>${service.duration}</td>
                        <td>${new Date(service.createdAt || Date.now()).toLocaleDateString()}</td>
                    </tr>
                `).join('');
                break;
            case 'workshop-products':
                const workshopProducts = this.dataManager.getWorkshopProducts();
                title = 'Workshop Products';
                headers = ['Product Name', 'Category', 'Price', 'Created'];
                tableData = workshopProducts.map(product => `
                    <tr>
                        <td>${product.name}</td>
                        <td>${product.category}</td>
                        <td>KES ${product.price.toLocaleString()}</td>
                        <td>${new Date(product.createdAt || Date.now()).toLocaleDateString()}</td>
                    </tr>
                `).join('');
                break;
            case 'customers':
                const customers = this.dataManager.getCustomers();
                title = 'Customers';
                headers = ['Name', 'Phone', 'National ID', 'Address', 'Created'];
                tableData = customers.map(customer => `
                    <tr>
                        <td>${customer.name}</td>
                        <td>${customer.phone}</td>
                        <td>${customer.nationalId}</td>
                        <td>${customer.address}</td>
                        <td>${new Date(customer.createdAt).toLocaleDateString()}</td>
                    </tr>
                `).join('');
                break;
        }

        const printWindow = window.open('', '_blank', 'width=800,height=600');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title} - ${settings.businessName}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .print-header { text-align: center; margin-bottom: 30px; }
                    .print-header h2 { margin-bottom: 5px; }
                    .print-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    .print-table th, .print-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    .print-table th { background-color: #f5f5f5; font-weight: bold; }
                    .print-footer { text-align: center; margin-top: 30px; font-size: 0.8em; color: #666; }
                </style>
            </head>
            <body>
                <div class="print-header">
                    <h2>${settings.businessName}</h2>
                    <p>${settings.businessAddress}</p>
                    <h3>${title}</h3>
                    <p>Generated on: ${new Date().toLocaleString()}</p>
                </div>
                <table class="print-table">
                    <thead>
                        <tr>
                            ${headers.map(header => `<th>${header}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${tableData}
                    </tbody>
                </table>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    exportData() {
        if (!this.isAdmin) {
            this.promptAdminLogin(() => {
                if (this.isAdmin) {
                    this.exportData();
                }
            });
            return;
        }

        const data = {
            settings: this.dataManager.getSettings(),
            transactions: this.dataManager.getTransactions(),
            customers: this.dataManager.getCustomers(),
            guesthouseRooms: this.dataManager.getGuesthouseRooms(),
            butcheryProducts: this.dataManager.getButcheryProducts(),
            workshopServices: this.dataManager.getWorkshopServices(),
            workshopProducts: this.dataManager.getWorkshopProducts()
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `business-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    importData() {
        if (!this.isAdmin) {
            this.promptAdminLogin(() => {
                if (this.isAdmin) {
                    this.importData();
                }
            });
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const data = JSON.parse(event.target.result);
                        
                        // Validate data structure
                        if (data.settings) {
                            this.dataManager.saveSettings(data.settings);
                        }
                        if (data.transactions) {
                            this.dataManager.saveData('transactions', data.transactions);
                        }
                        if (data.customers) {
                            this.dataManager.saveData('customers', data.customers);
                        }
                        if (data.guesthouseRooms) {
                            this.dataManager.saveData('guesthouseRooms', data.guesthouseRooms);
                        }
                        if (data.butcheryProducts) {
                            this.dataManager.saveData('butcheryProducts', data.butcheryProducts);
                        }
                        if (data.workshopServices) {
                            this.dataManager.saveData('workshopServices', data.workshopServices);
                        }
                        if (data.workshopProducts) {
                            this.dataManager.saveData('workshopProducts', data.workshopProducts);
                        }

                        this.uiManager.showNotification('Data imported successfully!');
                        location.reload(); // Reload to refresh all data
                    } catch (error) {
                        this.uiManager.showNotification('Invalid data format!', 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    clearAllData() {
        if (!this.isAdmin) {
            this.promptAdminLogin(() => {
                if (this.isAdmin) {
                    this.clearAllData();
                }
            });
            return;
        }

        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            localStorage.clear();
            this.uiManager.showNotification('All data has been cleared!');
            location.reload();
        }
    }

    loadReports() {
        // Set default date to today
        document.getElementById('reportDate').valueAsDate = new Date();
    }

    editService(serviceId) {
        const service = this.dataManager.getWorkshopService(serviceId);
        if (!service) return;

        // Set current business to workshop-service for editing
        this.currentBusiness = 'workshop-service';

        const title = document.getElementById('itemModalTitle');
        title.textContent = 'Edit Service';

        const formFields = document.getElementById('itemFormFields');
        formFields.innerHTML = `
            <div class="form-group">
                <label for="serviceName">Service Name</label>
                <input type="text" id="serviceName" class="form-control" value="${service.name}" required>
            </div>
            <div class="form-group">
                <label for="servicePrice">Price (KES)</label>
                <input type="number" id="servicePrice" class="form-control" value="${service.price}" required>
            </div>
            <div class="form-group">
                <label for="serviceDuration">Duration (hours)</label>
                <input type="number" id="serviceDuration" class="form-control" value="${service.duration}" required>
            </div>
        `;

        // Store the service ID for updating
        document.getElementById('itemForm').dataset.editingId = serviceId;

        this.uiManager.showModal('itemModal');
    }

    getDefaultSettings() {
        return {
            businessName: 'Business Management System',
            businessAddress: '123 Business Street, City, Country',
            currency: 'KES',
            taxRate: 16, // 16% VAT
            theme: {
                primaryColor: '#3498db',
                secondaryColor: '#2c3e50',
                guesthouseColor: '#9b59b6',
                butcheryColor: '#e67e22',
                workshopColor: '#34495e',
                // NEW: Separate navbar and sidebar color settings
                navbarBackground: '#ffffff',
                navbarText: '#2c3e50',
                navbarHover: '#3498db',
                navbarActive: '#3498db',
                sidebarBackground: '#ffffff',
                sidebarText: '#2c3e50',
                sidebarHover: '#3498db',
                sidebarActive: '#3498db'
            }
        };
    }

    // Employee management
    loadEmployees() {
        try {
            const employees = this.dataManager.getEmployees();
            const tbody = document.getElementById('employeesTableBody');

            console.log('Loading employees:', employees); // Debug log

            if (!employees || employees.length === 0) {
                tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No employees found. Click "Add Employee" to create the first employee.</td></tr>';
                return;
            }

            tbody.innerHTML = employees.map(employee => {
                const netPay = this.dataManager.calculateNetPay(employee.grossSalary, employee.deductions);
                return `
                    <tr>
                        <td>${employee.id}</td>
                        <td>${employee.name}</td>
                        <td>${employee.contact}</td>
                        <td>KES ${employee.grossSalary.toLocaleString()}</td>
                        <td>KES ${employee.deductions.toLocaleString()}</td>
                        <td>KES ${netPay.toLocaleString()}</td>
                        <td>KES ${(employee.advance || 0).toLocaleString()}</td>
                        <td>${employee.payFrequency}</td>
                        <td>${employee.payMonth}</td>
                        <td>${employee.payDay}</td>
                        <td>
                            <div class="actions">
                                <button class="btn btn-sm btn-secondary" onclick="app.editEmployee('${employee.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-info" onclick="app.generatePayslip('${employee.id}')">
                                    <i class="fas fa-file-invoice"></i>
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="app.deleteEmployee('${employee.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading employees:', error);
            this.uiManager.showNotification('Error loading employees', 'error');
        }
    }

    openEmployeeModal(employeeId = null) {
        const title = document.getElementById('employeeModalTitle');
        title.textContent = employeeId ? 'Edit Employee' : 'Add Employee';

        // Clear form
        document.getElementById('employeeForm').reset();

        if (employeeId) {
            const employee = this.dataManager.getEmployees().find(emp => emp.id === employeeId);
            if (employee) {
                document.getElementById('employeeName').value = employee.name;
                document.getElementById('employeeContact').value = employee.contact;
                document.getElementById('employeeGrossSalary').value = employee.grossSalary;
                document.getElementById('employeeAllowances').value = employee.allowances || 0;
                document.getElementById('employeeDeductions').value = employee.deductions;
                document.getElementById('employeeAdvance').value = employee.advance || 0;
                document.getElementById('employeePayFrequency').value = employee.payFrequency;
                document.getElementById('employeePayMonth').value = employee.payMonth;
                document.getElementById('employeePayDay').value = employee.payDay;
            }
        }

        // Store employee ID for editing
        document.getElementById('employeeForm').dataset.editingId = employeeId || '';

        this.uiManager.showModal('employeeModal');
    }

    saveEmployee() {
        const employeeId = document.getElementById('employeeForm').dataset.editingId;
        const employee = {
            name: document.getElementById('employeeName').value,
            contact: document.getElementById('employeeContact').value,
            grossSalary: parseFloat(document.getElementById('employeeGrossSalary').value),
            allowances: parseFloat(document.getElementById('employeeAllowances').value) || 0,
            deductions: parseFloat(document.getElementById('employeeDeductions').value) || 0,
            advance: parseFloat(document.getElementById('employeeAdvance').value) || 0,
            payFrequency: document.getElementById('employeePayFrequency').value,
            payMonth: document.getElementById('employeePayMonth').value,
            payDay: document.getElementById('employeePayDay').value
        };

        if (employeeId) {
            this.dataManager.updateEmployee(employeeId, employee);
            this.uiManager.showNotification('Employee updated successfully!');
        } else {
            this.dataManager.addEmployee(employee);
            this.uiManager.showNotification('Employee added successfully!');
        }

        this.uiManager.hideModal('employeeModal');
        this.loadEmployees();
        this.loadDashboard(); // Refresh dashboard to show updated employee count
    }

    deleteEmployee(employeeId) {
        if (confirm('Are you sure you want to delete this employee?')) {
            this.dataManager.deleteEmployee(employeeId);
            this.uiManager.showNotification('Employee deleted successfully!');
            this.loadEmployees();
        }
    }

    generatePayslip(employeeId) {
        const employee = this.dataManager.getEmployees().find(emp => emp.id === employeeId);
        if (!employee) return;

        const payPeriod = prompt('Enter pay period (e.g., January 2024):');
        if (!payPeriod) return;

        const payslip = this.dataManager.generatePayslip(employee, payPeriod);
        this.showPayslipModal(payslip);
    }

    showPayslipModal(payslip) {
        const payslipHTML = this.generatePayslipHTML(payslip);
        document.getElementById('payslipContent').innerHTML = payslipHTML;
        this.uiManager.showModal('payslipModal');
    }

    generatePayslipHTML(payslip) {
        const settings = this.dataManager.getSettings();
        const now = new Date();
        
        return `
            <div class="payslip-header">
                <h2>${settings.businessName}</h2>
                <p>${settings.businessAddress}</p>
                <h3>PAYSLIP</h3>
                <p>Generated: ${now.toLocaleString('en-KE')}</p>
            </div>
            
            <div class="payslip-info">
                <div class="info-row">
                    <strong>Employee Name:</strong> ${payslip.employeeName}
                </div>
                <div class="info-row">
                    <strong>Employee ID:</strong> ${payslip.employeeId}
                </div>
                <div class="info-row">
                    <strong>Pay Period:</strong> ${payslip.payPeriod}
                </div>
                <div class="info-row">
                    <strong>Pay Frequency:</strong> ${payslip.payFrequency}
                </div>
            </div>
            
            <div class="payslip-earnings">
                <h4>EARNINGS</h4>
                <div class="payslip-row">
                    <span>Basic Salary:</span>
                    <span>KES ${payslip.grossSalary.toLocaleString()}</span>
                </div>
                ${payslip.allowances > 0 ? `
                <div class="payslip-row">
                    <span>Allowances:</span>
                    <span>KES ${payslip.allowances.toLocaleString()}</span>
                </div>
                ` : ''}
            </div>
            
            <div class="payslip-deductions">
                <h4>DEDUCTIONS</h4>
                <div class="payslip-row">
                    <span>PAYE (Tax):</span>
                    <span>KES ${payslip.paye.toLocaleString()}</span>
                </div>
                <div class="payslip-row">
                    <span>NSSF:</span>
                    <span>KES ${payslip.nssf.toLocaleString()}</span>
                </div>
                <div class="payslip-row">
                    <span>NHIF:</span>
                    <span>KES ${payslip.nhif.toLocaleString()}</span>
                </div>
                <div class="payslip-row">
                    <span>NITA:</span>
                    <span>KES ${payslip.nita.toLocaleString()}</span>
                </div>
                <div class="payslip-row">
                    <span>Housing Levy (1.5%):</span>
                    <span>KES ${payslip.housingLevy.toLocaleString()}</span>
                </div>
                <div class="payslip-row">
                    <span>Other Deductions:</span>
                    <span>KES ${payslip.deductions.toLocaleString()}</span>
                </div>
                <div class="payslip-row">
                    <span>Advance:</span>
                    <span>KES ${payslip.advance.toLocaleString()}</span>
                </div>
            </div>
            
            <div class="payslip-total">
                <div class="payslip-row">
                    <strong>TOTAL DEDUCTIONS:</strong>
                    <strong>KES ${payslip.totalDeductions.toLocaleString()}</strong>
                </div>
                <div class="payslip-row">
                    <strong>NET PAY:</strong>
                    <strong>KES ${payslip.netPay.toLocaleString()}</strong>
                </div>
            </div>
            
            <div class="payslip-footer">
                <p>This is a computer-generated payslip and does not require a signature.</p>
                <p>Generated by Business Management System</p>
            </div>
        `;
    }

    editEmployee(employeeId) {
        this.openEmployeeModal(employeeId);
    }

    printPayslip() {
        const payslipContent = document.getElementById('payslipContent').innerHTML;
        const settings = this.dataManager.getSettings();
        const now = new Date();
        
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Payslip - ${settings.businessName}</title>
                <style>
                    body { font-family: 'Courier New', monospace; margin: 0; padding: 20px; width: 300px; }
                    .payslip-header { text-align: center; margin-bottom: 20px; }
                    .payslip-header h2 { margin-bottom: 5px; font-size: 1.2em; }
                    .payslip-header h3 { margin: 10px 0; color: #3498db; }
                    .payslip-header p { margin: 2px 0; font-size: 0.9em; }
                    .payslip-info { margin: 15px 0; }
                    .info-row { margin-bottom: 5px; padding: 5px; background: #f5f5f5; border-radius: 3px; }
                    .payslip-earnings, .payslip-deductions { margin: 15px 0; }
                    .payslip-earnings h4, .payslip-deductions h4 { margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 5px; }
                    .payslip-row { display: flex; justify-content: space-between; margin-bottom: 5px; padding: 5px 0; border-bottom: 1px dotted #ccc; }
                    .payslip-total { margin-top: 15px; padding-top: 10px; border-top: 2px solid #000; font-weight: bold; font-size: 1.1em; background: #f5f5f5; padding: 10px; border-radius: 3px; }
                    .payslip-footer { margin-top: 20px; text-align: center; font-size: 0.8em; font-style: italic; }
                </style>
            </head>
            <body>
                ${payslipContent}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    downloadPayslip() {
        const payslipContent = document.getElementById('payslipContent').innerHTML;
        const settings = this.dataManager.getSettings();
        const now = new Date();
        
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Payslip - ${settings.businessName}</title>
                <style>
                    body { font-family: 'Courier New', monospace; margin: 0; padding: 20px; max-width: 400px; margin: 0 auto; }
                    .payslip-header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #000; padding-bottom: 15px; }
                    .payslip-header h2 { margin-bottom: 5px; font-size: 1.4em; font-weight: bold; }
                    .payslip-header h3 { margin: 10px 0; color: #3498db; font-size: 1.2em; }
                    .payslip-header p { margin: 3px 0; font-size: 0.9em; line-height: 1.3; }
                    .payslip-info { margin: 15px 0; }
                    .info-row { margin-bottom: 5px; padding: 8px; background: #f8f9fa; border-radius: 4px; display: flex; justify-content: space-between; }
                    .payslip-earnings, .payslip-deductions { margin: 20px 0; }
                    .payslip-earnings h4, .payslip-deductions h4 { margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 5px; font-size: 1.1em; }
                    .payslip-row { display: flex; justify-content: space-between; margin-bottom: 5px; padding: 5px 0; border-bottom: 1px dotted #ccc; }
                    .payslip-total { margin-top: 20px; padding-top: 15px; border-top: 2px solid #000; font-weight: bold; font-size: 1.2em; background: #f8f9fa; padding: 15px; border-radius: 4px; }
                    .payslip-footer { margin-top: 25px; text-align: center; font-size: 0.8em; line-height: 1.4; font-style: italic; color: #666; }
                </style>
            </head>
            <body>
                ${payslipContent}
                <div style="text-align: center; margin-top: 30px; font-size: 0.7em; color: #666;">
                    <p>--- This is a computer-generated payslip ---</p>
                    <p>Generated: ${now.toLocaleString('en-KE')}</p>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        
        setTimeout(() => {
            printWindow.print();
            setTimeout(() => {
                if (printWindow && !printWindow.closed) {
                    printWindow.close();
                }
            }, 1000);
        }, 200);
        
        this.uiManager.showNotification('Payslip downloaded successfully!');
    }
}

// Initialize the application
const app = new BusinessManagementSystem();

// Make app globally available for onclick handlers
window.app = app;