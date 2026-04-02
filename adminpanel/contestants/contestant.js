document.addEventListener("DOMContentLoaded", function () {
    console.log("Initializing scripts...");

    loadEvents();
    loadEventFilter();
    loadContestants();

    // Handle form submission for adding contestants
    const contestantForm = document.getElementById("contestantForm");
    contestantForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const contestantNo = document.getElementById("contestant_no").value.trim();
        const category = document.getElementById("category").value;
        const eventId = document.getElementById("event").value;
        const photo = document.getElementById("photo").files[0];

        if (!name || !contestantNo || !category || !eventId || !photo) {
            showNotificationModal("Error", "Please fill in all fields.", "error");
            return;
        }

        const formData = new FormData();
        formData.append("name", name);
        formData.append("contestant_no", contestantNo);
        formData.append("category", category);
        formData.append("event_id", eventId);
        formData.append("photo", photo);

        fetch("add_contestant.php", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotificationModal("Success", "Contestant added successfully!");
                contestantForm.reset();
                loadContestants();
                bootstrap.Modal.getInstance(document.getElementById('contestantModal')).hide();
                // Re-apply filters after loading contestants
                setTimeout(applyFilters, 100);
            } else {
                showNotificationModal("Error", "Error: " + data.message, "error");
            }
        })
        .catch(error => {
            console.error("Error:", error);
            showNotificationModal("Error", "An unexpected error occurred.", "error");
        });
    });

    // Handle edit form submission
    const editForm = document.getElementById("editContestantForm");
    editForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const formData = new FormData();
        formData.append("id", document.getElementById("edit_id").value);
        formData.append("name", document.getElementById("edit_name").value.trim());
        formData.append("contestant_no", document.getElementById("edit_contestant_no").value.trim());
        formData.append("category", document.getElementById("edit_category").value);
        formData.append("event_id", document.getElementById("edit_event").value);

        const newPhoto = document.getElementById("edit_photo").files[0];
        if (newPhoto) formData.append("photo", newPhoto);

        // Log all values before sending
        console.log("Updating contestant with:");
        for (let [key, val] of formData.entries()) {
            console.log(`${key}:`, val);
        }

        fetch("update_contestant.php", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            console.log("Server response:", data); // Log response from PHP
            if (data.success) {
                showNotificationModal("Success", "Contestant updated successfully!");
                bootstrap.Modal.getInstance(document.getElementById('editContestantModal')).hide();
                loadContestants(); // Refresh table
                // Re-apply filters after loading contestants
                setTimeout(applyFilters, 100);
            } else {
                showNotificationModal("Error", "Error updating contestant: " + data.message, "error");
            }
        })
        .catch(error => {
            console.error("Error updating contestant:", error);
            showNotificationModal("Error", "An unexpected error occurred while updating.", "error");
        });
    });

    // Load Events into Dropdown
    function loadEvents() {
        fetch("get_events.php")
            .then(response => response.json())
            .then(events => {
                let eventDropdown = document.getElementById("event");
                eventDropdown.innerHTML = '<option value="">-- Select Event --</option>';
                events.forEach(ev => {
                    let option = document.createElement("option");
                    option.value = ev.id;
                    option.textContent = ev.event_name;
                    eventDropdown.appendChild(option);
                });
            })
            .catch(error => console.error("Error loading events:", error));
    }

    // Load Events into Filter Dropdown
    function loadEventFilter() {
        fetch("get_events.php")
            .then(response => response.json())
            .then(events => {
                let eventFilter = document.getElementById("eventFilter");
                eventFilter.innerHTML = '<option value="">All Events</option>';
                events.forEach(ev => {
                    let option = document.createElement("option");
                    option.value = ev.id;
                    option.textContent = ev.event_name;
                    eventFilter.appendChild(option);
                });

                // Add event listener for filter
                eventFilter.addEventListener("change", applyFilters);
            })
            .catch(error => console.error("Error loading event filter:", error));
    }

    // Load Contestants and Enable Search
    function loadContestants() {
        fetch("fetch_contestants.php")
            .then(response => response.json())
            .then(contestants => {
                const tableBody = document.querySelector(".table-data .order table tbody");
                tableBody.innerHTML = "";
    
                contestants.forEach(contestant => {
                    let photoSrc = contestant.photo || "placeholder.jpg";
                    let row = document.createElement("tr");
                    row.setAttribute("data-event-id", contestant.event_id);
                    row.innerHTML = `
                        <td><img src="${photoSrc}" alt="Contestant" width="50"></td>
                        <td>${contestant.name}</td>
                        <td>${contestant.candidate_no}</td>
                        <td>${contestant.category === '1' ? 'Male' : 'Female'}</td>
                        <td>${contestant.event_name}</td>
                        <td>
                            <button class="btn btn-primary btn-sm edit-btn" data-id="${contestant.id}"
                                    data-name="${contestant.name}"
                                    data-number="${contestant.candidate_no}"
                                    data-category="${contestant.category}"
                                    data-event="${contestant.event_id}"
                                    data-event-name="${contestant.event_name}">
                                <i class='bx bxs-edit'></i>
                            </button>
                            <button class="btn btn-danger btn-sm delete-btn" data-id="${contestant.id}">
                                <i class='bx bxs-trash'></i>
                            </button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });
    
                initializeSearch();
                bindEditButtons();
                bindDeleteButtons();
            })
            .catch(error => console.error("Error loading contestants:", error));
    }
    
    // Bind edit buttons to contestants
    function bindEditButtons() {
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', () => {
                const id = button.getAttribute('data-id');
                const name = button.getAttribute('data-name');
                const number = button.getAttribute('data-number');
                const category = button.getAttribute('data-category');
                const eventId = button.getAttribute('data-event');
                
                console.log("Edit button clicked:", {id, name, number, category, eventId});
                
                // Set form values
                document.getElementById("edit_id").value = id;
                document.getElementById("edit_name").value = name;
                document.getElementById("edit_contestant_no").value = number;
                
                // Make sure to set the correct category value - it's '1' or '2', not 'Male' or 'Female'
                const editCategoryDropdown = document.getElementById("edit_category");
                for (let i = 0; i < editCategoryDropdown.options.length; i++) {
                    if (editCategoryDropdown.options[i].value === category) {
                        editCategoryDropdown.selectedIndex = i;
                        break;
                    }
                }
                
                // Populate the event dropdown and select the current event
                populateEventDropdown(eventId);
                
                // Show the modal
                const editModal = new bootstrap.Modal(document.getElementById('editContestantModal'));
                editModal.show();
            });
        });
    }
    
    // Bind delete buttons
    function bindDeleteButtons() {
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', () => {
                const id = button.getAttribute('data-id');
                confirmDeleteContestant(id);
            });
        });
    }

    // Confirm delete contestant
    window.confirmDeleteContestant = function(id) {
        document.getElementById("confirmDeleteContestantBtn").onclick = function() {
            deleteContestant(id);
            let confirmModal = bootstrap.Modal.getInstance(document.getElementById("confirmDeleteContestantModal"));
            confirmModal.hide();
        };
        
        let confirmModal = new bootstrap.Modal(document.getElementById("confirmDeleteContestantModal"));
        confirmModal.show();
    };

    // Delete Contestant
    window.deleteContestant = function (id) {
        fetch("delete_contestant.php", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `id=${id}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotificationModal("Success", "Contestant deleted successfully!");
                loadContestants();
                // Re-apply filters after loading contestants
                setTimeout(applyFilters, 100);
            } else {
                showNotificationModal("Error", "Error deleting contestant: " + (data.message || "Unknown error"), "error");
            }
        })
        .catch(error => {
            console.error("Error deleting contestant:", error);
            showNotificationModal("Error", "An unexpected error occurred while deleting.", "error");
        });
    };
    
    // Populate event dropdown for edit form
    window.populateEventDropdown = function(selectedEventId) {
        fetch("get_events.php")
            .then(response => response.json())
            .then(events => {
                const eventSelect = document.getElementById("edit_event");
                eventSelect.innerHTML = '<option value="">Select Event</option>';
                
                events.forEach(event => {
                    const option = document.createElement("option");
                    option.value = event.id;
                    option.textContent = event.event_name;
                    
                    // Pre-select the current event
                    if (event.id == selectedEventId) {
                        option.selected = true;
                    }
                    eventSelect.appendChild(option);
                });
            })
            .catch(error => console.error("Error loading events:", error));
    };
});

