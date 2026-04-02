<?php
session_start();

// License validation - check if system is licensed for this computer
require_once '../check_license.php';

// Check if user is not logged in or not admin
if (!isset($_SESSION['username']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    header("Location: ../index.html?redirected=true");
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">

	<link rel="stylesheet" href="../assets/css/bootstrap.min.css">
	<link rel="stylesheet" href="../assets/css/boxicons.min.css">
	<link rel="stylesheet" href="../assets/css/fontawesome.min.css">
	<link rel="stylesheet" href="style.css">
	<link rel="stylesheet" href="indexmain.css">

	<link rel="icon" type="image/x-icon" href="../assets/img/philcst6.png">
	<title>PhilCST Tabulation System</title>
</head>
<body>

	<!-- Connection Monitor Modal -->
	<div class="connection-modal-overlay" id="connectionModalOverlay"></div>
	<div class="connection-modal" id="connectionModal">
		<div class="connection-modal-header">
			<h3><i class='bx bx-desktop'></i> Connection Monitor</h3>
			<button class="close-btn" id="closeConnectionModal">
				<i class='bx bx-x'></i>
			</button>
		</div>
		<div class="connection-modal-body">
			<div class="connection-status">
				<div class="status-indicator" id="wsStatusIndicator"></div>
				<div>
					<strong>WebSocket Status:</strong>
					<span id="wsStatus">Connecting...</span>
				</div>
			</div>
			
			<h4 style="font-size: 14px; color: var(--dark); margin-bottom: 10px;">
				Active Connections (<span id="connectionCount">0</span>)
			</h4>
			
			<div id="connectionsList">
				<div class="no-connections">
					<i class='bx bx-desktop'></i>
					<p>No active connections</p>
				</div>
			</div>
			
			<div class="connection-logs" id="connectionLogs">
				<div class="log-entry">System initialized...</div>
			</div>
		</div>
	</div>

	<!-- Sidebar -->
	<section id="sidebar">
		<a href="#" class="brand">
			<img src="../assets/img/cropped-philcst766.png" alt="Admin Logo" style="width: 600px; height: 50px; object-fit: contain; margin-right: 10px; margin-top: 10px; margin-left: 10px;">
		</a>
		<ul class="side-menu top">
			<li class="active">
				<a href="indexmain.php">
					<i class='bx bxs-dashboard' ></i>
					<span class="text">Dashboard</span>
				</a>
			</li>
			<li>
				<a href="events/events.php">
					<i class='bx bxs-calendar-event'></i>
					<span class="text">Events</span>
				</a>
			</li>
			<li>
				<a href="judges/judge.php">
					<i class='bx bxs-user' ></i>
					<span class="text">Judges</span>
				</a>
			</li>
			<li>
				<a href="contestants/contestants.php">
					<i class='bx bx-body' ></i>
					<span class="text">Contestants</span>
				</a>
			</li>
			<li>
				<a href="scores/scores.php">
					<i class='bx bxs-medal'></i>
					<span class="text">Scores</span>
				</a>
			</li>
		</ul>
		<ul class="side-menu">
			<li>
				<a href="../logout.php" class="logout">
					<i class='bx bx-log-out'></i>
					<span class="text">Logout</span>
				</a>
			</li>
		</ul>
	</section>

	<!-- Main Content -->
	<section id="content">
		<!-- Navbar -->
		<nav>
			<i class='bx bx-menu'></i>
			<!-- Connection Monitor Button -->
			<div class="connection-monitor-btn" id="connectionMonitorBtn" title="Connection Monitor">
				<i class='bx bx-desktop'></i>
				<span class="connection-badge" id="connectionBadge">0</span>
			</div>
		</nav>

		<!-- Main -->
		<main>
			<div class="head-title">
				<div class="left">
					<h1>Monitoring Dashboard</h1>
				</div>
			</div>

			<!-- Combined Single Row for All Controls -->
			<ul class="box-info">
				<!-- Event Number -->
				<li>
					<i class='bx bxs-calendar-event'><h3 style="font-size: 25px;">Event</h3></i>
					<span class="text">
						<div class="nav-group">
							<select id="eventSelect" class="form-select" style="border-radius: 10px;">
								<option value="" selected disabled>Select Event</option>
							</select>
							<div class="nav-buttons">
								<button class="prevEvent nav-btn">prev</button>
								<button class="nextEvent nav-btn">next</button>
							</div>
						</div>
					</span>
				</li>
				
				<!-- Criteria Number -->
				<li>
					<i class='bx bx-bookmarks'><h3 style="font-size: 25px;">Criteria</h3></i>
					<span class="text">
						<div class="nav-group">
							<select id="criteriaSelect" class="form-select" style="border-radius: 10px;">
								<option value="" selected disabled>Select Criteria</option>
							</select>
							<div class="nav-buttons">
								<button class="prevCri nav-btn">prev</button>
								<button class="nextCri nav-btn">next</button>
							</div>
						</div>
					</span>
				</li>

				<!-- Category -->
				<li>
					<i class='bx bx-category'><h3 style="font-size: 25px;">Category</h3></i>
					<span class="text">
						<div class="nav-group">
							<select id="categorySelect" name="category" class="form-select" style="border-radius: 10px;">
								<option value="" selected disabled>Select Category</option>
								<option value="all">Select All</option>
								<option value="1">Male</option>
								<option value="2">Female</option>
							</select>
							<div class="nav-buttons">
								<button class="prevCat nav-btn">prev</button>
								<button class="nextCat nav-btn">next</button>
							</div>
						</div>
					</span>
				</li>
				
				<!-- Candidate Number -->
				<li>
					<i class='bx bxs-group'><h3 style="font-size: 25px;">Candidate</h3></i>
					<span class="text">
						<div class="nav-group">
							<select id="candidateSelect" class="form-select" style="border-radius: 10px;">
								<option value="" selected disabled>Select Candidate</option>
							</select>
							<div class="nav-buttons">
								<button class="prevCan nav-btn">prev</button>
								<button class="nextCan nav-btn">next</button>
							</div>
						</div>
					</span>
				</li>

				<!-- Judge Selection -->
				<li>
					<i class='bx bx-user-check'><h3 style="font-size: 25px;">Judge</h3></i>
					<span class="text">
						<div id="judgesCheckboxContainer"></div>
					</span>
				</li>
			</ul>

			<div class="table-data">
				<div class="order">
					<div class="head">
						<h3>Score Monitoring</h3>
						<select id="eventmonitorSelect" class="form-select" style="border-radius: 10px; font-size: 16px;">
							<option value="" selected disabled>Select Event</option>
						</select>
						<select id="categorymonitorSelect" class="form-select" style="border-radius: 10px; font-size: 16px;">
							<option value="" selected disabled>Select Category</option>
							<option value="all">Select All</option>
							<option value="1">Male</option>
							<option value="2">Female</option>
						</select>
						<select id="criteriamonitorSelect" class="form-select" style="border-radius: 10px; font-size: 16px;">
							<option value="" selected disabled>Select Criteria</option>
						</select>
						<input type="checkbox" id="showSubScore" style="width: 20px; height: 20px; margin-left: 10px;">Show in Sub-Score</input>
						<i class='bx bxs-printer'></i>
						<i id="fullscreenToggle" class='bx bx-fullscreen' style="cursor: pointer; font-size: 20px; margin-left: 10px;"></i>
					</div>
					<table>
						<thead>
							<th>Contestant Number</th>
							<th>Photo</th>
							<th>Name</th>
							<th>Category</th>
						</thead>
						<tbody id="eventTableBody"></tbody>
					</table>
				</div>
			</div>
		</main>
	</section>

	<!-- Judge Selection Modal -->
	<div class="modal fade" id="judgeModal" tabindex="-1" aria-labelledby="judgeModalLabel" aria-hidden="true">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title" id="judgeModalLabel">Select Judges</h5>
					<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
				</div>
				<div class="modal-body">
					<div class="select-all-container mb-3">
						<input type="checkbox" class="form-check-input" id="select-all-judges" checked>
						<label class="form-check-label" for="select-all-judges" style="margin-left: 8px; font-weight: bold;">
							Select All Judges
						</label>
					</div>
					<hr style="margin: 15px 0;">
					<div id="judgeCheckboxesContainer">
						<!-- Judge checkboxes will be loaded here -->
					</div>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
					<button type="button" class="btn btn-primary" id="confirmJudgeBtn">Confirm</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Print Modal -->
	<div class="modal fade" id="printModal" tabindex="-1" aria-labelledby="printModalLabel" aria-hidden="true">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title" id="printModalLabel">Print Options</h5>
					<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
				</div>
				<div class="modal-body">
					<div class="mb-3">
						<label for="printEventSelect" class="form-label">Select Event:</label>
						<select id="printEventSelect" class="form-select">
							<option value="" selected disabled>Select Event</option>
						</select>
					</div>
					
					<div class="mb-3">
						<label for="printCriteriaSelect" class="form-label">Select Criteria:</label>
						<select id="printCriteriaSelect" class="form-select">
							<option value="" selected disabled>Select Criteria</option>
						</select>
					</div>
					
					<div class="mb-3">
						<input type="checkbox" id="printShowSubScore" style="margin-right: 8px;">
						<label for="printShowSubScore">Show Sub-Scores</label>
					</div>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
					<button type="button" class="btn btn-primary" id="printButton">Print</button>
				</div>
			</div>
		</div>
	</div>
	<!-- Print Container (hidden) -->
	<div id="printContainer" style="display: none;"></div>
	
	<div id="responseModal" class="modal-overlay">
		<div class="modal-content" id="responseMessage"></div>
	</div>

	<script src="print.js"></script>
	<script src="monitoring.js"></script>
	<script src="indexmain.js"></script>
	<script src="fetch_data.js"></script>
	<script src="../assets/js/bootstrap.bundle.min.js"></script>
	
	<script>
		// Connection Monitor Script
		let ws;
		let reconnectAttempts = 0;
		const maxReconnects = 5;
		const connectedUsers = new Map();
		const WS_SERVER_URL = `ws://${window.location.hostname}:8080`;

		// Modal Controls
		const connectionMonitorBtn = document.getElementById('connectionMonitorBtn');
		const connectionModal = document.getElementById('connectionModal');
		const connectionModalOverlay = document.getElementById('connectionModalOverlay');
		const closeConnectionModal = document.getElementById('closeConnectionModal');

		connectionMonitorBtn.addEventListener('click', () => {
			connectionModal.classList.add('show');
			connectionModalOverlay.classList.add('show');
		});

		closeConnectionModal.addEventListener('click', () => {
			connectionModal.classList.remove('show');
			connectionModalOverlay.classList.remove('show');
		});

		connectionModalOverlay.addEventListener('click', () => {
			connectionModal.classList.remove('show');
			connectionModalOverlay.classList.remove('show');
		});

		// Log functions
		function addLog(message, type = 'info') {
			const logsContainer = document.getElementById('connectionLogs');
			const timestamp = new Date().toLocaleTimeString();
			const logEntry = document.createElement('div');
			logEntry.className = `log-entry ${type}`;
			logEntry.innerHTML = `<span class="log-timestamp">[${timestamp}]</span>${message}`;
			logsContainer.appendChild(logEntry);
			logsContainer.scrollTop = logsContainer.scrollHeight;
			
			// Keep only last 50 logs
			while (logsContainer.children.length > 50) {
				logsContainer.removeChild(logsContainer.firstChild);
			}
		}

		// Update connection display
		function updateConnectionsDisplay() {
			const connectionsList = document.getElementById('connectionsList');
			const connectionCount = document.getElementById('connectionCount');
			const connectionBadge = document.getElementById('connectionBadge');
			
			const count = connectedUsers.size;
			connectionCount.textContent = count;
			connectionBadge.textContent = count;

			if (count === 0) {
				connectionsList.innerHTML = `
					<div class="no-connections">
						<i class='bx bx-desktop'></i>
						<p>No active connections</p>
					</div>
				`;
				return;
			}

			let html = '';
			connectedUsers.forEach((user, userId) => {
				const connectedTime = Math.floor((Date.now() - user.timestamp) / 1000);
				const minutes = Math.floor(connectedTime / 60);
				const seconds = connectedTime % 60;
				const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
				
				html += `
					<div class="connection-item ${user.role}">
						<div class="connection-item-header">
							<span class="connection-username">
								<i class='bx ${user.role === 'admin' ? 'bxs-user-badge' : 'bxs-user'}'></i>
								${user.username}
							</span>
							<span class="connection-role ${user.role}">${user.role}</span>
						</div>
						<div class="connection-info">
							<span><i class='bx bx-id-card'></i>ID: ${userId}</span>
							<span><i class='bx bx-time'></i>${timeStr}</span>
						</div>
					</div>
				`;
			});

			connectionsList.innerHTML = html;
		}

		// Update WebSocket status
		function updateWSStatus(status, connected) {
			const wsStatus = document.getElementById('wsStatus');
			const wsIndicator = document.getElementById('wsStatusIndicator');
			
			wsStatus.textContent = status;
			
			if (connected) {
				wsIndicator.className = 'status-indicator connected';
			} else {
				wsIndicator.className = 'status-indicator disconnected';
			}
		}

		function connectWebSocket() {
			ws = new WebSocket(WS_SERVER_URL);

			ws.onopen = function() {
				console.log("Connected to WebSocket server");
				updateWSStatus('Connected', true);
				addLog('WebSocket connected', 'connect');
				reconnectAttempts = 0;

				ws.send(JSON.stringify({
					type: "login",
					user_id: "<?php echo $_SESSION['user_id']; ?>",
					username: "<?php echo $_SESSION['username']; ?>",
					role: "admin"
				}));
			};

			ws.onclose = function(event) {
				console.log(`Disconnected (code: ${event.code})`);
				updateWSStatus('Disconnected', false);
				addLog(`WebSocket disconnected (code: ${event.code})`, 'disconnect');
				
				if (reconnectAttempts < maxReconnects && event.code !== 1000) {
					reconnectAttempts++;
					addLog(`Reconnecting... (attempt ${reconnectAttempts}/${maxReconnects})`, 'info');
					setTimeout(connectWebSocket, 2000);
				}
			};

			ws.onerror = function(error) {
				console.error("WebSocket error:", error);
				updateWSStatus('Error', false);
				addLog('WebSocket error occurred', 'disconnect');
			};

			ws.onmessage = function(event) {
				try {
					const data = JSON.parse(event.data);
					
					if (data.type === 'user_connected') {
						connectedUsers.set(data.user_id, {
							username: data.username,
							role: data.role,
							timestamp: Date.now()
						});
						addLog(`${data.username} (${data.role}) connected`, 'connect');
						updateConnectionsDisplay();
					} 
					else if (data.type === 'user_disconnected') {
						const user = connectedUsers.get(data.user_id);
						if (user) {
							addLog(`${user.username} (${user.role}) disconnected`, 'disconnect');
							connectedUsers.delete(data.user_id);
							updateConnectionsDisplay();
						}
					}
					else if (data.type === 'active_users') {
						// Initial list of active users
						connectedUsers.clear();
						data.users.forEach(user => {
							connectedUsers.set(user.user_id, {
								username: user.username,
								role: user.role,
								timestamp: Date.now()
							});
						});
						updateConnectionsDisplay();
					}
					else if (data.error) {
						console.error("Server error:", data.error);
						addLog(`Server error: ${data.error}`, 'disconnect');
					}
				} catch (err) {
					console.error("Invalid server message:", err);
				}
			};
		}

		connectWebSocket();

		window.addEventListener("beforeunload", function() {
			if (ws && ws.readyState === WebSocket.OPEN) {
				ws.close(1000, "Page unloading");
			}
		});

		// Fullscreen toggle functionality
		let originalTableStyle = '';
		let printIcon = null;
		
		function toggleFullscreenTable() {
			const tableData = document.querySelector('.table-data');
			const body = document.body;
			const toggleIcon = document.getElementById('fullscreenToggle');
			
			if (tableData.classList.contains('fullscreen')) {
				tableData.classList.remove('fullscreen');
				body.classList.remove('fullscreen-mode');
				toggleIcon.classList.remove('bx-exit-fullscreen');
				toggleIcon.classList.add('bx-fullscreen');
				body.style.overflow = 'auto';
				tableData.style.cssText = originalTableStyle;
				if (printIcon) {
					printIcon.style.display = '';
				}
			} else {
				originalTableStyle = tableData.style.cssText;
				tableData.classList.add('fullscreen');
				body.classList.add('fullscreen-mode');
				toggleIcon.classList.remove('bx-fullscreen');
				toggleIcon.classList.add('bx-exit-fullscreen');
				body.style.overflow = 'hidden';
				tableData.style.position = 'fixed';
				tableData.style.top = '0';
				tableData.style.left = '0';
				tableData.style.width = '100vw';
				tableData.style.height = '100vh';
				tableData.style.margin = '0';
				tableData.style.zIndex = '9999';
				tableData.style.backgroundColor = 'var(--light)';
				tableData.style.display = 'flex';
				tableData.style.flexDirection = 'column';
				tableData.style.overflow = 'auto';
				tableData.style.padding = '20px';
				tableData.style.borderRadius = '0';
				tableData.style.boxSizing = 'border-box';
				printIcon = document.querySelector('.order .head .bx.bxs-printer');
				if (printIcon) {
					printIcon.style.display = 'none';
				}
			}
		}

		document.addEventListener('DOMContentLoaded', function() {
			const toggleBtn = document.getElementById('fullscreenToggle');
			if (toggleBtn) {
				toggleBtn.addEventListener('click', toggleFullscreenTable);
			}
		});
	</script>
</body>
</html>