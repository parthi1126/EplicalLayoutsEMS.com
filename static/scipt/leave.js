// Calendar functionality
document.addEventListener('DOMContentLoaded', function() {
    let currentDate = new Date();
    const holidays = [
        { name: "New Year's Day", date: new Date(currentDate.getFullYear(), 0, 1) },
        { name: "Independence Day", date: new Date(currentDate.getFullYear(), 6, 4) },
        { name: "Christmas Day", date: new Date(currentDate.getFullYear(), 11, 25) },
    ];
    
    renderCalendar(currentDate, holidays);
    
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate, holidays);
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate, holidays);
    });
});

function renderCalendar(date, holidays) {
    const monthYear = document.getElementById('monthYear');
    const calendarGrid = document.getElementById('calendar');
    const holidaysTable = document.getElementById('holidaysTableBody');
    
    // Clear existing days (keeping day headers)
    while (calendarGrid.children.length > 7) {
        calendarGrid.removeChild(calendarGrid.lastChild);
    }
    
    // Set month/year title
    monthYear.textContent = new Intl.DateTimeFormat('en-US', { 
        month: 'long', 
        year: 'numeric' 
    }).format(date);
    
    // Get first day of month and total days
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    // Add empty cells for days before first day of month
    for (let i = 0; i < startingDay; i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        calendarGrid.appendChild(dayElement);
    }
    
    // Add days of month
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
        const dayElement = document.createElement('div');
        const dayDate = new Date(date.getFullYear(), date.getMonth(), i);
        
        dayElement.className = 'calendar-day';
        if (i === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) {
            dayElement.classList.add('current-day');
        }
        
        dayElement.innerHTML = `<div class="day-number">${i}</div>`;
        
        // Check if this day is a holiday
        const dayHolidays = holidays.filter(holiday => 
            holiday.date.getDate() === i &&
            holiday.date.getMonth() === date.getMonth() &&
            holiday.date.getFullYear() === date.getFullYear()
        );
        
        if (dayHolidays.length > 0) {
            dayElement.innerHTML += `<div class="holiday-marker"></div>`;
            dayHolidays.forEach(holiday => {
                dayElement.innerHTML += `<div class="holiday-event">${holiday.name}</div>`;
            });
        }
        
        calendarGrid.appendChild(dayElement);
    }
    
    // Filter holidays for current month only
    const currentMonthHolidays = holidays.filter(holiday => 
        holiday.date.getMonth() === date.getMonth() &&
        holiday.date.getFullYear() === date.getFullYear()
    );
    
    // Populate holidays table
    holidaysTable.innerHTML = '';
    currentMonthHolidays.forEach(holiday => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${holiday.date.getDate()} ${new Intl.DateTimeFormat('en-US', { month: 'short' }).format(holiday.date)}</td>
            <td>${holiday.name}</td>
        `;
        holidaysTable.appendChild(row);
    });
    
    if (currentMonthHolidays.length === 0) {
        holidaysTable.innerHTML = '<tr><td colspan="2">No holidays this month</td></tr>';
    }
}

// Leave Popup Functions
function openLeavePopup() {
    document.getElementById('leavePopupOverlay').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeLeavePopup() {
    document.getElementById('leavePopupOverlay').style.display = 'none';
    document.body.style.overflow = '';
}

// Close popup when clicking outside the form
document.getElementById('leavePopupOverlay').addEventListener('click', function(e) {
    if (e.target === this) {
        closeLeavePopup();
    }
});

// Prevent form from closing when clicking inside it
document.querySelector('.leave-application-container').addEventListener('click', function(e) {
    e.stopPropagation();
});