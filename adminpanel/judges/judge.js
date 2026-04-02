// judge.js - Fixed version
document.addEventListener('DOMContentLoaded', function() {
    loadJudges();

    // Add judge button
    document.getElementById('addJudgeBtn').addEventListener('click', function() {
        const addModal = new bootstrap.Modal(document.getElementById('addJudgeModal'));
        addModal.show();
    });

    // Add judge form submission
    document.getElementById('addJudgeForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addJudge();
    });
});

function loadJudges() {
    fetch('get_judges.php')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('judgesTable');
            tableBody.innerHTML = '';

            data.forEach(judge => {
                const row = document.createElement('tr');
                
                // Determine status display based on is_active value
                const statusClass = judge.is_active == 1 ? 'status-active' : 'status-inactive';
                const statusText = judge.is_active == 1 ? 'Online' : 'Offline';
                
                // Show force logout button - always visible but disabled when offline
                const forceLogoutButton = judge.is_active == 1 
                    ? `<button class="btn btn-sm btn-warning" onclick="forceLogout(${judge.id})" title="Force Logout">
                         <i class='bx bx-log-out'></i>
                       </button>`
                    : `<button class="btn btn-sm btn-warning" disabled title="Judge is Offline">
                         <i class='bx bx-log-out'></i>
                       </button>`;

                row.innerHTML = `
                    <td>${judge.username}</td>
                    <td>${judge.name}</td>
                    <td>
                        <span class="${statusClass}"></span>
                        ${statusText}
                    </td>
                    <td>
                        ${forceLogoutButton}
                        <button class="btn btn-sm btn-danger ms-2" onclick="deleteJudge(${judge.id})" title="Delete Judge">
                            <i class='bx bx-trash'></i>
                        </button>
                    </td>
                `;
                
                tableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error loading judges:', error);
            showNotification('Error loading judges: ' + error.message, 'danger');
        });
}

function addJudge() {
    const judgeName = document.getElementById('judgeName').value.trim();
    
    if (!judgeName) {
        alert('Please enter a judge name');
        return;
    }

    const formData = new FormData();
    formData.append('judge_name', judgeName);

    fetch('add_judge.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification(data.message, 'success');
            document.getElementById('judgeName').value = '';
            const addModal = bootstrap.Modal.getInstance(document.getElementById('addJudgeModal'));
            addModal.hide();
            loadJudges(); // Reload the table
        } else {
            showNotification(data.message, 'danger');
        }
    })
    .catch(error => {
        console.error('Error adding judge:', error);
        showNotification('Error adding judge: ' + error.message, 'danger');
    });
}

function forceLogout(judgeId) {
    // Show confirmation modal
    const confirmModal = new bootstrap.Modal(document.getElementById('confirmForceLogoutModal'));
    confirmModal.show();
    
    // Set up the confirm button
    document.getElementById('confirmForceLogoutBtn').onclick = function() {
        const formData = new FormData();
        formData.append('judge_id', judgeId);

        fetch('force_logout.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification(data.message, 'success');
                // Don't reload immediately - give time for WebSocket message to be sent
                setTimeout(() => {
                    loadJudges(); // Reload the table to show updated status
                }, 1000);
            } else {
                showNotification(data.message, 'danger');
            }
            confirmModal.hide();
        })
        .catch(error => {
            console.error('Error forcing logout:', error);
            showNotification('Error forcing logout. Please check if WebSocket server is running.', 'danger');
            confirmModal.hide();
        });
    };
}

function deleteJudge(judgeId) {
    // Show confirmation modal
    const confirmModal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
    confirmModal.show();
    
    // Set up the confirm button
    document.getElementById('confirmDeleteBtn').onclick = function() {
        const formData = new FormData();
        formData.append('judge_id', judgeId);

        fetch('delete_judge.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification(data.message, 'success');
                loadJudges(); // Reload the table
            } else {
                showNotification(data.message, 'danger');
            }
            confirmModal.hide();
        })
        .catch(error => {
            console.error('Error deleting judge:', error);
            showNotification('Error deleting judge: ' + error.message, 'danger');
            confirmModal.hide();
        });
    };
}

function showNotification(message, type = 'success') {
    const modal = document.getElementById('notificationModal');
    const header = modal.querySelector('.modal-header');
    const messageElement = document.getElementById('notificationMessage');
    
    // Update header color based on type
    header.className = `modal-header bg-${type === 'success' ? 'success' : 'danger'} text-white`;
    
    messageElement.textContent = message;
    
    const notificationModal = new bootstrap.Modal(modal);
    notificationModal.show();
}

const allSideMenu = document.querySelectorAll('#sidebar .side-menu.top li a');

// Function to set the active menu based on the current URL
function setActiveMenu() {
    const currentPage = window.location.pathname.split('/').pop(); // Get current file name

    allSideMenu.forEach(item => {
        const li = item.parentElement;
        const linkPage = item.getAttribute('href').split('/').pop(); // Get href file name

        if (linkPage === currentPage) {
            li.classList.add('active');
        } else {
            li.classList.remove('active');
        }
    });
}

// Run on page load
setActiveMenu();

// TOGGLE SIDEBAR
const menuBar = document.querySelector('#content nav .bx.bx-menu');
const sidebar = document.getElementById('sidebar');

menuBar.addEventListener('click', function () {
    sidebar.classList.toggle('hide');
});

const searchButton = document.querySelector('#content nav form .form-input button');
const searchButtonIcon = document.querySelector('#content nav form .form-input button .bx');
const searchForm = document.querySelector('#content nav form');

searchButton.addEventListener('click', function (e) {
    if(window.innerWidth < 576) {
        e.preventDefault();
        searchForm.classList.toggle('show');
        if(searchForm.classList.contains('show')) {
            searchButtonIcon.classList.replace('bx-search', 'bx-x');
        } else {
            searchButtonIcon.classList.replace('bx-x', 'bx-search');
        }
    }
})

if(window.innerWidth < 768) {
    sidebar.classList.add('hide');
} else if(window.innerWidth > 576) {
    searchButtonIcon.classList.replace('bx-x', 'bx-search');
    searchForm.classList.remove('show');
}

window.addEventListener('resize', function () {
    if(this.innerWidth > 576) {
        searchButtonIcon.classList.replace('bx-x', 'bx-search');
        searchForm.classList.remove('show');
    }
})