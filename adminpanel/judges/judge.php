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
	<link rel="stylesheet" href="judge.css">

	<link rel="icon" type="image/x-icon" href="../../assets/img/philcst6.png">
	<title>Judges - PhilCST Tabulation System</title>
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
					<h1>Judge Dashboard</h1>
				</div>
			</div>


			<div class="table-data">
				<div class="order">
					<div class="head">
						<h3>Judges</h3>
						<i class='bx bx-plus' id="addJudgeBtn" style="cursor: pointer;"></i>
					</div>
					<table>
						<thead>
							<tr>
								<th>Username</th>
								<th>Judge Name</th>
								<th>Active</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody id="judgesTable"></tbody>
					</table>
				</div>
			</div>
		</main>

		<!-- Add Modal -->
		<div class="modal fade" id="addJudgeModal" tabindex="-1" aria-labelledby="addJudgeModalLabel" aria-hidden="true">
			<div class="modal-dialog">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title" id="addJudgeModalLabel">Add New Judge</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<form id="addJudgeForm">
							<label for="judgeName">Judge Name</label>
							<input type="text" id="judgeName" class="form-control mb-3" placeholder="Enter judge name" required>
							<div class="modal-footer">
								<button type="submit" class="btn btn-primary">Save Judge</button>
							</div>
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
		
		<div class="modal fade" id="confirmDeleteModal" tabindex="-1" aria-labelledby="confirmDeleteModalLabel" aria-hidden="true">
			<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header bg-danger text-white">
				<h5 class="modal-title" id="confirmDeleteModalLabel">Confirm Delete</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
				</div>
				<div class="modal-body">
				<p>Are you sure you want to delete this judge?</p>
				</div>
				<div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
				<button type="button" class="btn btn-danger" id="confirmDeleteBtn">Delete</button>
				</div>
			</div>
			</div>
		</div>

		<!-- Confirm Force Logout Modal -->
		<div class="modal fade" id="confirmForceLogoutModal" tabindex="-1" aria-labelledby="confirmForceLogoutModalLabel" aria-hidden="true">
			<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header bg-warning text-dark">
				<h5 class="modal-title" id="confirmForceLogoutModalLabel">Confirm Force Logout</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
				</div>
				<div class="modal-body">
				<p>Are you sure you want to force this judge to log out?</p>
				</div>
				<div class="modal-footer">
				<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
				<button type="button" class="btn btn-warning" id="confirmForceLogoutBtn">Force Logout</button>
				</div>
			</div>
			</div>
		</div>
	</section>

	<script src="judge.js"></script>
	<script src="../script.js"></script>
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