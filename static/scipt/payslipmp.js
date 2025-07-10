// Global variables
let pendingRequests = [];
let requestIdCounter = 1;

// DOM Elements
const payslipForm = document.getElementById('payslipForm');
const monthSelect = document.getElementById('month');
const yearSelect = document.getElementById('year');
const pendingTableBody = document.getElementById('pendingTableBody');
const toast = document.getElementById('toast');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    updatePendingTable();
});

// Event Listeners
function setupEventListeners() {
    payslipForm.addEventListener('submit', handleFormSubmit);
}

// Form submission handler
function handleFormSubmit(event) {
    event.preventDefault();
    
    const month = monthSelect.value;
    const year = yearSelect.value;
    
    // Validation
    if (!month || !year) {
        showToast('Please select both month and year', 'error');
        return;
    }
    
    // Check for duplicate requests
    const isDuplicate = pendingRequests.some(request => 
        request.month === month && request.year === year
    );
    
    if (isDuplicate) {
        showToast('A request for this period is already pending', 'error');
        return;
    }
    
    // Create new request
    const newRequest = {
        id: requestIdCounter++,
        employeeName: 'John Doe', // Hardcoded for demo
        month: month,
        year: year,
        requestDate: formatDate(new Date()),
        status: 'Pending'
    };
    
    // Add to pending requests
    pendingRequests.unshift(newRequest);
    
    // Update UI
    updatePendingTable();
    resetForm();
    showToast(`Payslip request for ${month} ${year} has been submitted successfully!`);
    
    // Simulate admin approval after 5 seconds
    setTimeout(() => {
        simulateAdminApproval(newRequest.id);
    }, 5000);
}

// Reset form
function resetForm() {
    monthSelect.value = '';
    yearSelect.value = '';
}

// Update pending requests table
function updatePendingTable() {
    if (pendingRequests.length === 0) {
        pendingTableBody.innerHTML = `
            <tr class="empty-state">
                <td colspan="4">
                    <div class="empty-message">
                        <i class="fas fa-inbox"></i>
                        <p>No pending requests</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    const tableHTML = pendingRequests.map(request => `
        <tr>
            <td><strong>${request.employeeName}</strong></td>
            <td>${request.month} ${request.year}</td>
            <td>${request.requestDate}</td>
            <td>
                <span class="status-badge">
                    <i class="fas fa-clock"></i>
                    ${request.status}
                </span>
            </td>
        </tr>
    `).join('');
    
    pendingTableBody.innerHTML = tableHTML;
}

// Simulate admin approval
function simulateAdminApproval(requestId) {
    const requestIndex = pendingRequests.findIndex(req => req.id === requestId);
    
    if (requestIndex !== -1) {
        const approvedRequest = pendingRequests[requestIndex];
        
        // Remove from pending
        pendingRequests.splice(requestIndex, 1);
        
        // Add to received payslips table
        addToReceivedPayslips(approvedRequest);
        
        // Update pending table
        updatePendingTable();
        
        // Show notification
        showToast(`Your payslip for ${approvedRequest.month} ${approvedRequest.year} has been approved and is ready for download!`);
    }
}

// Add to received payslips table
function addToReceivedPayslips(request) {
    const receivedTableBody = document.getElementById('receivedTableBody');
    
    // Create new row
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${request.month} ${request.year}</td>
        <td>${formatDate(new Date())}</td>
        <td>
            <button class="btn btn-download" onclick="downloadPayslip('${request.month} ${request.year}')">
                <i class="fas fa-download"></i>
                Download
            </button>
        </td>
    `;
    
    // Insert at the beginning
    receivedTableBody.insertBefore(newRow, receivedTableBody.firstChild);
}

// Download payslip function
function downloadPayslip(monthYear) {
    showToast(`Downloading payslip for ${monthYear}...`);
    
    // Simulate download process
    setTimeout(() => {
        showToast(`Payslip for ${monthYear} downloaded successfully!`);
        
        // In a real application, you would trigger an actual file download here
        // For demo purposes, we'll just log it
        console.log(`Download initiated for payslip: ${monthYear}`);
        
        // You could also create a dummy download like this:
        // const link = document.createElement('a');
        // link.href = 'data:text/plain;charset=utf-8,Payslip for ' + monthYear;
        // link.download = `payslip_${monthYear.replace(' ', '_')}.txt`;
        // link.click();
    }, 1000);
}

// Toast notification function
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    // Hide toast after 4 seconds
    setTimeout(() => {
        toast.className = 'toast';
    }, 4000);
}

// Utility function to format date
function formatDate(date) {
    const options = { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    };
    return date.toLocaleDateString('en-CA'); // Returns YYYY-MM-DD format
}

// Utility function to get current date in readable format
function getCurrentDate() {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return new Date().toLocaleDateString('en-US', options);
}

// Additional functionality for demo purposes
function addSamplePendingRequest() {
    const sampleRequest = {
        id: requestIdCounter++,
        employeeName: 'John Doe',
        month: 'December',
        year: '2024',
        requestDate: formatDate(new Date()),
        status: 'Pending'
    };
    
    pendingRequests.push(sampleRequest);
    updatePendingTable();
    showToast('Sample pending request added for demonstration');
}

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Alt + R to focus on request form
    if (event.altKey && event.key === 'r') {
        event.preventDefault();
        monthSelect.focus();
    }
    
    // Escape to close toast
    if (event.key === 'Escape') {
        toast.className = 'toast';
    }
});

// Add some animation delays for smoother UX
function animateTableRows() {
    const rows = document.querySelectorAll('.data-table tbody tr');
    rows.forEach((row, index) => {
        row.style.opacity = '0';
        row.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            row.style.transition = 'all 0.3s ease';
            row.style.opacity = '1';
            row.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Call animation when page loads
window.addEventListener('load', () => {
    setTimeout(animateTableRows, 500);
});

// Handle responsive table scrolling on mobile
function handleResponsiveTable() {
    const tables = document.querySelectorAll('.table-container');
    
    tables.forEach(table => {
        if (table.scrollWidth > table.clientWidth) {
            table.style.borderLeft = '3px solid #3b82f6';
            table.style.borderRight = '3px solid #3b82f6';
        }
    });
}

// Check responsive tables on resize
window.addEventListener('resize', handleResponsiveTable);
window.addEventListener('load', handleResponsiveTable);