// Function to show notification modal
function showNotificationModal(title, message, type = "success") {
    document.getElementById("notificationModalLabel").textContent = title;
    document.getElementById("notificationMessage").textContent = message;
    
    // Update modal header class based on type (success/error)
    const modalHeader = document.querySelector("#notificationModal .modal-header");
    modalHeader.className = "modal-header";
    if (type === "success") {
        modalHeader.classList.add("bg-success", "text-white");
    } else if (type === "error") {
        modalHeader.classList.add("bg-danger", "text-white");
    }
    
    let notificationModal = new bootstrap.Modal(document.getElementById("notificationModal"));
    notificationModal.show();
}

// Apply both search and event filters
function applyFilters() {
    const searchValue = document.getElementById("searchInput").value.toLowerCase();
    const selectedEvent = document.getElementById("eventFilter").value;
    const tableRows = document.querySelectorAll("table tbody tr");

    tableRows.forEach(row => {
        const name = row.children[1]?.textContent.toLowerCase() || "";
        const contestantNumber = row.children[2]?.textContent.toLowerCase() || "";
        const category = row.children[3]?.textContent.toLowerCase() || "";
        const event = row.children[4]?.textContent.toLowerCase() || "";
        const eventId = row.getAttribute("data-event-id");

        // Check if row matches search criteria
        const matchesSearch = name.includes(searchValue) || 
                            contestantNumber.includes(searchValue) || 
                            category.includes(searchValue) || 
                            event.includes(searchValue);

        // Check if row matches event filter
        const matchesEvent = selectedEvent === "" || eventId === selectedEvent;

        // Show row only if it matches both filters
        if (matchesSearch && matchesEvent) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
}

// Search Function
function initializeSearch() {
    const searchInput = document.getElementById("searchInput");
    
    searchInput.addEventListener("keyup", applyFilters);
}

// TOGGLE SIDEBAR
const menuBar = document.querySelector('#content nav .bx.bx-menu');
const sidebar = document.getElementById('sidebar');

menuBar.addEventListener('click', function () {
    sidebar.classList.toggle('hide');
});

// Handle responsiveness
if(window.innerWidth < 768) {
    sidebar.classList.add('hide');
}

window.addEventListener('resize', function () {
    if(this.innerWidth > 576) {
        const searchForm = document.querySelector('#content nav form');
        const searchButtonIcon = document.querySelector('#content nav form .form-input button .bx');
        
        if (searchForm && searchButtonIcon) {
            searchButtonIcon.classList.replace('bx-x', 'bx-search');
            searchForm.classList.remove('show');
        }
    }
});

// Active menu highlighting
const allSideMenu = document.querySelectorAll('#sidebar .side-menu.top li a');

function setActiveMenu() {
    const currentPage = window.location.pathname.split('/').pop();

    allSideMenu.forEach(item => {
        const li = item.parentElement;
        const linkPage = item.getAttribute('href').split('/').pop();

        if (linkPage === currentPage) {
            li.classList.add('active');
        } else {
            li.classList.remove('active');
        }
    });
}

// Run on page load
setActiveMenu();