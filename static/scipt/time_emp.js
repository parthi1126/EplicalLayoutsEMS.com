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
document.addEventListener('DOMContentLoaded', function () {
    const userIcon = document.getElementById('user-icon');
    const profilePopup = document.getElementById('profilePopup');
    const closeBtn = document.getElementById('closePopup');

    // Show popup on user icon click
    userIcon.addEventListener('click', function (event) {
        event.stopPropagation(); // Prevent bubbling to window
        profilePopup.style.display = 'block';
    });

    // Close on close button
    closeBtn.addEventListener('click', function () {
        profilePopup.style.display = 'none';
    });

    // Close popup when clicking outside of it
    document.addEventListener('click', function (event) {
        if (
            profilePopup.style.display === 'block' &&
            !profilePopup.contains(event.target) &&
            event.target !== userIcon
        ) {
            profilePopup.style.display = 'none';
        }
    });
});


document.addEventListener('DOMContentLoaded', function() {
    // Tab functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            btn.classList.add('active');
            const tabId = btn.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Load tasks from server
    loadTasks();
});

async function loadTasks() {
    try {
        const response = await fetch('/get_tasks');
        const result = await response.json();
        
        if (result.status === 'success') {
            renderTasks(result.data);
        } else {
            showToast(result.message || 'Error loading tasks');
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        showToast('Network error loading tasks');
    }
}

function renderTasks(tasks) {
    const notStartedTasks = document.getElementById('not-started-tasks');
    const inProgressTasks = document.getElementById('in-progress-tasks');
    const completedTasks = document.getElementById('completed-tasks');
    
    // Clear existing content
    notStartedTasks.innerHTML = '';
    inProgressTasks.innerHTML = '';
    completedTasks.innerHTML = '';
    
    // Group tasks by status
    const notStarted = tasks.filter(task => task.status.toLowerCase() === 'not started');
    const inProgress = tasks.filter(task => task.status.toLowerCase() === 'in progress');
    const completed = tasks.filter(task => task.status.toLowerCase() === 'completed');
    
    // Render not started tasks
    notStarted.forEach(task => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${task.date}</td>
            <td>
                <div class="project-cell">
                    <div class="project-icon">
                        <i class="fas fa-project-diagram"></i>
                    </div>
                    <div>
                        <div class="bold">${task.project}</div>
                        <div class="task-details">${task.details || 'No details available'}</div>
                    </div>
                </div>
            </td>
            <td>${task.details || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-start" onclick="startTask('${task.date}', '${task.project}')">
                        <i class="fas fa-play"></i> Start
                    </button>
                </div>
            </td>
        `;
        notStartedTasks.appendChild(row);
    });
    
    // Render in progress tasks
    inProgress.forEach(task => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${task.date}</td>
            <td>
                <div class="project-cell">
                    <div class="project-icon">
                        <i class="fas fa-project-diagram"></i>
                    </div>
                    <div>
                        <div class="bold">${task.project}</div>
                        <div class="task-details">${task.details || 'No details available'}</div>
                    </div>
                </div>
            </td>
            <td>${task.details || '-'}</td>
            <td>${task.start_time || '-'}</td>
            <td class="duration">${task.duration || calculateDuration(task.start_time)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-complete" onclick="completeTask('${task.date}', '${task.project}')">
                        <i class="fas fa-check"></i> Complete
                    </button>
                </div>
            </td>
        `;
        inProgressTasks.appendChild(row);
    });
    
    // Render completed tasks
    completed.forEach(task => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${task.date}</td>
            <td>
                <div class="project-cell">
                    <div class="project-icon">
                        <i class="fas fa-project-diagram"></i>
                    </div>
                    <div>
                        <div class="bold">${task.project}</div>
                        <div class="task-details">${task.details || 'No details available'}</div>
                    </div>
                </div>
            </td>
            <td>${task.details || '-'}</td>
            <td class="duration">${task.duration || '0h 0m'}</td>
            <td>
                <span class="status-badge status-completed">
                    <i class="fas fa-check-circle"></i> Completed
                </span>
            </td>
        `;
        completedTasks.appendChild(row);
    });
}

// Rest of your frontend code remains the same...
function calculateDuration(startTime) {
    if (!startTime) return '0h 0m';
    
    try {
        const start = new Date(`2000-01-01T${startTime}`);
        const now = new Date();
        const diffMs = now - start;
        
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
    } catch (e) {
        return '0h 0m';
    }
}

async function startTask(date, project) {
    const btn = event.target.closest('button');
    const originalHTML = btn.innerHTML;
    
    try {
        // Show loading state
        btn.innerHTML = '<i class="fas fa-spinner loading-spinner"></i> Starting...';
        btn.disabled = true;
        
        const response = await fetch('/start_task', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ date, project })
        });
        
        const result = await response.json();
        if (result.status === 'success') {
            showToast('Task started successfully');
            loadTasks(); // Refresh the task list
        } else {
            showToast(result.message || 'Error starting task');
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Network error starting task');
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
}

async function completeTask(date, project) {
    const btn = event.target.closest('button');
    const originalHTML = btn.innerHTML;
    
    try {
        // Show loading state
        btn.innerHTML = '<i class="fas fa-spinner loading-spinner"></i> Completing...';
        btn.disabled = true;
        
        const response = await fetch('/complete_task', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ date, project })
        });
        
        const result = await response.json();
        if (result.status === 'success') {
            showToast('Task completed successfully');
            loadTasks(); // Refresh the task list
        } else {
            showToast(result.message || 'Error completing task');
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Network error completing task');
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}