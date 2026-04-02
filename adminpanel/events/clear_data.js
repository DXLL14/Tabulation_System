// clear_data.js - Updated with password verification
document.addEventListener('DOMContentLoaded', function() {
    // Get the clear all button
    var clearAllBtn = document.getElementById('clearAllBtn');
    
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', function() {
            var clearModal = new bootstrap.Modal(document.getElementById('clearDataModal'));
            clearModal.show();
        });
    } else {
        console.error("Clear All button not found!");
    }

    // Setup proceed button
    var proceedBtn = document.getElementById('proceedBtn');
    if (proceedBtn) {
        proceedBtn.addEventListener('click', function() {
            // Hide initial confirmation, show countdown
            document.getElementById('initialConfirmation').style.display = 'none';
            document.getElementById('countdownConfirmation').style.display = 'block';
            
            let secondsLeft = 5;
            const countdownElement = document.getElementById('countdown');
            const progressBar = document.getElementById('countdownProgress');
            const finalConfirmBtn = document.getElementById('finalConfirmBtn');
            
            // Start the countdown
            const countdownInterval = setInterval(function() {
                secondsLeft--;
                countdownElement.textContent = secondsLeft;
                progressBar.style.width = (secondsLeft / 5 * 100) + '%';
                
                if (secondsLeft <= 0) {
                    clearInterval(countdownInterval);
                    finalConfirmBtn.disabled = false;
                }
            }, 1000);
            
            // Store interval for cancel
            window.currentCountdownInterval = countdownInterval;
        });
    }

    // Setup final confirm button - now shows password input
    var finalConfirmBtn = document.getElementById('finalConfirmBtn');
    if (finalConfirmBtn) {
        finalConfirmBtn.addEventListener('click', function() {
            // Hide countdown confirmation, show password confirmation
            document.getElementById('countdownConfirmation').style.display = 'none';
            document.getElementById('passwordConfirmation').style.display = 'block';
            
            // Focus on password input
            document.getElementById('adminPassword').focus();
        });
    }

    // Setup password submit button
    var submitPasswordBtn = document.getElementById('submitPasswordBtn');
    if (submitPasswordBtn) {
        submitPasswordBtn.addEventListener('click', function() {
            verifyPasswordAndDelete();
        });
    }

    // Allow Enter key to submit password
    var adminPasswordInput = document.getElementById('adminPassword');
    if (adminPasswordInput) {
        adminPasswordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                verifyPasswordAndDelete();
            }
        });
    }

    // Setup cancel button in countdown
    var cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            resetModal();
        });
    }

    // Setup cancel button in password confirmation
    var cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
    if (cancelPasswordBtn) {
        cancelPasswordBtn.addEventListener('click', function() {
            resetModal();
        });
    }

    // Reset modal when it's hidden
    var clearDataModal = document.getElementById('clearDataModal');
    if (clearDataModal) {
        clearDataModal.addEventListener('hidden.bs.modal', function() {
            resetModal();
        });
    }
});

// Function to verify password and delete data
function verifyPasswordAndDelete() {
    const password = document.getElementById('adminPassword').value;
    const passwordError = document.getElementById('passwordError');
    
    // Clear previous errors
    passwordError.style.display = 'none';
    
    if (!password) {
        passwordError.textContent = 'Please enter your password';
        passwordError.style.display = 'block';
        return;
    }
    
    // Disable button to prevent multiple clicks
    document.getElementById('submitPasswordBtn').disabled = true;
    
    // Verify password first
    fetch('verify_admin_password.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Password is correct, proceed with deletion
            proceedWithDeletion();
        } else {
            // Password is incorrect
            passwordError.textContent = data.message || 'Incorrect password';
            passwordError.style.display = 'block';
            document.getElementById('submitPasswordBtn').disabled = false;
            document.getElementById('adminPassword').value = '';
            document.getElementById('adminPassword').focus();
        }
    })
    .catch(error => {
        passwordError.textContent = 'Error verifying password: ' + error.message;
        passwordError.style.display = 'block';
        document.getElementById('submitPasswordBtn').disabled = false;
    });
}

// Function to proceed with deletion after password verification
function proceedWithDeletion() {
    var clearModal = bootstrap.Modal.getInstance(document.getElementById('clearDataModal'));
    clearModal.hide();
    
    var processingModal = new bootstrap.Modal(document.getElementById('processingModal'));
    processingModal.show();
    
    // Send AJAX request to clear the database
    fetch('clear_database.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(data => {
        processingModal.hide();
        
        if (data.success) {
            // Show success message using custom modal
            showModal('Success!', 'Database successfully cleared!', 'success', function() {
                window.location.reload();
            });
        } else {
            // Show error message using custom modal
            showModal('Error', 'Error clearing database: ' + data.message, 'error');
        }
    })
    .catch(error => {
        processingModal.hide();
        
        // Show error message using custom modal
        showModal('Error', 'Error: ' + error.message, 'error');
    });
}

