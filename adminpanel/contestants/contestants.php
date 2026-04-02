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
		<link rel="stylesheet" href="contestants.css">

		<link rel="icon" type="image/x-icon" href="../../assets/img/philcst6.png">
		<title>Contestants - PhilCST Tabulation System</title>
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
			</nav>
			<!-- Main -->
			<main>
				<div class="head-title">
					<div class="left">
						<h1>Contestant Dashboard</h1>
					</div>
				</div>


				<div class="table-data">
					<div class="order">
						<div class="head">
							<h3>Contestants</h3>
							<div style="display: flex; gap: 10px; align-items: center;">
								<select id="eventFilter" class="form-select" style="width: 200px; height: 30px; font-size: 10px;">
									<option value="">All Events</option>
								</select>
								<input type="text" id="searchInput" placeholder="Search..." class="form-control" style="width: 200px; height: 30px; font-size: 10px;">
							</div>
							<i class='bx bx-plus' data-bs-toggle="modal" data-bs-target="#contestantModal"></i>
						</div>
						<table>
							<thead>
								<tr>
									<th>Photo</th>
									<th>Name</th>
									<th>Contestant Number</th>
									<th>Category</th>
									<th>Event Name</th>
									<th>Actions</th>
								</tr>
								<tbody>

								</tbody>
							</thead>
						</table>
					</div>
				</div>
			</main>

			<!-- Add Modal -->
			<div class="modal fade" id="contestantModal" tabindex="-1" aria-labelledby="contestantModalLabel" aria-hidden="true">
				<div class="modal-dialog">
					<div class="modal-content">
						<div class="modal-header">
							<h5 class="modal-title" id="contestantModalLabel">Add Contestant</h5>
							<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
						</div>
						<div class="modal-body">
							<form id="contestantForm">
								<input type="hidden" id="edit_id" name="id">
								<div class="mb-3">
									<label for="photo" class="form-label">Upload Photo:</label>
									<input type="file" class="form-control" id="photo" accept="image/*" required>
								</div>
								<div class="mb-3">
									<label for="name" class="form-label">Contestant Name:</label>
									<input type="text" class="form-control" id="name" required>
								</div>
								<div class="mb-3">
									<label for="contestant_no" class="form-label">Contestant Number:</label>
									<input type="number" class="form-control" id="contestant_no" required>
								</div>
								<div class="mb-3">
									<label for="category" class="form-label">Category:</label>
									<select id="category" class="form-select" required>
										<option value="1">Male</option>
										<option value="2">Female</option>
									</select>
								</div>
								<div class="mb-3">
									<label for="event" class="form-label">Event:</label>
									<select id="event" class="form-select" required>
										<option value="">Select Event</option>
									</select>
								</div>
								<button type="submit" class="btn btn-primary">Add Contestant</button>
							</form>
						</div>			
					</div>
				</div>
			</div>

			<!-- Edit Modal -->
			<div class="modal fade" id="editContestantModal" tabindex="-1" aria-labelledby="editContestantModalLabel" aria-hidden="true">
				<div class="modal-dialog">
					<div class="modal-content">
						<div class="modal-header">
							<h5 class="modal-title" id="editContestantModalLabel">Edit Contestant</h5>
							<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
						</div>
						<div class="modal-body">
							<form id="editContestantForm">
								<input type="hidden" id="edit_id" name="id">
								
								<div class="mb-3">
									<label for="edit_photo" class="form-label">Photo</label>
									<input type="file" class="form-control" id="edit_photo" name="photo">
								</div>
							
								<div class="mb-3">
									<label for="edit_name" class="form-label">Name</label>
									<input type="text" class="form-control" id="edit_name" name="name" required>
								</div>
							
								<div class="mb-3">
									<label for="edit_contestant_no" class="form-label">Contestant Number</label>
									<input type="number" class="form-control" id="edit_contestant_no" name="contestant_no" required>
								</div>
							
								<div class="mb-3">
									<label for="edit_category" class="form-label">Category</label>
									<select class="form-select" id="edit_category" name="category" required>
										<option value="">Select Category</option>
										<option value="1">Male</option>
										<option value="2">Female</option>
									</select>
								</div>
							
								<div class="mb-3">
									<label for="edit_event" class="form-label">Event</label>
									<select class="form-select" id="edit_event" name="event_id" required>
										<option value="">Select Event</option>
									</select>
								</div>
							
								<button type="submit" class="btn btn-primary">Save Changes</button>
							</form>
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
			  
			  <div class="modal fade" id="confirmDeleteContestantModal" tabindex="-1" aria-labelledby="confirmDeleteContestantModalLabel" aria-hidden="true">
				<div class="modal-dialog">
				  <div class="modal-content">
					<div class="modal-header bg-danger text-white">
					  <h5 class="modal-title" id="confirmDeleteContestantModalLabel">Confirm Delete</h5>
					  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
					  <p>Are you sure you want to delete this contestant?</p>
					</div>
					<div class="modal-footer">
					  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
					  <button type="button" class="btn btn-danger" id="confirmDeleteContestantBtn">Delete</button>
					</div>
				  </div>
				</div>
			  </div>

		<script src="../script.js"></script>
		<script src="contestant.js"></script>
		<script src="../../assets/js/bootstrap.bundle.min.js"></script>
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