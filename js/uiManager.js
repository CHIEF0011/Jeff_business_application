export class UIManager {
    constructor() {
        this.notifications = [];
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class=\"fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}\"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showLoading(elementId, show = true) {
        const element = document.getElementById(elementId);
        if (element) {
            if (show) {
                element.innerHTML = '<div class=\"spinner\"></div>';
            } else {
                element.innerHTML = '';
            }
        }
    }

    formatCurrency(amount, currency = 'KES') {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    formatDate(date, format = 'short') {
        const options = format === 'short' 
            ? { year: 'numeric', month: 'short', day: 'numeric' }
            : { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };

        return new Date(date).toLocaleDateString('en-KE', options);
    }
}