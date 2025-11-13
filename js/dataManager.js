export class DataManager {
    constructor() {
        this.settings = this.loadSettings();
        this.transactions = this.loadData('transactions') || [];
        this.customers = this.loadData('customers') || [];
        this.guesthouseRooms = this.loadData('guesthouseRooms') || this.getDefaultGuesthouseRooms();
        this.butcheryProducts = this.loadData('butcheryProducts') || this.getDefaultButcheryProducts();
        this.workshopServices = this.loadData('workshopServices') || this.getDefaultWorkshopServices();
        this.workshopProducts = this.loadData('workshopProducts') || this.getDefaultWorkshopProducts();
    }

    // Settings management
    loadSettings() {
        const saved = localStorage.getItem('businessSettings');
        return saved ? JSON.parse(saved) : this.getDefaultSettings();
    }

    saveSettings(settings) {
        this.settings = settings;
        localStorage.setItem('businessSettings', JSON.stringify(settings));
    }

    getSettings() {
        return this.settings;
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
                workshopColor: '#34495e'
            }
        };
    }

    // Customer management
    addCustomer(customer) {
        customer.id = this.generateId();
        customer.createdAt = new Date().toISOString();
        this.customers.unshift(customer);
        this.saveData('customers', this.customers);
    }

    getCustomers() {
        return this.customers;
    }

    getCustomer(id) {
        return this.customers.find(customer => customer.id === id);
    }

    getCustomerSelectOptions() {
        return this.customers.map(customer => ({
            value: customer.id,
            text: `${customer.name} - ${customer.phone}`
        }));
    }

    // Workshop products
    getDefaultWorkshopProducts() {
        return [
            { id: '1', name: 'Metal Bed', price: 8000, category: 'Furniture' },
            { id: '2', name: 'Curio Table', price: 12000, category: 'Furniture' },
            { id: '3', name: 'Metal Chair', price: 2500, category: 'Furniture' }
        ];
    }

    getWorkshopProducts() {
        return this.workshopProducts;
    }

    addWorkshopProduct(product) {
        product.id = this.generateId();
        product.createdAt = new Date().toISOString();
        this.workshopProducts.push(product);
        this.saveData('workshopProducts', this.workshopProducts);
    }

    deleteWorkshopProduct(productId) {
        this.workshopProducts = this.workshopProducts.filter(p => p.id !== productId);
        this.saveData('workshopProducts', this.workshopProducts);
    }

    // Data persistence
    loadData(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    saveData(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    // Transactions
    addTransaction(transaction) {
        transaction.id = this.generateId();
        transaction.date = new Date().toISOString();
        this.transactions.unshift(transaction);
        this.saveData('transactions', this.transactions);
    }

    getTransactions(filter = {}) {
        let filtered = [...this.transactions];

        if (filter.type) {
            filtered = filtered.filter(t => t.type === filter.type);
        }

        if (filter.startDate) {
            filtered = filtered.filter(t => new Date(t.date) >= new Date(filter.startDate));
        }

        if (filter.endDate) {
            filtered = filtered.filter(t => new Date(t.date) <= new Date(filter.endDate));
        }

        return filtered;
    }

    getTodayRevenue() {
        const today = new Date().toDateString();
        const todayTransactions = this.transactions.filter(t => 
            new Date(t.date).toDateString() === today
        );

        return {
            guesthouse: todayTransactions.filter(t => t.type === 'guesthouse')
                .reduce((sum, t) => sum + t.amount, 0),
            butchery: todayTransactions.filter(t => t.type === 'butchery')
                .reduce((sum, t) => sum + t.amount, 0),
            workshop: todayTransactions.filter(t => t.type === 'workshop')
                .reduce((sum, t) => sum + t.amount, 0)
        };
    }

    getRecentTransactions(limit = 10) {
        return this.transactions.slice(0, limit);
    }

    // Guest House
    getDefaultGuesthouseRooms() {
        return [
            { id: '1', roomNumber: '101', roomType: 'Single', pricePerNight: 2500, status: 'Available' },
            { id: '2', roomNumber: '102', roomType: 'Double', pricePerNight: 3500, status: 'Available' },
            { id: '3', roomNumber: '201', roomType: 'Suite', pricePerNight: 5000, status: 'Available' }
        ];
    }

    getGuesthouseRooms() {
        return this.guesthouseRooms;
    }

    getGuesthouseRoom(id) {
        return this.guesthouseRooms.find(room => room.id === id);
    }

    addGuesthouseRoom(room) {
        room.id = this.generateId();
        this.guesthouseRooms.push(room);
        this.saveData('guesthouseRooms', this.guesthouseRooms);
    }

    updateRoomStatus(roomId, status) {
        const room = this.guesthouseRooms.find(r => r.id === roomId);
        if (room) {
            room.status = status;
            this.saveData('guesthouseRooms', this.guesthouseRooms);
        }
    }

    // Butchery
    getDefaultButcheryProducts() {
        return [
            { id: '1', name: 'Beef', pricePerKg: 600, stock: 100 },
            { id: '2', name: 'Chicken', pricePerKg: 400, stock: 50 },
            { id: '3', name: 'Mutton', pricePerKg: 700, stock: 30 }
        ];
    }

    getButcheryProducts() {
        return this.butcheryProducts;
    }

    getButcheryProduct(id) {
        return this.butcheryProducts.find(product => product.id === id);
    }

    addButcheryProduct(product) {
        product.id = this.generateId();
        this.butcheryProducts.push(product);
        this.saveData('butcheryProducts', this.butcheryProducts);
    }

    updateProductStock(productId, stock) {
        const product = this.butcheryProducts.find(p => p.id === productId);
        if (product) {
            product.stock = stock;
            this.saveData('butcheryProducts', this.butcheryProducts);
        }
    }

    reduceProductStock(productId, quantity) {
        const product = this.butcheryProducts.find(p => p.id === productId);
        if (product && product.stock >= quantity) {
            product.stock -= quantity;
            this.saveData('butcheryProducts', this.butcheryProducts);
            return true;
        }
        return false;
    }

    // Workshop
    getDefaultWorkshopServices() {
        return [
            { id: '1', name: 'Oil Change', price: 1500, duration: 1 },
            { id: '2', name: 'Brake Service', price: 3000, duration: 2 },
            { id: '3', name: 'Engine Tune-up', price: 5000, duration: 3 }
        ];
    }

    getWorkshopServices() {
        return this.workshopServices;
    }

    getWorkshopService(id) {
        return this.workshopServices.find(service => service.id === id);
    }

    addWorkshopService(service) {
        service.id = this.generateId();
        this.workshopServices.push(service);
        this.saveData('workshopServices', this.workshopServices);
    }

    // Generic item management
    addItem(business, item) {
        switch(business) {
            case 'guesthouse':
                this.addGuesthouseRoom(item);
                break;
            case 'butchery':
                this.addButcheryProduct(item);
                break;
            case 'workshop':
                if (item.type === 'service') {
                    this.addWorkshopService(item);
                } else {
                    this.addWorkshopProduct(item);
                }
                break;
        }
    }

    deleteItem(business, itemId) {
        switch(business) {
            case 'guesthouse':
                this.guesthouseRooms = this.guesthouseRooms.filter(item => item.id !== itemId);
                this.saveData('guesthouseRooms', this.guesthouseRooms);
                break;
            case 'butchery':
                this.butcheryProducts = this.butcheryProducts.filter(item => item.id !== itemId);
                this.saveData('butcheryProducts', this.butcheryProducts);
                break;
            case 'workshop':
                this.workshopServices = this.workshopServices.filter(item => item.id !== itemId);
                this.saveData('workshopServices', this.workshopServices);
                break;
        }
    }

    // Sales tracking
    getSales() {
        return this.loadData('sales') || [];
    }

    addSale(sale) {
        sale.id = this.generateId();
        sale.date = new Date().toISOString();
        this.sales = this.getSales();
        this.sales.unshift(sale);
        this.saveData('sales', this.sales);
    }

    getSalesByCustomer(customerId) {
        return this.getSales().filter(sale => sale.customerId === customerId);
    }

    getAllSales() {
        return this.getSales();
    }

    // Utility
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}