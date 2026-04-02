document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const errorMessage = params.get("error");

    if (errorMessage) {
        const errorDiv = document.getElementById("error-message");
        errorDiv.textContent = decodeURIComponent(errorMessage);
        errorDiv.style.display = "block";
    }
});

// Check for redirect parameter in URL
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const redirected = urlParams.get('redirected');
    
    if (redirected === 'true') {
        showAlert('Please login first to access that page.', 'warning');
    }
    
    // Existing error handling code
    const error = urlParams.get('error');
    if (error) {
        showAlert(error, 'error');
    }
}

function showAlert(message, type) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Add different styles based on type
    if (type === 'warning') {
        errorDiv.style.backgroundColor = '#fff3cd';
        errorDiv.style.color = '#856404';
        errorDiv.style.border = '1px solid #ffeaa7';
    } else if (type === 'error') {
        errorDiv.style.backgroundColor = '#f8d7da';
        errorDiv.style.color = '#721c24';
        errorDiv.style.border = '1px solid #f1aeb5';
    }
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}