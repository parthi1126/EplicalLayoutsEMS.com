// ----------------------
// 1. Chart.js Dashboard
// ----------------------
const side=document.getElementById('side-bar')
let count=0
function menu(){
    count++
    if (count%2==1){
        side.style.display='flex'
    }
    else{
        side.style.display="none"
    }
}
// Dark mode toggle



document.addEventListener('DOMContentLoaded', function() {
    const userIcon = document.getElementById('user-icon');
    const profilePopup = document.getElementById('profilePopup');
    const closePopup = document.getElementById('closePopup');
    
    // Toggle popup when user icon is clicked
    userIcon.addEventListener('click', function(e) {
        e.stopPropagation();
        profilePopup.style.display = profilePopup.style.display === 'block' ? 'none' : 'block';
    });
    
    // Close popup when close button is clicked
    closePopup.addEventListener('click', function() {
        profilePopup.style.display = 'none';
    });
    
    // Close popup when clicking outside
    document.addEventListener('click', function(e) {
        if (!profilePopup.contains(e.target) && e.target !== userIcon) {
            profilePopup.style.display = 'none';
        }
    });
});
const ctx = document.getElementById('leaveChart').getContext('2d');
new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['Earned', 'Sick', 'Casual'],
    datasets: [{
      label: 'Leave Requests',
      data: [4, 2, 3],
      backgroundColor: ['#3b82f6', '#f59e0b', '#10b981']
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: false } }
  }
});

// ---------------------------
// 2. Approve / Reject Logic
// ---------------------------
document.querySelectorAll('.approve').forEach(btn => {
  btn.addEventListener('click', () => {
    const row = btn.closest('tr');
    updateStatus(row, 'approved', '#d1fae5', '#065f46');
    disableActions(row);
    showToast('Leave approved ✅');
  });
});

document.querySelectorAll('.reject').forEach(btn => {
  btn.addEventListener('click', () => {
    const row = btn.closest('tr');
    updateStatus(row, 'rejected', '#fee2e2', '#991b1b');
    disableActions(row);
    showToast('Leave rejected ❌');
  });
});

function updateStatus(row, text, bgColor, color) {
  const statusBadge = row.querySelector('.badge.yellow');
  statusBadge.textContent = text;
  statusBadge.style.background = bgColor;
  statusBadge.style.color = color;
}

function disableActions(row) {
  row.querySelectorAll('button').forEach(btn => {
    btn.disabled = true;
    btn.style.opacity = 0.5;
    btn.style.cursor = 'not-allowed';
  });
}

// ----------------------
// 3. Live Search + Filter
// ----------------------
document.getElementById('searchInput').addEventListener('input', filterTable);
document.getElementById('statusFilter').addEventListener('change', filterTable);

function filterTable() {
  const searchVal = document.getElementById('searchInput').value.toLowerCase();
  const statusVal = document.getElementById('statusFilter').value.toLowerCase();
  const rows = document.querySelectorAll('#leaveTableBody tr');

  rows.forEach(row => {
    const name = row.cells[0].textContent.toLowerCase();
    const status = row.cells[4].textContent.toLowerCase();
    const matchSearch = name.includes(searchVal);
    const matchStatus = statusVal === '' || status === statusVal;
    row.style.display = matchSearch && matchStatus ? '' : 'none';
  });
}

// -----------------
// 4. Toast Message
// -----------------
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => toast.style.display = 'none', 2000);
}

// -----------------------
// 5. FullCalendar Events
// -----------------------
document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendar');
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    height: 550,
    events: [
      // Sample leaves
      {
        title: 'Alexandra – Vacation',
        start: '2024-02-15',
        end: '2024-02-21',
        color: '#10b981'
      },
      // Public holidays
      {
        title: 'Republic Day',
        start: '2024-01-26',
        color: '#ef4444'
      }
    ]
  });
  calendar.render();
});

// ---------------------------
// 6. Floating Action Button
// ---------------------------
document.getElementById('fab').addEventListener('click', () => {
  alert('FAB clicked! You can add holiday, export, or create request.');
});

// ---------------------------
// 7. Export to CSV
// ---------------------------
function exportTableToCSV() {
  const rows = document.querySelectorAll("table tr");
  let csv = [];
  rows.forEach(row => {
    let cols = row.querySelectorAll("td, th");
    let rowData = Array.from(cols).map(col => `"${col.innerText.trim()}"`).join(",");
    csv.push(rowData);
  });

  const blob = new Blob([csv.join("\n")], { type: 'text/csv' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "leave-report.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Example usage: call exportTableToCSV(); on FAB or button click
