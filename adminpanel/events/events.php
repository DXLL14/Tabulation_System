<?php
session_start();

// Check if user is not logged in or not admin
if (!isset($_SESSION['username']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    // Redirect to login page with alert parameter
    header("Location: ../../index.html?redirected=true");
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">

	<link rel="stylesheet" href="../../assets/css/bootstrap.min.css">
	<link rel="stylesheet" href="../../assets/css/boxicons.min.css">
	<link rel="stylesheet" href="../style.css">
	<link rel="stylesheet" href="event.css">
	<link rel="stylesheet" href="clear_data.css">
	

	<link rel="icon" type="image/x-icon" href="../../assets/img/philcst6.png">
	<title>Events - PhilCST Tabulation System</title>
	<style>		
		.modal-xl {
			max-width: 90%;
		}
		.percentage-display {
			font-size: 0.85em;
			margin-top: 4px;
			padding: 4px 8px;
			border-radius: 4px;
			background-color: #f8f9fa;
			border: 1px solid #e9ecef;
		}
		
		.percentage-remaining {
			color: #dc3545;
			font-weight: bold;
		}
		
		.percentage-complete {
			color: #28a745;
			font-weight: bold;
		}
		
		.percentage-warning {
			color: #ffc107;
			font-weight: bold;
		}
		
		.criteria-percentage-summary {
			background: #e7f3ff;
			padding: 8px;
			border-radius: 4px;
			margin: 8px 0;
			border-left: 4px solid #007bff;
		}
		
		.round-percentage-summary {
			background: #fff3cd;
			padding: 8px;
			border-radius: 4px;
			margin: 8px 0;
			border-left: 4px solid #ffc107;
		}
		
		.sub-criteria-percentage-summary {
			background: #d1ecf1;
			padding: 6px;
			border-radius: 4px;
			margin: 4px 0;
			border-left: 3px solid #17a2b8;
			font-size: 0.9em;
		}
	</style>
</head>
<body>


	<!-- Sidebar -->
	<section id="sidebar">
		<a href="../indexmain.php" class="brand">
			<img src="../../assets/img/cropped-philcst766.png" alt="AdminHub Logo" style="width: 600px; height: 50px; object-fit: contain; margin-right: 10px; margin-top: 10px; margin-left: 10px;">
		</a>
		<ul class="side-menu top">
			<li class="active">
				<a href="../indexmain.php">
					<i class='bx bxs-dashboard' ></i>
					<span class="text">Dashboard</span>
				</a>
			</li>
			<li>
				<a href="../events/events.php">
					<i class='bx bxs-calendar-event'></i>
					<span class="text">Events</span>
				</a>
			</li>
			<li>
				<a href="../judges/judge.php">
					<i class='bx bxs-user' ></i>
					<span class="text">Judges</span>
				</a>
			</li>
			<li>
				<a href="../contestants/contestants.php">
					<i class='bx bx-body'></i>
					<span class="text">Contestants</span>
				</a>
			</li>
			<li>
				<a href="../scores/scores.php">
					<i class='bx bxs-medal'></i>
					<span class="text">Scores</span>
				</a>
			</li>
		</ul>
		<ul class="side-menu">

			<li>
				<a href="../../logout.php" class="logout">
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
			<i class='bx bx-menu' ></i>
			<div class="nav-right">
				<button class="clear-data-btn" id="clearAllBtn" title="Clear All Data">
					<i class='bx bx-trash'></i>
				</button>
			</div>
		</nav>

		<!-- Main -->
		<main>
			<div class="head-title">
				<div class="left">
					<h1>Event Dashboard</h1>
				</div>
			</div>


			<div class="table-data">
				<div class="order">
					<div class="head">
						<h3>Events</h3>
						<i class='bx bx-plus' data-bs-toggle="modal" data-bs-target="#addEventModal"></i>
					</div>
					<table>
						<thead>
							<tr>
								<th>ID</th>
								<th>Event Name</th>
								<th>Criteria</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody id="eventTableBody">
                            
                        </tbody>
					</table>
				</div>
			</div>
		</main>
	</section>

	<!-- Add Modal -->
	<div class="modal fade" id="addEventModal">
		<div class="modal-dialog modal-xl">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title">Add New Event</h5>
					<button type="button" class="btn-close" data-bs-dismiss="modal"></button>
				</div>
				<div class="modal-body">
					<label>Event Name:</label>
					<input type="text" id="eventName" class="form-control">
					
					<h5 class="mt-4">Preliminary Criteria</h5>
					<div id="criteriaContainer"></div>
					<button class="btn btn-secondary mt-2" onclick="addCriteria()">+ Add Criteria</button>
					
					<h5 class="mt-4">Round Criteria</h5>
					<div id="roundCriteriaContainer"></div>
					<button class="btn btn-info mt-2" onclick="addRoundCriteria()">+ Add New Round Criteria</button>
				</div>
				<div class="modal-footer">
					<button class="btn btn-primary" id="addEventBtn">Save</button>
				</div>
			</div>
		</div>
	</div>
	
	<!-- Edit Modal -->
	<div class="modal fade" id="editEventModal" tabindex="-1" aria-labelledby="editEventModalLabel" aria-hidden="true">
		<div class="modal-dialog modal-xl">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title" id="editEventModalLabel">Edit Event</h5>
					<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
				</div>
				<div class="modal-body">
					<input type="hidden" id="editEventId">
					<label for="editEventName">Event Name:</label>
					<input type="text" class="form-control" id="editEventName">

					<h5 class="mt-4">Priliminary Criteria</h5>
					<div id="editCriteriaContainer"></div>
					<button class="btn btn-secondary mt-2" type="button" onclick="addEditCriteria()">
						+ Add Criteria
					</button>

					<h5 class="mt-4">Round Criteria</h5>
					<div id="editRoundCriteriaContainer"></div>
					<button class="btn btn-info mt-2" type="button" onclick="addEditRoundCriteria()">
						+ Add New Round Criteria
					</button>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
					<button type="button" class="btn btn-primary" onclick="saveEditedEvent()">Save Changes</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Alert Modal -->
	<div class="modal fade" id="notificationModal" tabindex="-1" aria-labelledby="notificationModalLabel" aria-hidden="true">
		<div class="modal-dialog">
		  <div class="modal-content">
			<div class="modal-header bg-success text-white">
			  <h5 class="modal-title" id="notificationModalLabel">Notification</h5>
			  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			</div>
			<div class="modal-body">
			  <p id="notificationMessage"></p>
			</div>
			<div class="modal-footer">
			  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
			</div>
		  </div>
		</div>
	  </div>
	  
	  <div class="modal fade" id="confirmationModal" tabindex="-1" aria-labelledby="confirmationModalLabel" aria-hidden="true">
		<div class="modal-dialog">
		  <div class="modal-content">
			<div class="modal-header bg-warning text-dark">
			  <h5 class="modal-title" id="confirmationModalLabel">Confirm Delete</h5>
			  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			</div>
			<div class="modal-body">
			  <p id="confirmationMessage">Are you sure you want to delete this item?</p>
			</div>
			<div class="modal-footer">
			  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
			  <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Delete</button>
			</div>
		  </div>
		</div>
	  </div>

	<!-- Clear Data Modal -->
	<div class="modal fade" id="clearDataModal" tabindex="-1" role="dialog">
		<div class="modal-dialog modal-lg" role="document">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title">⚠️ WARNING: Delete All Data</h5>
				</div>
				<div class="modal-body">
					<div class="alert alert-danger" role="alert">
						<p><strong>This will permanently delete:</strong></p>
						<ul>
							<li>All events</li>
							<li>All candidates</li>
							<li>All criteria and scores</li>
							<li>All judge accounts</li>
						</ul>
						<p><strong>Only admin accounts will be preserved.</strong></p>
						<p>This action CANNOT be undone!</p>
					</div>
					
					<!-- Initial Confirmation -->
					<div id="initialConfirmation">
						<p>Are you sure you want to proceed?</p>
						<div class="d-flex justify-content-center gap-3 mt-3 flex-wrap">
							<button id="proceedBtn" class="btn btn-warning">Yes, I want to proceed</button>
							<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
						</div>
					</div>
					
					<!-- Countdown Confirmation -->
					<div id="countdownConfirmation" style="display: none;">
						<div class="text-center mb-3">
							<p>Please wait <span id="countdown">5</span> seconds and confirm again.</p>
							<div class="progress">
								<div id="countdownProgress" class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 100%"></div>
							</div>
						</div>
						<div class="d-flex justify-content-center gap-3 flex-wrap">
							<button id="finalConfirmBtn" class="btn btn-danger" disabled>Continue to Password Verification</button>
							<button id="cancelBtn" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
						</div>
					</div>
					
					<!-- Password Confirmation -->
					<div id="passwordConfirmation" style="display: none;">
						<div class="mb-3">
							<p class="text-center mb-3"><strong>Enter your admin password to confirm deletion:</strong></p>
							<div class="form-group">
								<label for="adminPassword" class="form-label"></label>
								<input type="password" class="form-control" id="adminPassword" placeholder="Enter admin password">
								<div id="passwordError" class="text-danger mt-2" style="display: none;"></div>
							</div>
						</div>
						<div class="d-flex justify-content-center gap-3 flex-wrap mt-3">
							<button id="submitPasswordBtn" class="btn btn-danger">Delete Everything</button>
							<button id="cancelPasswordBtn" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Processing Modal -->
	<div class="modal fade" id="processingModal" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
	</div>

	<script src="../../assets/js/bootstrap.bundle.min.js"></script>
	<script src="event.js"></script> 
	<script src="clear_data.js"></script>
	<script>
		let ws;
		let reconnectAttempts = 0;
		const maxReconnects = 1;

		// Automatically use the same host as the webpage
		const WS_SERVER_URL = `ws://${window.location.hostname}:8080`;

		function connectWebSocket() {
			ws = new WebSocket(WS_SERVER_URL);

			ws.onopen = function() {
				console.log("Connected to WebSocket server");
				reconnectAttempts = 0;

				ws.send(JSON.stringify({
					type: "login",
					user_id: "<?php echo $_SESSION['user_id']; ?>",
					username: "<?php echo $_SESSION['username']; ?>",
				}));
			};

			ws.onclose = function(event) {
				console.log(`Disconnected (code: ${event.code})`);
				
				if (reconnectAttempts < maxReconnects && event.code !== 1000) {
					reconnectAttempts++;
					console.log(`Reconnecting... (attempt ${reconnectAttempts})`);
					setTimeout(connectWebSocket, 2000);
				}
			};

			ws.onerror = function(error) {
				console.error("WebSocket error:", error);
			};

			ws.onmessage = function(event) {
				try {
					const data = JSON.parse(event.data);
					if (data.error) {
						console.error("Server error:", data.error);
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
	</script>
</body>
</html>