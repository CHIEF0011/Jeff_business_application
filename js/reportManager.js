import { UIManager } from './uiManager.js';
import { DataManager } from './dataManager.js';

export class ReportManager extends UIManager {
    constructor() {
        super();
        this.dataManager = new DataManager();
    }

    generateReport(type, startDate, endDate = null) {
        const settings = this.dataManager.getSettings();
        let actualStartDate, actualEndDate;
        
        if (type === 'custom') {
            actualStartDate = new Date(startDate);
            actualEndDate = new Date(endDate);
        } else {
            const dates = this.getDateRange(type, startDate);
            actualStartDate = dates.startDate;
            actualEndDate = dates.endDate;
        }
        
        const transactions = this.dataManager.getTransactions({
            startDate: actualStartDate.toISOString(),
            endDate: actualEndDate.toISOString()
        });

        const summary = this.generateSummary(transactions);
        
        return `
            <div class="report-header">
                <h3>${type.charAt(0).toUpperCase() + type.slice(1)} Sales Report</h3>
                <p>Period: ${actualStartDate.toLocaleDateString()} - ${actualEndDate.toLocaleDateString()}</p>
                <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="report-summary">
                <div class="summary-cards">
                    <div class="summary-card">
                        <h4>Total Revenue</h4>
                        <p class="summary-value">${this.formatCurrency(summary.totalRevenue)}</p>
                    </div>
                    <div class="summary-card">
                        <h4>Total Transactions</h4>
                        <p class="summary-value">${summary.totalTransactions}</p>
                    </div>
                    <div class="summary-card">
                        <h4>Average Transaction</h4>
                        <p class="summary-value">${this.formatCurrency(summary.averageTransaction)}</p>
                    </div>
                </div>
            </div>
            
            <div class="report-breakdown">
                <h4>Revenue by Business</h4>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Business</th>
                            <th>Revenue</th>
                            <th>Transactions</th>
                            <th>Average</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Guest House</td>
                            <td>${this.formatCurrency(summary.guesthouseRevenue)}</td>
                            <td>${summary.guesthouseTransactions}</td>
                            <td>${this.formatCurrency(summary.guesthouseAverage)}</td>
                        </tr>
                        <tr>
                            <td>Butchery</td>
                            <td>${this.formatCurrency(summary.butcheryRevenue)}</td>
                            <td>${summary.butcheryTransactions}</td>
                            <td>${this.formatCurrency(summary.butcheryAverage)}</td>
                        </tr>
                        <tr>
                            <td>Workshop</td>
                            <td>${this.formatCurrency(summary.workshopRevenue)}</td>
                            <td>${summary.workshopTransactions}</td>
                            <td>${this.formatCurrency(summary.workshopAverage)}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr style="font-weight: bold; background-color: #f5f5f5;">
                            <td>TOTAL</td>
                            <td>${this.formatCurrency(summary.guesthouseRevenue + summary.butcheryRevenue + summary.workshopRevenue)}</td>
                            <td>${summary.guesthouseTransactions + summary.butcheryTransactions + summary.workshopTransactions}</td>
                            <td>${this.formatCurrency((summary.guesthouseRevenue + summary.butcheryRevenue + summary.workshopRevenue) / (summary.guesthouseTransactions + summary.butcheryTransactions + summary.workshopTransactions))}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            <div class="report-transactions">
                <h4>Recent Transactions</h4>
                <table class="report-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Description</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${transactions.slice(0, 10).map(t => `
                            <tr>
                                <td>${new Date(t.date).toLocaleDateString()}</td>
                                <td>${t.description}</td>
                                <td>${this.formatCurrency(t.amount)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr style="font-weight: bold; background-color: #f5f5f5;">
                            <td colspan="2">TOTAL</td>
                            <td>${this.formatCurrency(transactions.slice(0, 10).reduce((sum, t) => sum + t.amount, 0))}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    }

    getDateRange(type, date) {
        const baseDate = new Date(date);
        let startDate, endDate;

        switch(type) {
            case 'daily':
                startDate = new Date(baseDate.setHours(0, 0, 0, 0));
                endDate = new Date(baseDate.setHours(23, 59, 59, 999));
                break;
            case 'weekly':
                const day = baseDate.getDay();
                startDate = new Date(baseDate);
                startDate.setDate(baseDate.getDate() - day);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'monthly':
                startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
                endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0, 23, 59, 59, 999);
                break;
            default:
                startDate = new Date(baseDate.setHours(0, 0, 0, 0));
                endDate = new Date(baseDate.setHours(23, 59, 59, 999));
        }

        return { startDate, endDate };
    }

    generateSummary(transactions) {
        const guesthouse = transactions.filter(t => t.type === 'guesthouse');
        const butchery = transactions.filter(t => t.type === 'butchery');
        const workshop = transactions.filter(t => t.type === 'workshop');

        return {
            totalRevenue: transactions.reduce((sum, t) => sum + t.amount, 0),
            totalTransactions: transactions.length,
            averageTransaction: transactions.length ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length : 0,
            guesthouseRevenue: guesthouse.reduce((sum, t) => sum + t.amount, 0),
            guesthouseTransactions: guesthouse.length,
            guesthouseAverage: guesthouse.length ? guesthouse.reduce((sum, t) => sum + t.amount, 0) / guesthouse.length : 0,
            butcheryRevenue: butchery.reduce((sum, t) => sum + t.amount, 0),
            butcheryTransactions: butchery.length,
            butcheryAverage: butchery.length ? butchery.reduce((sum, t) => sum + t.amount, 0) / butchery.length : 0,
            workshopRevenue: workshop.reduce((sum, t) => sum + t.amount, 0),
            workshopTransactions: workshop.length,
            workshopAverage: workshop.length ? workshop.reduce((sum, t) => sum + t.amount, 0) / workshop.length : 0
        };
    }

    formatCurrency(amount) {
        const settings = this.dataManager.getSettings();
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: settings.currency || 'KES'
        }).format(amount);
    }
}