const logOutput = document.getElementById('logOutput');

// Function to fetch logs from the server
function fetchLogs() {
    fetch('/logs')
        .then(response => response.json())
        .then(data => {
            logOutput.textContent = data.logs.join('\n');
            // Scroll to the bottom of the logs
            logOutput.scrollTop = logOutput.scrollHeight;
        })
        .catch(err => console.error('Error fetching logs:', err));
}

// Fetch logs every 1 second
setInterval(fetchLogs, 1000);
