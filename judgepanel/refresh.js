let lastRefreshValue = null;
let refreshCheckInterval = null;

function startRefreshMonitoring() {
    // Check every 2 seconds for updates
    refreshCheckInterval = setInterval(checkForRefresh, 2000);
    }

    function checkForRefresh() {
        fetch('../adminpanel/check_refresh.php')
            .then(response => response.text())
            .then(data => {
                const currentValue = parseInt(data);
                
                if (lastRefreshValue === null) {
                    // First time checking, just store the value
                    lastRefreshValue = currentValue;
                } else if (currentValue !== lastRefreshValue) {
                    // Value has changed, refresh the page
                    console.log('Refresh signal detected, reloading page...');
                    lastRefreshValue = currentValue;
                    
                    // Reload the page to get updated data
                    window.location.reload();
                }
            })
            .catch(error => {
                console.error('Error checking for refresh:', error);
            });
    }

    function stopRefreshMonitoring() {
        if (refreshCheckInterval) {
            clearInterval(refreshCheckInterval);
            refreshCheckInterval = null;
        }
    }

    // Start monitoring when page loads
    document.addEventListener('DOMContentLoaded', function() {
        startRefreshMonitoring();
        console.log('Auto-refresh monitoring started');
    });

    // Stop monitoring before page unloads
    window.addEventListener('beforeunload', function() {
        stopRefreshMonitoring();
    });