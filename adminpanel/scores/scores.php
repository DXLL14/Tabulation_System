<?php
session_start();

// Check if user is not logged in or not admin
if (!isset($_SESSION['username']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
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
	<link rel="stylesheet" href="print.css">
	<link rel="stylesheet" href="score.css">


	<link rel="icon" type="image/x-icon" href="../../assets/img/philcst6.png">
	<title>Scores - PhilCST Tabulation System</title>
</head>
<body>

	<!-- Sidebar -->
	<section id="sidebar">
		<a href="../indexmain.php" class="brand">
			<img src="../../assets/img/cropped-philcst766.png" alt="AdminHub Logo" style="width: 600px; height: 50px; object-fit: contain; margin-right: 10px; margin-top: 10px; margin-left: 10px;">
		</a>
		<ul class="side-menu top">
			<li>
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
			<li class="active">
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

	<!-- Content -->
	<section id="content">
		<!-- Navbar -->
		<nav>
			<i class='bx bx-menu' ></i>

		</nav>

		<!-- Main Content -->
		<main>
			<div class="head-title">
				<div class="left">
					<h1>Score Dashboard</h1>
				</div>
			</div>

			<div class="table-data">
				<div class="order">
					<div class="head">
						<h3>Scores</h3>	
						<select id="eventSelect" class="form-select" style="border-radius: 10px; font-size: 16px;">
							<option value="" disabled selected>Select Event</option>
						</select>
						<select id="roundTypeSelect" class="form-select" style="border-radius: 10px; font-size: 16px;">
							<option value="" selected disabled>Select Criteria Type</option>
							<option value="preliminary">Preliminary Criteria</option>
							<option value="top10">Top 10</option>
							<option value="top5">Top 5</option>
							<option value="top3">Top 3</option>
						</select>
						<select id="categorySelect" name="category" class="form-select" style="border-radius: 10px; font-size: 16px;">
							<option value="" selected disabled>Select Category</option>
							<option value="all">Select All</option>
							<option value="1">Male</option>
							<option value="2">Female</option>
						</select>
						<select id="criteriaSelect" class="form-select" style="border-radius: 10px; font-size: 16px;">
							<option value="" selected disabled>Select Score</option>
							<option value="">Overall</option>
						</select>
						<i class='bx bxs-printer'></i>
					</div>
					<table>
						<thead>
							<tr>
								<th>Photo</th>
								<th>Candidate Name</th>
								<th>Candidate Number</th>
								<th>Event Name</th>
								<th>Criteria Name</th>
								<th>Total Score</th>
								<th>Rank</th>
							</tr>
						</thead>
						<tbody>
							<!-- Table data will load here -->
						</tbody>
					</table>
				</div>
			</div>
		</main>
	</section>

	
	<!-- Response Modal -->
	<div id="responseModal" class="modal-overlay">
		<div class="modal-content" id="responseMessage"></div>
	</div>
	
	<!-- Print Modal -->
	<div class="modal fade" id="printModal" tabindex="-1" role="dialog">
		<div class="modal-dialog modal-lg" role="document">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title">Print Options</h5>
					<button type="button" class="btn-close" data-bs-dismiss="modal"></button>
				</div>
				<div class="modal-body">
					<div class="mb-3">
						<label for="printEventSelect" class="form-label fw-bold">Select Event:</label>
						<select id="printEventSelect" class="form-select">
							<!-- Options will be populated by JS -->
						</select>
					</div>
					<div class="mb-3">
						<label for="printRoundTypeSelect" class="form-label fw-bold">Select Criteria Type:</label>
						<select id="printRoundTypeSelect" class="form-select">
							<option value="" selected disabled>Select Criteria Type</option>
							<option value="preliminary">Preliminary Criteria</option>
							<option value="top10">Top 10</option>
							<option value="top5">Top 5</option>
							<option value="top3">Top 3</option>
						</select>
					</div>
					<div class="mb-3">
						<label for="printCategorySelect" class="form-label fw-bold">Select Category:</label>
						<select id="printCategorySelect" class="form-select">
							<!-- Options will be populated by JS -->
						</select>
					</div>
					<div class="mb-3">
						<label class="form-label fw-bold">Select Criteria:</label>
						<div id="printCriteriaContainer" class="border rounded p-2" style="max-height: 150px; overflow-y: auto;">
							<!-- Checkboxes will be populated by JS -->
						</div>
					</div>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
					<button type="button" id="printBtn" class="btn btn-primary">Print</button>
				</div>
			</div>
		</div>
	</div>


	<script src="print.js"></script>
	<script src="score.js"></script>
	<script src="show_score.js"></script>
	<script src="clear_data.js"></script>
	<script src="../../assets/js/bootstrap.bundle.min.js"></script>
	<script>
		let ws;
		let reconnectAttempts = 0;
		const maxReconnects = 1;

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