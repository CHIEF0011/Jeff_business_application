import { UIManager } from './uiManager.js';
import { DataManager } from './dataManager.js';

export class ReceiptManager extends UIManager {
    constructor() {
        super();
        this.dataManager = new DataManager();
        this.settings = this.dataManager.getSettings();
    }

    showReceipt(transaction) {
        const receiptHTML = this.generateReceiptHTML(transaction);
        document.getElementById('receiptContent').innerHTML = receiptHTML;
        this.showModal('receiptModal');
    }

    generateReceiptHTML(transaction) {
        const settings = this.settings;
        const now = new Date();
        const taxRate = settings.taxRate || 16;
        
        // Handle single item or multiple items
        const items = transaction.items || [transaction];
        const subtotal = items.reduce((sum, item) => sum + (item.subtotal || item.amount), 0);
        const taxAmount = (subtotal * taxRate) / 100;
        const total = subtotal + taxAmount;
        const receiptNumber = this.generateReceiptNumber();
        
        return `
            <div class="receipt-header">
                <h2>${settings.businessName || 'Business Management System'}</h2>
                <p>${settings.businessAddress || '123 Business Street, City, Country'}</p>
                <p>Tel: +254 700 000 000 | Email: info@business.com</p>
                <p>${now.toLocaleString('en-KE')}</p>
                ${transaction.customerName ? `<p>Customer: ${transaction.customerName}</p>` : ''}
                ${transaction.customerId ? `<p>Customer ID: ${transaction.customerId}</p>` : ''}
            </div>
            
            <div class="receipt-items">
                ${items.map(item => `
                    <div class="receipt-item">
                        <span><strong>${item.description || item.name}</strong></span>
                        <span>KES ${(item.subtotal || item.amount).toLocaleString()}</span>
                    </div>
                `).join('')}
                
                <div class="receipt-item">
                    <span><strong>Subtotal:</strong></span>
                    <span>KES ${subtotal.toLocaleString()}</span>
                </div>
                <div class="receipt-item">
                    <span><strong>VAT (${taxRate}%):</strong></span>
                    <span>KES ${taxAmount.toLocaleString()}</span>
                </div>
            </div>
            
            <div class="receipt-total">
                <div class="receipt-item">
                    <span><strong>TOTAL AMOUNT:</strong></span>
                    <span><strong>KES ${total.toLocaleString()}</strong></span>
                </div>
            </div>
            
            <div class="receipt-barcode">
                <div style="text-align: center; margin: 20px 0;">
                    <svg id="barcode"></svg>
                </div>
            </div>
            
            <div class="receipt-footer">
                <p>Thank you for your business!</p>
                <p>Receipt #${receiptNumber}</p>
            </div>
        `;
    }

    generateReceiptNumber() {
        return 'RCP-' + Date.now().toString(36).toUpperCase();
    }

    printReceipt() {
        const receiptContent = document.getElementById('receiptContent').innerHTML;
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt</title>
                <style>
                    body { font-family: 'Courier New', monospace; margin: 0; padding: 20px; width: 300px; }
                    .receipt-header { text-align: center; margin-bottom: 20px; }
                    .receipt-header h2 { margin-bottom: 5px; font-size: 1.2em; }
                    .receipt-header p { margin: 2px 0; font-size: 0.9em; }
                    .receipt-items { margin: 20px 0; }
                    .receipt-item { display: flex; justify-content: space-between; margin-bottom: 5px; }
                    .receipt-total { margin-top: 10px; padding-top: 10px; border-top: 2px solid #000; font-weight: bold; }
                    .receipt-footer { text-align: center; margin-top: 20px; font-size: 0.8em; }
                    .receipt-barcode { text-align: center; margin: 10px 0; }
                </style>
            </head>
            <body>
                ${receiptContent}
            </body>
            </html>
        `);
        printWindow.document.close();
        
        // Generate barcode after DOM is ready
        setTimeout(() => {
            if (printWindow.document.getElementById('barcode')) {
                JsBarcode(printWindow.document.getElementById('barcode'), this.generateReceiptNumber(), {
                    format: "CODE128",
                    width: 2,
                    height: 50,
                    displayValue: true
                });
            }
            printWindow.print();
        }, 100);
    }

    generateBarcode() {
        // Generate barcode on the receipt
        setTimeout(() => {
            const barcodeElement = document.getElementById('barcode');
            if (barcodeElement) {
                JsBarcode(barcodeElement, this.generateReceiptNumber(), {
                    format: "CODE128",
                    width: 2,
                    height: 50,
                    displayValue: true
                });
            }
        }, 100);
    }

    downloadReceipt() {
        const receiptContent = document.getElementById('receiptContent').innerHTML;
        const settings = this.settings;
        const now = new Date();
        
        // Create a new window for PDF generation
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt - ${settings.businessName}</title>
                <style>
                    body { 
                        font-family: 'Courier New', monospace; 
                        margin: 0; 
                        padding: 20px; 
                        max-width: 400px; 
                        margin: 0 auto;
                    }
                    .receipt-header { 
                        text-align: center; 
                        margin-bottom: 20px; 
                        border-bottom: 2px dashed #000;
                        padding-bottom: 15px;
                    }
                    .receipt-header h2 { 
                        margin-bottom: 5px; 
                        font-size: 1.4em; 
                        font-weight: bold;
                    }
                    .receipt-header p { 
                        margin: 3px 0; 
                        font-size: 0.9em; 
                        line-height: 1.3;
                    }
                    .receipt-items { 
                        margin: 20px 0; 
                        border-bottom: 2px dashed #000;
                        padding-bottom: 15px;
                    }
                    .receipt-item { 
                        display: flex; 
                        justify-content: space-between; 
                        margin-bottom: 8px;
                        font-size: 0.95em;
                    }
                    .receipt-total { 
                        margin-top: 15px; 
                        padding-top: 10px; 
                        font-weight: bold; 
                        font-size: 1.1em;
                    }
                    .receipt-footer { 
                        text-align: center; 
                        margin-top: 20px; 
                        font-size: 0.8em; 
                        line-height: 1.4;
                    }
                    .receipt-barcode { 
                        text-align: center; 
                        margin: 15px 0; 
                    }
                    @media print {
                        body { 
                            padding: 10px; 
                            max-width: none;
                        }
                        .no-print { 
                            display: none; 
                        }
                    }
                </style>
            </head>
            <body>
                ${receiptContent}
                <div style="text-align: center; margin-top: 30px; font-size: 0.7em; color: #666;">
                    <p>--- Thank you for your business! ---</p>
                    <p>Printed: ${now.toLocaleString('en-KE')}</p>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        
        // Generate barcode and trigger download
        setTimeout(() => {
            // Generate barcode
            const barcodeElement = printWindow.document.getElementById('barcode');
            if (barcodeElement) {
                JsBarcode(barcodeElement, this.generateReceiptNumber(), {
                    format: "CODE128",
                    width: 1.5,
                    height: 40,
                    displayValue: true,
                    fontSize: 10
                });
            }
            
            // Trigger download
            printWindow.print();
            
            // Close the window after printing
            setTimeout(() => {
                if (printWindow && !printWindow.closed) {
                    printWindow.close();
                }
            }, 1000);
        }, 200);
        
        this.showNotification('Receipt downloaded successfully!');
    }
}