// Function to reset modal to initial state
function resetModal() {
    if (window.currentCountdownInterval) {
        clearInterval(window.currentCountdownInterval);
        window.currentCountdownInterval = null;
    }
    
    // Reset all sections
    setTimeout(function() {
        document.getElementById('initialConfirmation').style.display = 'block';
        document.getElementById('countdownConfirmation').style.display = 'none';
        document.getElementById('passwordConfirmation').style.display = 'none';
        document.getElementById('countdown').textContent = '5';
        document.getElementById('countdownProgress').style.width = '100%';
        document.getElementById('finalConfirmBtn').disabled = true;
        document.getElementById('adminPassword').value = '';
        document.getElementById('passwordError').style.display = 'none';
        document.getElementById('submitPasswordBtn').disabled = false;
    }, 300);
}

// Add custom modal styles to the page (simplified)
function addModalStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .modal-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            justify-content: center;
            align-items: center;
            z-index: 1050;
        }

        .modal-content {
            background: var(--light);
            padding: 30px;
            border-radius: 10px;
            max-width: 400px;
            width: 90%;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            font-family: var(--poppins);
        }
        
        .modal-icon {
            font-size: 48px;
            margin-bottom: 15px;
            font-weight: bold;
        }
        
        .modal-success {
            color: var(--blue);
        }
        
        .modal-error {
            color: var(--red);
        }
        
        .modal-title {
            font-size: 24px;
            margin-bottom: 10px;
            font-weight: 600;
            color: var(--dark);
        }
        
        .modal-text {
            margin-bottom: 20px;
            font-size: 16px;
            color: var(--dark-grey);
            line-height: 1.5;
        }
        
        .modal-button {
            background: var(--blue);
            color: var(--light);
            border: none;
            padding: 10px 25px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 500;
            transition: all 0.2s ease;
        }
        
        .modal-button:hover {
            background: #1976d2;
            transform: translateY(-1px);
        }
    `;
    document.head.appendChild(styleElement);
}

// Create the modal HTML structure (simplified)
function createModalElement() {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.id = 'customModal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    const iconElement = document.createElement('div');
    iconElement.className = 'modal-icon';
    iconElement.id = 'modalIcon';
    
    const titleElement = document.createElement('h3');
    titleElement.className = 'modal-title';
    titleElement.id = 'modalTitle';
    
    const textElement = document.createElement('p');
    textElement.className = 'modal-text';
    textElement.id = 'modalText';
    
    const buttonElement = document.createElement('button');
    buttonElement.className = 'modal-button';
    buttonElement.id = 'modalButton';
    buttonElement.textContent = 'OK';
    
    modalContent.appendChild(iconElement);
    modalContent.appendChild(titleElement);
    modalContent.appendChild(textElement);
    modalContent.appendChild(buttonElement);
    modalOverlay.appendChild(modalContent);
    
    document.body.appendChild(modalOverlay);
    
    // Close on overlay click
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            hideModal();
        }
    });
}

// Initialize custom modal
function initCustomModal() {
    // Add styles
    addModalStyles();
    
    // Create modal element if it doesn't exist
    if (!document.getElementById('customModal')) {
        createModalElement();
    }
}

// Show the custom modal
function showModal(title, message, type = 'info', callback = null) {
    // Initialize if needed
    initCustomModal();
    
    const modalOverlay = document.getElementById('customModal');
    const modalIcon = document.getElementById('modalIcon');
    const modalTitle = document.getElementById('modalTitle');
    const modalText = document.getElementById('modalText');
    const modalButton = document.getElementById('modalButton');
    
    // Set content
    modalTitle.textContent = title;
    modalText.textContent = message;
    
    // Set icon based on type
    if (type === 'success') {
        modalIcon.innerHTML = '✅';
        modalIcon.className = 'modal-icon modal-success';
    } else if (type === 'error') {
        modalIcon.innerHTML = '❌';
        modalIcon.className = 'modal-icon modal-error';
    } else {
        modalIcon.innerHTML = 'ℹ️';
        modalIcon.className = 'modal-icon';
    }
    
    // Set button action
    modalButton.onclick = function() {
        hideModal();
        if (callback && typeof callback === 'function') {
            callback();
        }
    };
    
    // Display modal
    modalOverlay.style.display = 'flex';
}

// Hide the custom modal
function hideModal() {
    const modalOverlay = document.getElementById('customModal');
    if (modalOverlay) {
        modalOverlay.style.display = 'none';
    }
}