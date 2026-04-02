document.addEventListener("DOMContentLoaded", function () {
    console.log("🔹 DOM Loaded - Calling fetchEvents()");
    fetchEvents();
    initializeModalEvents();
    addPercentageEventListeners();
    updatePercentageDisplays();
});

let events = [];
let selectedRounds = new Set();

// Initialize modal events for reset functionality
function initializeModalEvents() {
    // Reset kapag mag-oopen ng add modal
    const addModal = document.getElementById('addEventModal');
    if (addModal) {
        addModal.addEventListener('show.bs.modal', function() {
            resetFormSelections();
            setTimeout(updatePercentageDisplays, 300);
        });
    }
    
    // Reset kapag na-close ang edit modal
    const editModal = document.getElementById('editEventModal');
    if (editModal) {
        editModal.addEventListener('hidden.bs.modal', function() {
            resetFormSelections();
        });
        editModal.addEventListener('shown.bs.modal', function() {
            setTimeout(updatePercentageDisplays, 300);
        });
    }
    
    // Reset din kapag cinancel ang add modal
    if (addModal) {
        addModal.addEventListener('hidden.bs.modal', function() {
            resetFormSelections();
        });
    }
}

// Comprehensive reset function
function resetFormSelections() {
    // Reset selected rounds
    selectedRounds.clear();
    
    // Reset all round type selects
    const roundSelects = document.querySelectorAll('.round-type');
    roundSelects.forEach(select => {
        select.value = '';
        select.setAttribute('data-previous-value', '');
    });
    
    // Enable all options
    const allOptions = document.querySelectorAll('.round-type option');
    allOptions.forEach(option => {
        option.disabled = false;
    });
    
    console.log("🔹 Form selections reset complete");
}

// Helper function to show notification modal
function showNotification(message, type = 'success') {
    const modal = new bootstrap.Modal(document.getElementById('notificationModal'));
    const messageElement = document.getElementById('notificationMessage');
    const headerElement = document.querySelector('#notificationModal .modal-header');
    
    // Set message
    messageElement.textContent = message;
    
    // Set appropriate header color based on type
    headerElement.className = 'modal-header';
    if (type === 'success') {
        headerElement.classList.add('bg-success', 'text-white');
        document.getElementById('notificationModalLabel').textContent = 'Success';
    } else if (type === 'error') {
        headerElement.classList.add('bg-danger', 'text-white');
        document.getElementById('notificationModalLabel').textContent = 'Error';
    } else if (type === 'warning') {
        headerElement.classList.add('bg-warning', 'text-dark');
        document.getElementById('notificationModalLabel').textContent = 'Warning';
    }
    
    // Show the modal
    modal.show();
}

// Function to update round selection options
function updateRoundSelectionOptions() {
    const roundSelects = document.querySelectorAll('.round-type');
    
    roundSelects.forEach(select => {
        const currentValue = select.value;
        
        // Enable all options first
        Array.from(select.options).forEach(option => {
            option.disabled = false;
        });
        
        // Disable already selected options (except for the current selection)
        Array.from(select.options).forEach(option => {
            if (option.value && option.value !== '' && selectedRounds.has(option.value) && option.value !== currentValue) {
                option.disabled = true;
            }
        });
        
        // Additional restrictions based on selection logic
        if (selectedRounds.has('top5')) {
            // If Top 5 is selected, disable Top 10 in other selects
            const top10Option = select.querySelector('option[value="top10"]');
            if (top10Option && currentValue !== 'top10') {
                top10Option.disabled = true;
            }
        } else if (selectedRounds.has('top3')) {
            // If Top 3 is selected, disable Top 10 and Top 5 in other selects
            const top10Option = select.querySelector('option[value="top10"]');
            const top5Option = select.querySelector('option[value="top5"]');
            if (top10Option && currentValue !== 'top10') {
                top10Option.disabled = true;
            }
            if (top5Option && currentValue !== 'top5') {
                top5Option.disabled = true;
            }
        }
    });
}

// Function to handle round selection change
function handleRoundSelectionChange(selectElement) {
    const selectedValue = selectElement.value;
    const previousValue = selectElement.getAttribute('data-previous-value') || '';
    
    // Update selected rounds set
    if (previousValue && previousValue !== '') {
        selectedRounds.delete(previousValue);
    }
    
    if (selectedValue && selectedValue !== '') {
        selectedRounds.add(selectedValue);
    }
    
    // Store current value as previous for next change
    selectElement.setAttribute('data-previous-value', selectedValue);
    
    // Update all round selection options
    updateRoundSelectionOptions();
}

// Fix the addEventBtn click handler
document.getElementById("addEventBtn").addEventListener("click", function () {
    let eventName = document.getElementById("eventName").value;
    let criteriaElements = document.querySelectorAll("#criteriaContainer .criteria-group");
    let roundCriteriaElements = document.querySelectorAll("#roundCriteriaContainer .round-criteria-group");

    // Validate event name
    if (!eventName.trim()) {
        showNotification("Please enter an event name", "warning");
        return;
    }

    let criteriaData = [];
    let roundCriteriaData = [];

    // Validate and collect regular criteria data
    let isValid = validateAndCollectCriteria(criteriaElements, criteriaData, "regular");
    if (!isValid) return;

    // Validate round criteria selection
    let hasInvalidRoundSelection = false;
    let roundTypes = new Set();
    
    roundCriteriaElements.forEach(roundElement => {
        let roundType = roundElement.querySelector(".round-type").value;
        if (!roundType || roundType === '') {
            showNotification("Please select a criteria type for all criteria", "warning");
            hasInvalidRoundSelection = true;
            return;
        }
        
        // Check for duplicate round types
        if (roundTypes.has(roundType)) {
            showNotification(`Round type "${roundType}" is already selected. Please choose a different criteria type.`, "warning");
            hasInvalidRoundSelection = true;
            return;
        }
        
        roundTypes.add(roundType);
    });
    
    if (hasInvalidRoundSelection) return;

    // Validate and collect round criteria data
    roundCriteriaElements.forEach(roundElement => {
        let roundType = roundElement.querySelector(".round-type").value;
        let roundCriteriaElements = roundElement.querySelectorAll(".round-criteria-inner-container .criteria-group");
        let roundCriteriaList = [];
        
        let roundIsValid = validateAndCollectCriteria(roundCriteriaElements, roundCriteriaList, "round");
        if (!roundIsValid) {
            isValid = false;
            return;
        }
        
        roundCriteriaData.push({
            round_type: roundType,
            criteria: roundCriteriaList
        });
    });
    
    if (!isValid) return;

    fetch("add_event.php", {
        method: "POST",
        body: JSON.stringify({ 
            event_name: eventName, 
            criteria: criteriaData,
            round_criteria: roundCriteriaData
        }),
        headers: { "Content-Type": "application/json" }
    })
    .then(response => response.text())
    .then(data => {
        console.log("Raw Response:", data);
        try {
            let jsonData = JSON.parse(data);
            if (jsonData.status === "success") {
                showNotification("Event added successfully!", "success");
                setTimeout(() => location.reload(), 1500);
            } else {
                showNotification("Error: " + jsonData.message, "error");
            }
        } catch (e) {
            showNotification("JSON Parsing Error: Invalid response from server.", "error");
            console.error("JSON Parsing Error:", e);
        }
    })
    .catch(error => {
        showNotification("Network Error: Unable to connect to the server.", "error");
        console.error("Fetch Error:", error);
    });
});

function deleteEvent(eventId) {
    // Show confirmation modal instead of using confirm()
    const modal = new bootstrap.Modal(document.getElementById('confirmationModal'));
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    
    // Store the current onclick handler
    const existingHandler = confirmBtn.onclick;
    
    // Set new handler for this specific delete operation
    confirmBtn.onclick = function() {
        fetch("delete_event.php", {
            method: "POST",
            body: JSON.stringify({ eventId: eventId }),
            headers: { "Content-Type": "application/json" }
        })
        .then(response => response.json())
        .then(data => {
            modal.hide(); // Hide the confirmation modal
            
            if (data.status === "success") {
                showNotification("Event deleted successfully!", "success");
                // Add a slight delay before reload to allow the user to see the notification
                setTimeout(() => location.reload(), 1500);
            } else {
                showNotification("Error: " + data.message, "error");
            }
        })
        .catch(error => {
            modal.hide(); // Hide the confirmation modal
            console.error("❌ Fetch Error:", error);
            showNotification("Network Error: Unable to delete event.", "error");
        });
        
        // Restore the original handler (for cleanup)
        confirmBtn.onclick = existingHandler;
    };
    
    // Show the modal
    modal.show();
}

function fetchEvents() {
    fetch("get_events.php")
        .then(response => response.text())
        .then(data => {
            console.log("🔹 Raw Response from get_events.php:", data);
            try {
                let jsonData = JSON.parse(data);
                console.log("✅ Parsed JSON Data:", jsonData);
                events = jsonData;
                updateEventTable();
            } catch (e) {
                console.error("❌ JSON Parsing Error:", e);
                showNotification("Error: Invalid response from server.", "error");
            }
        })
        .catch(error => {
            console.error("❌ Fetch Error:", error);
            showNotification("Failed to load events.", "error");
        });
}

function updateEventTable() {
    let eventTable = document.getElementById("eventTableBody");
    eventTable.innerHTML = "";

    if (!Array.isArray(events) || events.length === 0) {
        console.warn("⚠ No events found!");
        eventTable.innerHTML = `<tr><td colspan="4">No events available</td></tr>`;
        return;
    }

    events.forEach(event => {
        let criteriaHTML = '';
        let roundCriteriaHTML = '';

        // Add Regular Round section if there are regular criteria
        if (event.criteria && event.criteria.length > 0) {
            criteriaHTML = `<div class="round-criteria-display regular-round">
                <strong class="round-title">PRELIMINARY CRITERIA</strong>
                <div class="criteria-container">${formatCriteria(event.criteria, true)}</div>
            </div>`;
        }

        // Add other rounds
        roundCriteriaHTML = formatRoundCriteria(event.round_criteria || []);

        let row = `<tr>
            <td>${event.id}</td>
            <td>${event.name}</td>
            <td class="criteria-display">
                ${criteriaHTML}
                ${roundCriteriaHTML}
            </td>
            <td>
                <button class="btn btn-warning" onclick="editEvent(${event.id})"><i class='bx bxs-edit'></i></button>
                <button class="btn btn-danger" onclick="deleteEvent(${event.id})"><i class='bx bxs-trash'></i></button>
            </td>
        </tr>`;

        eventTable.innerHTML += row;
    });

    console.log("✅ Table Updated Successfully!");
}

function formatCriteria(criteria, isRegularRound = false) {
    let criteriaArray = Object.values(criteria || {});

    if (criteriaArray.length === 0) return '';

    return criteriaArray.map(c => {
        let percentage = parseFloat(c.percentage || "0").toFixed(0);
        
        let subCriteriaList = (c.sub_criteria || []).map(s => {
            let subMinScore = parseFloat(s.min_score || "0").toFixed(0);
            let subMaxScore = parseFloat(s.max_score || "0").toFixed(0);
            let subPercentage = parseFloat(s.percentage || "0").toFixed(0);
            
            return `<li><strong>${s.name}</strong> (Min: ${subMinScore}, Max: ${subMaxScore}, %: ${subPercentage})</li>`;
        }).join("");

        // If there are sub-criteria, don't show criteria min/max scores
        if (subCriteriaList.length > 0) {
            return `<div class="criteria-item">
                        <strong>${c.name}</strong> <span class="percentage-badge">${percentage}%</span>
                        <ul class="sub-criteria-list">${subCriteriaList}</ul>
                    </div>`;
        } else {
            let minScore = parseFloat(c.min_score || "0").toFixed(0);
            let maxScore = parseFloat(c.max_score || "0").toFixed(0);
            return `<div class="criteria-item">
                        <strong>${c.name}</strong> <span class="percentage-badge">${percentage}%</span>
                        <span class="score-range">(Min: ${minScore}, Max: ${maxScore})</span>
                    </div>`;
        }
    }).join("");
}

function formatRoundCriteria(roundCriteria) {
    if (roundCriteria.length === 0) return '';

    return roundCriteria.map(round => {
        let roundType = round.round_type;
        let roundLabel = '';
        
        // Convert round_type to display format
        switch(roundType) {
            case 'top10':
                roundLabel = 'TOP 10 CRITERIA';
                break;
            case 'top5':
                roundLabel = 'TOP 5 CRITERIA';
                break;
            case 'top3':
                roundLabel = 'TOP 3 CRITERIA';
                break;
            default:
                roundLabel = roundType.toUpperCase() + ' CRITERIA';
        }
        
        let criteriaHTML = formatCriteria(round.criteria || []);
        
        return `<div class="round-criteria-display">
                    <strong class="round-title">${roundLabel}</strong>
                    <div class="criteria-container">${criteriaHTML}</div>
                </div>`;
    }).join("");
}

function addCriteria(containerId = "criteriaContainer") {
    let criteriaContainer = document.getElementById(containerId);

    let criteriaDiv = document.createElement("div");
    criteriaDiv.classList.add("criteria-group", "mb-4", "p-3", "border", "rounded");
    criteriaDiv.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <label>Criteria Name:</label>
                <input type="text" class="form-control criteria-name" placeholder="Criteria Name">
            </div>
            <div class="col-md-2 criteria-score-container">
                <label>Min Score:</label>
                <input type="number" class="form-control criteria-min-score" placeholder="Min Score" value="" min="0" step="1">
            </div>
            <div class="col-md-2 criteria-score-container">
                <label>Max Score:</label>
                <input type="number" class="form-control criteria-max-score" placeholder="Max Score" value="" min="0" step="1">
            </div>
            <div class="col-md-2">
                <label>Percentage:</label>
                <input type="number" class="form-control criteria-percentage" placeholder="Percentage" value="" min="0" max="100" step="1">
            </div>
        </div>
        
        <div class="mt-3">
            <label>Sub-Criteria:</label>
            <div class="sub-criteria-container"></div>
        </div>
        
        <div class="d-flex justify-content-between mt-3">
            <button class="btn btn-secondary" type="button" onclick="addSubCriteria(this)">+ Add Sub-Criteria</button>
            <button class="btn btn-danger" type="button" onclick="removeCriteria(this)">Remove Criteria</button>
        </div>
    `;

    criteriaContainer.appendChild(criteriaDiv);
    setTimeout(updatePercentageDisplays, 100);
}

function addSubCriteria(button) {
    let criteriaGroup = button.closest(".criteria-group");
    let subCriteriaContainer = criteriaGroup.querySelector(".sub-criteria-container");
    
    let subCriteriaRow = document.createElement("div");
    subCriteriaRow.classList.add("sub-criteria-row", "row", "mt-2");
    subCriteriaRow.innerHTML = `
        <div class="col-md-5">
            <input type="text" class="form-control sub-criteria-name" placeholder="Sub-Criteria Name">
        </div>
        <div class="col-md-2">
            <input type="number" class="form-control sub-criteria-min-score" placeholder="Min Score" value="" min="0" step="1">
        </div>
        <div class="col-md-2">
            <input type="number" class="form-control sub-criteria-max-score" placeholder="Max Score" value="" min="0" step="1">
        </div>
        <div class="col-md-2">
            <input type="number" class="form-control sub-criteria-percentage" placeholder="%" value="" min="0" max="100" step="1">
        </div>
        <div class="col-md-1">
            <button class="btn btn-danger btn-sm" type="button" onclick="removeSubCriteria(this)">❌</button>
        </div>
    `;
    
    subCriteriaContainer.appendChild(subCriteriaRow);
    
    updateCriteriaScoreVisibility(criteriaGroup);
    setTimeout(updatePercentageDisplays, 100);
}

function updateCriteriaScoreVisibility(criteriaGroup) {
    let subCriteriaRows = criteriaGroup.querySelectorAll(".sub-criteria-row");
    let criteriaScoreContainers = criteriaGroup.querySelectorAll(".criteria-score-container");
    
    if (subCriteriaRows.length > 0) {
        criteriaScoreContainers.forEach(container => {
            container.style.display = "none";
        });
    } else {
        criteriaScoreContainers.forEach(container => {
            container.style.display = "block";
        });
    }
}

function removeCriteria(button) {
    let criteriaDiv = button.closest(".criteria-group");
    criteriaDiv.remove();
    setTimeout(updatePercentageDisplays, 100);
}

function removeSubCriteria(button) {
    let subCriteriaRow = button.closest(".sub-criteria-row");
    let criteriaGroup = subCriteriaRow.closest(".criteria-group");
    
    subCriteriaRow.remove();
    updateCriteriaScoreVisibility(criteriaGroup);
    setTimeout(updatePercentageDisplays, 100);
}

// Round Criteria Functions
function addRoundCriteria() {
    const roundCriteriaContainer = document.getElementById("roundCriteriaContainer");
    
    const roundDiv = document.createElement("div");
    roundDiv.classList.add("round-criteria-group", "mb-4", "p-3", "border", "rounded", "bg-light");
    roundDiv.innerHTML = `
        <div class="row mb-3">
            <div class="col-md-6">
                <label>Criteria Type:</label>
                <select class="form-control round-type" onchange="handleRoundSelectionChange(this)">
                    <option value="">Select a type</option>
                    <option value="top10">Top 10</option>
                    <option value="top5">Top 5</option>
                    <option value="top3">Top 3</option>
                </select>
            </div>
            <div class="col-md-6 d-flex align-items-end">
                <button class="btn btn-primary" type="button" onclick="addCriteriaToRound(this)">+ Add Criteria to Round</button>
            </div>
        </div>
        
        <div class="round-criteria-inner-container"></div>
        
        <div class="d-flex justify-content-end mt-3">
            <button class="btn btn-danger" type="button" onclick="removeRoundCriteria(this)">Remove Round</button>
        </div>
    `;
    
    roundCriteriaContainer.appendChild(roundDiv);
    
    // Update selection options after adding new round
    handleRoundSelectionChange(roundDiv.querySelector('.round-type'));
    setTimeout(updatePercentageDisplays, 100);
}

function addCriteriaToRound(button) {
    const roundGroup = button.closest(".round-criteria-group");
    const roundTypeSelect = roundGroup.querySelector('.round-type');
    
    // Check if round type is selected
    if (!roundTypeSelect.value || roundTypeSelect.value === '') {
        showNotification("Please select a criteria type first", "warning");
        return;
    }
    
    const innerContainer = roundGroup.querySelector(".round-criteria-inner-container");
    
    const criteriaDiv = document.createElement("div");
    criteriaDiv.classList.add("criteria-group", "mb-3", "p-3", "border", "rounded", "bg-white");
    criteriaDiv.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <label>Criteria Name:</label>
                <input type="text" class="form-control criteria-name" placeholder="Criteria Name">
            </div>
            <div class="col-md-2 criteria-score-container">
                <label>Min Score:</label>
                <input type="number" class="form-control criteria-min-score" placeholder="Min Score" value="" min="0" step="1">
            </div>
            <div class="col-md-2 criteria-score-container">
                <label>Max Score:</label>
                <input type="number" class="form-control criteria-max-score" placeholder="Max Score" value="" min="0" step="1">
            </div>
            <div class="col-md-2">
                <label>Percentage:</label>
                <input type="number" class="form-control criteria-percentage" placeholder="Percentage" value="" min="0" max="100" step="1">
            </div>
        </div>
        
        <div class="mt-3">
            <label>Sub-Criteria:</label>
            <div class="sub-criteria-container"></div>
        </div>
        
        <div class="d-flex justify-content-between mt-3">
            <button class="btn btn-secondary" type="button" onclick="addSubCriteria(this)">+ Add Sub-Criteria</button>
            <button class="btn btn-danger" type="button" onclick="removeCriteria(this)">Remove Criteria</button>
        </div>
    `;
    
    innerContainer.appendChild(criteriaDiv);
    setTimeout(updatePercentageDisplays, 100);
}

function removeRoundCriteria(button) {
    const roundDiv = button.closest(".round-criteria-group");
    const roundType = roundDiv.querySelector('.round-type').value;
    
    // Remove from selected rounds
    if (roundType && roundType !== '') {
        selectedRounds.delete(roundType);
    }
    
    roundDiv.remove();
    
    // Update selection options after removal
    updateRoundSelectionOptions();
    setTimeout(updatePercentageDisplays, 100);
}

// Helper function to validate and collect criteria data
function validateAndCollectCriteria(criteriaElements, criteriaData, type) {
    let totalPercentage = 0;
    let isValid = true;

    criteriaElements.forEach(criteria => {
        let criteriaName = criteria.querySelector(".criteria-name").value;
        
        if (!criteriaName.trim()) {
            showNotification("Please enter a name for all criteria", "warning");
            isValid = false;
            return;
        }
        
        let criteriaMinScore = parseFloat(criteria.querySelector(".criteria-min-score").value);
        let criteriaMaxScore = parseFloat(criteria.querySelector(".criteria-max-score").value);
        let criteriaPercentage = parseFloat(criteria.querySelector(".criteria-percentage").value);
        
        if (isNaN(criteriaPercentage)) {
            showNotification("Please enter a valid percentage for all criteria", "warning");
            isValid = false;
            return;
        }
        
        totalPercentage += criteriaPercentage;
        
        let subCriteriaElements = criteria.querySelectorAll(".sub-criteria-row");
        let subCriteriaData = [];
        let totalSubCriteriaPercentage = 0;
        
        subCriteriaElements.forEach(sub => {
            let subName = sub.querySelector(".sub-criteria-name").value;
            
            if (!subName.trim()) {
                showNotification("Please enter a name for all sub-criteria", "warning");
                isValid = false;
                return;
            }
            
            let subMinScore = parseFloat(sub.querySelector(".sub-criteria-min-score").value);
            let subMaxScore = parseFloat(sub.querySelector(".sub-criteria-max-score").value);
            let subPercentage = parseFloat(sub.querySelector(".sub-criteria-percentage").value);
            
            if (isNaN(subPercentage)) {
                showNotification("Please enter a valid percentage for all sub-criteria", "warning");
                isValid = false;
                return;
            }
            
            totalSubCriteriaPercentage += subPercentage;
            
            subCriteriaData.push({
                name: subName,
                min_score: subMinScore.toFixed(0),
                max_score: subMaxScore.toFixed(0),
                percentage: subPercentage.toFixed(0)
            });
        });
        
        if (subCriteriaElements.length > 0 && Math.abs(totalSubCriteriaPercentage - 100) > 0.01) {
            showNotification(`Sub-criteria percentages for "${criteriaName}" must add up to 100%. Current total: ${totalSubCriteriaPercentage.toFixed(2)}%`, "warning");
            isValid = false;
            return;
        }

        criteriaData.push({ 
            name: criteriaName, 
            min_score: criteriaMinScore.toFixed(0),
            max_score: criteriaMaxScore.toFixed(0),
            percentage: criteriaPercentage.toFixed(0),
            sub_criteria: subCriteriaData 
        });
    });
    
    // For regular criteria, check if total percentage equals 100%
    if (type === "regular" && Math.abs(totalPercentage - 100) > 0.01) {
        showNotification(`All criteria percentages must add up to 100%. Current total: ${totalPercentage.toFixed(2)}%`, "warning");
        isValid = false;
    }
    
    // For round criteria, each round's criteria should total 100% separately
    if (type === "round" && criteriaElements.length > 0 && Math.abs(totalPercentage - 100) > 0.01) {
        showNotification(`Criteria percentages in each round must add up to 100%. Current total: ${totalPercentage.toFixed(2)}%`, "warning");
        isValid = false;
    }
    
    return isValid;
}

// Edit Event Functions
function editEvent(eventId) {
    console.log("🛠 Editing Event ID:", eventId);
    let event = events.find(e => e.id == eventId);

    if (!event) {
        console.warn("⚠ Event not found in events list.");
        return;
    }

    // Reset selected rounds for edit mode
    selectedRounds.clear();
    
    // Add existing round types to selectedRounds
    if (event.round_criteria && event.round_criteria.length > 0) {
        event.round_criteria.forEach(round => {
            if (round.round_type) {
                selectedRounds.add(round.round_type);
            }
        });
    }

    document.getElementById("editEventId").value = event.id;
    document.getElementById("editEventName").value = event.name;

    // Clear and populate criteria
    let criteriaContainer = document.getElementById("editCriteriaContainer");
    criteriaContainer.innerHTML = "";

    // Clear and populate round criteria
    let roundCriteriaContainer = document.getElementById("editRoundCriteriaContainer");
    if (!roundCriteriaContainer) {
        const editModalBody = document.querySelector("#editEventModal .modal-body");
        const roundCriteriaHTML = `
            <h5 class="mt-4">Round Criteria</h5>
            <div id="editRoundCriteriaContainer"></div>
            <button class="btn btn-info mt-2" onclick="addEditRoundCriteria()">+ Add New Round Criteria</button>
        `;
        criteriaContainer.insertAdjacentHTML('afterend', roundCriteriaHTML);
        roundCriteriaContainer = document.getElementById("editRoundCriteriaContainer");
    } else {
        roundCriteriaContainer.innerHTML = "";
    }

    // Populate regular criteria
    if (event.criteria && event.criteria.length > 0) {
        event.criteria.forEach(criteria => {
            if (!criteria.round_type || criteria.round_type === 'regular') {
                addEditCriteria(criteria, criteriaContainer);
            }
        });
    }

    // Populate round criteria
    if (event.round_criteria && event.round_criteria.length > 0) {
        event.round_criteria.forEach(round => {
            addEditRoundCriteria(round, roundCriteriaContainer);
        });
    }

    // Update selection options after populating rounds
    updateRoundSelectionOptions();

    let editModal = new bootstrap.Modal(document.getElementById("editEventModal"));
    editModal.show();
}

function addEditCriteria(criteriaData = null, container = null) {
    if (!container) {
        container = document.getElementById("editCriteriaContainer");
    }
    
    const criteriaDiv = document.createElement("div");
    criteriaDiv.classList.add("criteria-group", "mb-4", "p-3", "border", "rounded");
    
    const criteriaId = criteriaData ? criteriaData.id : '';
    const criteriaName = criteriaData ? criteriaData.name : '';
    const criteriaMinScore = criteriaData ? parseFloat(criteriaData.min_score || '0').toFixed(0) : '';
    const criteriaMaxScore = criteriaData ? parseFloat(criteriaData.max_score || '0').toFixed(0) : '';
    const criteriaPercentage = criteriaData ? parseFloat(criteriaData.percentage || '0').toFixed(0) : '';
    
    criteriaDiv.innerHTML = `
        <input type="hidden" class="criteria-id" value="${criteriaId}">
        <div class="row">
            <div class="col-md-6">
                <label>Criteria Name:</label>
                <input type="text" class="form-control criteria-name" value="${criteriaName}" placeholder="Criteria Name">
            </div>
            <div class="col-md-2 criteria-score-container">
                <label>Min Score:</label>
                <input type="number" class="form-control criteria-min-score" placeholder="Min Score" value="${criteriaMinScore}" min="0" step="1">
            </div>
            <div class="col-md-2 criteria-score-container">
                <label>Max Score:</label>
                <input type="number" class="form-control criteria-max-score" placeholder="Max Score" value="${criteriaMaxScore}" min="0" step="1">
            </div>
            <div class="col-md-2">
                <label>Percentage:</label>
                <input type="number" class="form-control criteria-percentage" placeholder="Percentage" value="${criteriaPercentage}" min="0" max="100" step="1">
            </div>
        </div>
        
        <div class="mt-3">
            <label>Sub-Criteria:</label>
            <div class="sub-criteria-container">
                ${criteriaData && criteriaData.sub_criteria ? criteriaData.sub_criteria.map(sub => `
                    <div class="sub-criteria-row row mt-2">
                        <input type="hidden" class="sub-criteria-id" value="${sub.id || ''}">
                        <div class="col-md-5">
                            <input type="text" class="form-control sub-criteria-name" value="${sub.name}" placeholder="Sub-Criteria Name">
                        </div>
                        <div class="col-md-2">
                            <input type="number" class="form-control sub-criteria-min-score" placeholder="Min Score" value="${parseFloat(sub.min_score || '0').toFixed(0)}" min="0" step="1">
                        </div>
                        <div class="col-md-2">
                            <input type="number" class="form-control sub-criteria-max-score" placeholder="Max Score" value="${parseFloat(sub.max_score || '0').toFixed(0)}" min="0" step="1">
                        </div>
                        <div class="col-md-2">
                            <input type="number" class="form-control sub-criteria-percentage" placeholder="%" value="${parseFloat(sub.percentage || '0').toFixed(0)}" min="0" max="100" step="1">
                        </div>
                        <div class="col-md-1">
                            <button class="btn btn-danger btn-sm" type="button" onclick="removeSubCriteria(this)">❌</button>
                        </div>
                    </div>
                `).join('') : ''}
            </div>
        </div>
        
        <div class="d-flex justify-content-between mt-3">
            <button class="btn btn-secondary" type="button" onclick="addEditSubCriteria(this)">+ Add Sub-Criteria</button>
            <button class="btn btn-danger" type="button" onclick="removeCriteria(this)">Remove Criteria</button>
        </div>
    `;
    
    container.appendChild(criteriaDiv);
    updateCriteriaScoreVisibility(criteriaDiv);
    setTimeout(updatePercentageDisplays, 100);
}

function addEditRoundCriteria(roundData = null, container = null) {
    if (!container) {
        container = document.getElementById("editRoundCriteriaContainer");
    }
    
    const roundDiv = document.createElement("div");
    roundDiv.classList.add("round-criteria-group", "mb-4", "p-3", "border", "rounded", "bg-light");
    
    const roundType = roundData ? roundData.round_type : '';
    
    roundDiv.innerHTML = `
        <div class="row mb-3">
            <div class="col-md-6">
                <label>Criteria Type:</label>
                <select class="form-control round-type" onchange="handleRoundSelectionChange(this)" data-previous-value="${roundType}">
                    <option value="">Select a type</option>
                    <option value="top10" ${roundType === 'top10' ? 'selected' : ''}>Top 10</option>
                    <option value="top5" ${roundType === 'top5' ? 'selected' : ''}>Top 5</option>
                    <option value="top3" ${roundType === 'top3' ? 'selected' : ''}>Top 3</option>
                </select>
            </div>
            <div class="col-md-6 d-flex align-items-end">
                <button class="btn btn-primary" type="button" onclick="addEditCriteriaToRound(this)">+ Add Criteria to Round</button>
            </div>
        </div>
        
        <div class="round-criteria-inner-container">
            ${roundData && roundData.criteria ? roundData.criteria.map(criteria => `
                <div class="criteria-group mb-3 p-3 border rounded bg-white">
                    <input type="hidden" class="criteria-id" value="${criteria.id || ''}">
                    <div class="row">
                        <div class="col-md-6">
                            <label>Criteria Name:</label>
                            <input type="text" class="form-control criteria-name" value="${criteria.name}" placeholder="Criteria Name">
                        </div>
                        <div class="col-md-2 criteria-score-container">
                            <label>Min Score:</label>
                            <input type="number" class="form-control criteria-min-score" placeholder="Min Score" value="${parseFloat(criteria.min_score || '0').toFixed(0)}" min="0" step="1">
                        </div>
                        <div class="col-md-2 criteria-score-container">
                            <label>Max Score:</label>
                            <input type="number" class="form-control criteria-max-score" placeholder="Max Score" value="${parseFloat(criteria.max_score || '0').toFixed(0)}" min="0" step="1">
                        </div>
                        <div class="col-md-2">
                            <label>Percentage:</label>
                            <input type="number" class="form-control criteria-percentage" placeholder="Percentage" value="${parseFloat(criteria.percentage || '0').toFixed(0)}" min="0" max="100" step="1">
                        </div>
                    </div>
                    
                    <div class="mt-3">
                        <label>Sub-Criteria:</label>
                        <div class="sub-criteria-container">
                            ${criteria.sub_criteria ? criteria.sub_criteria.map(sub => `
                                <div class="sub-criteria-row row mt-2">
                                    <input type="hidden" class="sub-criteria-id" value="${sub.id || ''}">
                                    <div class="col-md-5">
                                        <input type="text" class="form-control sub-criteria-name" value="${sub.name}" placeholder="Sub-Criteria Name">
                                    </div>
                                    <div class="col-md-2">
                                        <input type="number" class="form-control sub-criteria-min-score" placeholder="Min Score" value="${parseFloat(sub.min_score || '0').toFixed(0)}" min="0" step="1">
                                    </div>
                                    <div class="col-md-2">
                                        <input type="number" class="form-control sub-criteria-max-score" placeholder="Max Score" value="${parseFloat(sub.max_score || '0').toFixed(0)}" min="0" step="1">
                                    </div>
                                    <div class="col-md-2">
                                        <input type="number" class="form-control sub-criteria-percentage" placeholder="%" value="${parseFloat(sub.percentage || '0').toFixed(0)}" min="0" max="100" step="1">
                                    </div>
                                    <div class="col-md-1">
                                        <button class="btn btn-danger btn-sm" type="button" onclick="removeSubCriteria(this)">❌</button>
                                    </div>
                                </div>
                            `).join('') : ''}
                        </div>
                    </div>
                    
                    <div class="d-flex justify-content-between mt-3">
                        <button class="btn btn-secondary" type="button" onclick="addEditSubCriteria(this)">+ Add Sub-Criteria</button>
                        <button class="btn btn-danger" type="button" onclick="removeCriteria(this)">Remove Criteria</button>
                    </div>
                </div>
            `).join('') : ''}
        </div>
        
        <div class="d-flex justify-content-end mt-3">
            <button class="btn btn-danger" type="button" onclick="removeEditRoundCriteria(this)">Remove Round</button>
        </div>
    `;
    
    container.appendChild(roundDiv);
    
    // Update selection options after adding round in edit mode
    handleRoundSelectionChange(roundDiv.querySelector('.round-type'));
    setTimeout(updatePercentageDisplays, 100);
}

function removeEditRoundCriteria(button) {
    const roundDiv = button.closest(".round-criteria-group");
    const roundType = roundDiv.querySelector('.round-type').value;
    
    // Remove from selected rounds
    if (roundType && roundType !== '') {
        selectedRounds.delete(roundType);
    }
    
    roundDiv.remove();
    
    // Update selection options after removal
    updateRoundSelectionOptions();
    setTimeout(updatePercentageDisplays, 100);
}

function addEditCriteriaToRound(button) {
    const roundGroup = button.closest(".round-criteria-group");
    const roundTypeSelect = roundGroup.querySelector('.round-type');
    
    // Check if round type is selected
    if (!roundTypeSelect.value || roundTypeSelect.value === '') {
        showNotification("Please select a criteria type first", "warning");
        return;
    }
    
    const innerContainer = roundGroup.querySelector(".round-criteria-inner-container");
    addEditCriteria(null, innerContainer);
}

function addEditSubCriteria(button) {
    const criteriaGroup = button.closest(".criteria-group");
    const subCriteriaContainer = criteriaGroup.querySelector(".sub-criteria-container");
    
    const subCriteriaRow = document.createElement("div");
    subCriteriaRow.classList.add("sub-criteria-row", "row", "mt-2");
    subCriteriaRow.innerHTML = `
        <input type="hidden" class="sub-criteria-id" value="">
        <div class="col-md-5">
            <input type="text" class="form-control sub-criteria-name" placeholder="Sub-Criteria Name">
        </div>
        <div class="col-md-2">
            <input type="number" class="form-control sub-criteria-min-score" placeholder="Min Score" value="" min="0" step="1">
        </div>
        <div class="col-md-2">
            <input type="number" class="form-control sub-criteria-max-score" placeholder="Max Score" value="" min="0" step="1">
        </div>
        <div class="col-md-2">
            <input type="number" class="form-control sub-criteria-percentage" placeholder="%" value="" min="0" max="100" step="1">
        </div>
        <div class="col-md-1">
            <button class="btn btn-danger btn-sm" type="button" onclick="removeSubCriteria(this)">❌</button>
        </div>
    `;
    
    subCriteriaContainer.appendChild(subCriteriaRow);
    updateCriteriaScoreVisibility(criteriaGroup);
    setTimeout(updatePercentageDisplays, 100);
}

function saveEditedEvent() {
    let eventId = document.getElementById("editEventId").value;
    let eventName = document.getElementById("editEventName").value;
    
    if (!eventName.trim()) {
        showNotification("Please enter an event name", "warning");
        return;
    }
    
    let criteriaElements = document.querySelectorAll("#editCriteriaContainer .criteria-group");
    let roundCriteriaElements = document.querySelectorAll("#editRoundCriteriaContainer .round-criteria-group");
    
    let criteriaData = [];
    let roundCriteriaData = [];
    let isValid = true;

    // Validate round criteria selection in edit mode
    let hasInvalidRoundSelection = false;
    let roundTypes = new Set();
    
    roundCriteriaElements.forEach(roundElement => {
        let roundType = roundElement.querySelector(".round-type").value;
        if (!roundType || roundType === '') {
            showNotification("Please select a criteria type for all criteria", "warning");
            hasInvalidRoundSelection = true;
            return;
        }
        
        // Check for duplicate round types
        if (roundTypes.has(roundType)) {
            showNotification(`Round type "${roundType}" is already selected. Please choose a different criteria type.`, "warning");
            hasInvalidRoundSelection = true;
            return;
        }
        
        roundTypes.add(roundType);
    });
    
    if (hasInvalidRoundSelection) return;

    let regularIsValid = validateAndCollectEditCriteria(criteriaElements, criteriaData, "regular");
    if (!regularIsValid) isValid = false;

    roundCriteriaElements.forEach(roundElement => {
        let roundType = roundElement.querySelector(".round-type").value;
        let roundCriteriaElements = roundElement.querySelectorAll(".round-criteria-inner-container .criteria-group");
        let roundCriteriaList = [];
        
        let roundIsValid = validateAndCollectEditCriteria(roundCriteriaElements, roundCriteriaList, "round");
        if (!roundIsValid) {
            isValid = false;
            return;
        }
        
        roundCriteriaData.push({
            round_type: roundType,
            criteria: roundCriteriaList
        });
    });
    
    if (!isValid) return;

    fetch("edit_event.php", {
        method: "POST",
        body: JSON.stringify({ 
            event_id: eventId, 
            event_name: eventName, 
            criteria: criteriaData,
            round_criteria: roundCriteriaData
        }),
        headers: { "Content-Type": "application/json" }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success") {
            showNotification("Event updated successfully!", "success");
            setTimeout(() => location.reload(), 1500);
        } else {
            showNotification("Error: " + data.message, "error");
        }
    })
    .catch(error => {
        console.error("❌ Fetch Error:", error);
        showNotification("Network Error: Unable to update event.", "error");
    });
}

function validateAndCollectEditCriteria(criteriaElements, criteriaData, type) {
    let totalPercentage = 0;
    let isValid = true;

    criteriaElements.forEach(criteria => {
        let criteriaId = criteria.querySelector(".criteria-id").value;
        let criteriaName = criteria.querySelector(".criteria-name").value;
        
        if (!criteriaName.trim()) {
            showNotification("Please enter a name for all criteria", "warning");
            isValid = false;
            return;
        }
        
        let criteriaMinScore = parseFloat(criteria.querySelector(".criteria-min-score").value) || 0;
        let criteriaMaxScore = parseFloat(criteria.querySelector(".criteria-max-score").value) || 0;
        let criteriaPercentage = parseFloat(criteria.querySelector(".criteria-percentage").value) || 0;
        
        if (isNaN(criteriaPercentage)) {
            showNotification("Please enter a valid percentage for all criteria", "warning");
            isValid = false;
            return;
        }
        
        totalPercentage += criteriaPercentage;
        
        let subCriteriaElements = criteria.querySelectorAll(".sub-criteria-row");
        let subCriteriaData = [];
        let totalSubCriteriaPercentage = 0;
        
        subCriteriaElements.forEach(sub => {
            let subCriteriaId = sub.querySelector(".sub-criteria-id").value;
            let subName = sub.querySelector(".sub-criteria-name").value;
            
            if (!subName.trim()) {
                showNotification("Please enter a name for all sub-criteria", "warning");
                isValid = false;
                return;
            }
            
            let subMinScore = parseFloat(sub.querySelector(".sub-criteria-min-score").value) || 0;
            let subMaxScore = parseFloat(sub.querySelector(".sub-criteria-max-score").value) || 0;
            let subPercentage = parseFloat(sub.querySelector(".sub-criteria-percentage").value) || 0;
            
            if (isNaN(subPercentage)) {
                showNotification("Please enter a valid percentage for all sub-criteria", "warning");
                isValid = false;
                return;
            }
            
            totalSubCriteriaPercentage += subPercentage;
            
            subCriteriaData.push({
                id: subCriteriaId,
                name: subName,
                min_score: subMinScore.toFixed(0),
                max_score: subMaxScore.toFixed(0),
                percentage: subPercentage.toFixed(0)
            });
        });
        
        if (subCriteriaElements.length > 0 && Math.abs(totalSubCriteriaPercentage - 100) > 0.01) {
            showNotification(`Sub-criteria percentages for "${criteriaName}" must add up to 100%. Current total: ${totalSubCriteriaPercentage.toFixed(2)}%`, "warning");
            isValid = false;
            return;
        }

        criteriaData.push({ 
            id: criteriaId,
            name: criteriaName, 
            min_score: criteriaMinScore.toFixed(0),
            max_score: criteriaMaxScore.toFixed(0),
            percentage: criteriaPercentage.toFixed(0),
            sub_criteria: subCriteriaData 
        });
    });
    
    if (type === "regular" && criteriaElements.length > 0 && Math.abs(totalPercentage - 100) > 0.01) {
        showNotification(`All criteria percentages must add up to 100%. Current total: ${totalPercentage.toFixed(2)}%`, "warning");
        isValid = false;
    }
    
    if (type === "round" && criteriaElements.length > 0 && Math.abs(totalPercentage - 100) > 0.01) {
        showNotification(`Criteria percentages in each round must add up to 100%. Current total: ${totalPercentage.toFixed(2)}%`, "warning");
        isValid = false;
    }
    
    return isValid;
}

// Percentage Tracking Functions
function updatePercentageDisplays() {
    updateCriteriaPercentageDisplay();
    updateRoundCriteriaPercentageDisplay();
}

function updateCriteriaPercentageDisplay() {
    // Regular criteria
    const criteriaContainers = [
        document.getElementById('criteriaContainer'),
        document.getElementById('editCriteriaContainer')
    ];
    
    criteriaContainers.forEach(container => {
        if (!container) return;
        
        const criteriaGroups = container.querySelectorAll('.criteria-group');
        let totalPercentage = 0;
        
        criteriaGroups.forEach(group => {
            const percentageInput = group.querySelector('.criteria-percentage');
            const percentage = parseFloat(percentageInput?.value) || 0;
            totalPercentage += percentage;
            
            // Update individual criteria display
            updateCriteriaGroupPercentage(group);
        });
        
        // Update total percentage display for regular criteria
        const existingSummary = container.querySelector('.criteria-percentage-summary');
        const remaining = 100 - totalPercentage;
        
        if (existingSummary) {
            existingSummary.remove();
        }
        
        if (criteriaGroups.length > 0) {
            const summary = document.createElement('div');
            summary.className = 'criteria-percentage-summary';
            
            let statusClass = 'percentage-warning';
            let statusText = 'Incomplete';
            
            if (Math.abs(totalPercentage - 100) < 0.01) {
                statusClass = 'percentage-complete';
                statusText = 'Complete';
            } else if (totalPercentage > 100) {
                statusClass = 'percentage-remaining';
                statusText = 'Over 100%';
            }
            
            summary.innerHTML = `
                <strong>Preliminary Criteria Total:</strong> 
                <span class="${statusClass}">${totalPercentage.toFixed(2)}% / 100%</span> | 
                <span class="percentage-remaining">Remaining: ${remaining.toFixed(2)}%</span> | 
                Status: <span class="${statusClass}">${statusText}</span>
            `;
            
            container.insertBefore(summary, container.firstChild);
        }
    });
}

function updateRoundCriteriaPercentageDisplay() {
    const roundContainers = [
        document.getElementById('roundCriteriaContainer'),
        document.getElementById('editRoundCriteriaContainer')
    ];
    
    roundContainers.forEach(container => {
        if (!container) return;
        
        const roundGroups = container.querySelectorAll('.round-criteria-group');
        
        roundGroups.forEach(roundGroup => {
            const innerContainer = roundGroup.querySelector('.round-criteria-inner-container');
            const criteriaGroups = innerContainer?.querySelectorAll('.criteria-group') || [];
            let roundTotalPercentage = 0;
            
            criteriaGroups.forEach(group => {
                const percentageInput = group.querySelector('.criteria-percentage');
                const percentage = parseFloat(percentageInput?.value) || 0;
                roundTotalPercentage += percentage;
                
                // Update individual criteria display
                updateCriteriaGroupPercentage(group);
            });
            
            // Update round criteria summary
            const existingSummary = roundGroup.querySelector('.round-percentage-summary');
            const remaining = 100 - roundTotalPercentage;
            
            if (existingSummary) {
                existingSummary.remove();
            }
            
            if (criteriaGroups.length > 0) {
                const roundType = roundGroup.querySelector('.round-type').value;
                const roundLabel = getRoundLabel(roundType);
                
                const summary = document.createElement('div');
                summary.className = 'round-percentage-summary';
                
                let statusClass = 'percentage-warning';
                let statusText = 'Incomplete';
                
                if (Math.abs(roundTotalPercentage - 100) < 0.01) {
                    statusClass = 'percentage-complete';
                    statusText = 'Complete';
                } else if (roundTotalPercentage > 100) {
                    statusClass = 'percentage-remaining';
                    statusText = 'Over 100%';
                }
                
                summary.innerHTML = `
                    <strong>${roundLabel} Total:</strong> 
                    <span class="${statusClass}">${roundTotalPercentage.toFixed(2)}% / 100%</span> | 
                    <span class="percentage-remaining">Remaining: ${remaining.toFixed(2)}%</span> | 
                    Status: <span class="${statusClass}">${statusText}</span>
                `;
                
                const innerContainer = roundGroup.querySelector('.round-criteria-inner-container');
                innerContainer.insertBefore(summary, innerContainer.firstChild);
            }
        });
    });
}

function updateCriteriaGroupPercentage(criteriaGroup) {
    const percentageInput = criteriaGroup.querySelector('.criteria-percentage');
    const subCriteriaContainer = criteriaGroup.querySelector('.sub-criteria-container');
    const subCriteriaRows = subCriteriaContainer?.querySelectorAll('.sub-criteria-row') || [];
    
    // Remove existing percentage display
    const existingDisplay = criteriaGroup.querySelector('.sub-criteria-percentage-summary');
    if (existingDisplay) {
        existingDisplay.remove();
    }
    
    // For criteria with sub-criteria
    if (subCriteriaRows.length > 0) {
        let subTotalPercentage = 0;
        
        subCriteriaRows.forEach(row => {
            const subPercentageInput = row.querySelector('.sub-criteria-percentage');
            const subPercentage = parseFloat(subPercentageInput?.value) || 0;
            subTotalPercentage += subPercentage;
        });
        
        const remaining = 100 - subTotalPercentage;
        const percentageDisplay = document.createElement('div');
        percentageDisplay.className = 'percentage-display sub-criteria-percentage-summary';
        
        let statusClass = 'percentage-warning';
        let statusText = 'Incomplete';
        
        if (Math.abs(subTotalPercentage - 100) < 0.01) {
            statusClass = 'percentage-complete';
            statusText = 'Complete';
        } else if (subTotalPercentage > 100) {
            statusClass = 'percentage-remaining';
            statusText = 'Over 100%';
        }
        
        percentageDisplay.innerHTML = `
            <strong>Sub-criteria Total:</strong> 
            <span class="${statusClass}">${subTotalPercentage.toFixed(2)}% / 100%</span> | 
            <span class="percentage-remaining">Remaining: ${remaining.toFixed(2)}%</span> | 
            Status: <span class="${statusClass}">${statusText}</span>
        `;
        
        // Insert IMMEDIATELY AFTER the "Sub-Criteria:" label, before the sub-criteria container
        const subCriteriaLabel = criteriaGroup.querySelector('label[for*="sub-criteria"]');
        if (subCriteriaLabel) {
            subCriteriaLabel.parentNode.insertBefore(percentageDisplay, subCriteriaContainer);
        } else {
            // Fallback: insert before sub-criteria container
            subCriteriaContainer.parentNode.insertBefore(percentageDisplay, subCriteriaContainer);
        }
    }
}

function getRoundLabel(roundType) {
    switch(roundType) {
        case 'top10': return 'Top 10 Criteria';
        case 'top5': return 'Top 5 Criteria';
        case 'top3': return 'Top 3 Criteria';
        default: return 'Round Criteria';
    }
}

function addPercentageEventListeners() {
    // Listen for all percentage input changes
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('criteria-percentage') || 
            e.target.classList.contains('sub-criteria-percentage')) {
            updatePercentageDisplays();
        }
    });
    
    // Listen for criteria additions/removals
    const observer = new MutationObserver(function(mutations) {
        let shouldUpdate = false;
        
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1 && (
                        node.classList.contains('criteria-group') || 
                        node.classList.contains('round-criteria-group') ||
                        node.classList.contains('sub-criteria-row')
                    )) {
                        shouldUpdate = true;
                    }
                });
                
                mutation.removedNodes.forEach(function(node) {
                    if (node.nodeType === 1 && (
                        node.classList.contains('criteria-group') || 
                        node.classList.contains('round-criteria-group') ||
                        node.classList.contains('sub-criteria-row')
                    )) {
                        shouldUpdate = true;
                    }
                });
            }
        });
        
        if (shouldUpdate) {
            setTimeout(updatePercentageDisplays, 100);
        }
    });
    
    // Observe criteria containers
    const containers = [
        'criteriaContainer',
        'roundCriteriaContainer', 
        'editCriteriaContainer',
        'editRoundCriteriaContainer'
    ];
    
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            observer.observe(container, {
                childList: true,
                subtree: true
            });
        }
    });
}

// Sidebar and other UI functions
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

document.addEventListener("DOMContentLoaded", function() {
    setActiveMenu();

    const menuBar = document.querySelector('#content nav .bx.bx-menu');
    const sidebar = document.getElementById('sidebar');

    if (menuBar) {
        menuBar.addEventListener('click', function () {
            sidebar.classList.toggle('hide');
        });
    }

    const searchButton = document.querySelector('#content nav form .form-input button');
    const searchButtonIcon = document.querySelector('#content nav form .form-input button .bx');
    const searchForm = document.querySelector('#content nav form');

    if (searchButton) {
        searchButton.addEventListener('click', function (e) {
            if(window.innerWidth < 576) {
                e.preventDefault();
                searchForm.classList.toggle('show');
                if(searchForm.classList.contains('show')) {
                    searchButtonIcon.classList.replace('bx-search', 'bx-x');
                } else {
                    searchButtonIcon.classList.replace('bx-x', 'bx-search');
                }
            }
        });
    }

    if(window.innerWidth < 768 && sidebar) {
        sidebar.classList.add('hide');
    } else if(window.innerWidth > 576) {
        if (searchButtonIcon) searchButtonIcon.classList.replace('bx-x', 'bx-search');
        if (searchForm) searchForm.classList.remove('show');
    }
    
    const style = document.createElement('style');
    style.textContent = `
        .criteria-display {
            font-size: 0.9em;
            line-height: 1.4;
        }

        .criteria-item {
            margin: 8px 0;
            padding: 8px;
            background: white;
            border-radius: 4px;
            border: 1px solid #e9ecef;
        }

        .criteria-item strong {
            color: #495057;
            font-size: 0.95em;
        }

        .percentage-badge {
            background: #007bff;
            color: white;
            padding: 2px 6px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: bold;
            margin-left: 8px;
        }

        .score-range {
            color: #6c757d;
            font-size: 0.85em;
            margin-left: 8px;
        }

        .sub-criteria-list {
            margin: 8px 0 0 0;
            padding-left: 20px;
            list-style: none;
        }

        .sub-criteria-list li {
            margin: 4px 0;
            padding: 4px 8px;
            background: #f8f9fa;
            border-radius: 3px;
            border-left: 3px solid #28a745;
            font-size: 0.85em;
        }

        .sub-criteria-list li strong {
            color: #28a745;
        }

        .round-criteria-display {
            margin: 12px 0;
            padding: 12px;
            background-color: #f8f9fa;
            border-radius: 6px;
            border-left: 4px solid #007bff;
        }

        .round-criteria-display.regular-round {
            border-left-color: #007bff;
        }

        .round-criteria-display:nth-child(2) {
            border-left-color: #28a745;
        }

        .round-criteria-display:nth-child(3) {
            border-left-color: #ffc107;
        }

        .round-criteria-display:nth-child(4) {
            border-left-color: #dc3545;
        }

        .round-title {
            color: #2c3e50;
            font-size: 0.95em;
            display: block;
            margin-bottom: 8px;
            padding-bottom: 4px;
            border-bottom: 2px solid #dee2e6;
        }

        .criteria-container {
            margin-top: 8px;
        }

        .modal-lg, .modal-xl {
            max-width: 900px !important;
        }
        
        .modal-dialog {
            max-width: 800px !important;
            margin: 1.75rem auto;
        }
        
        @media (min-width: 992px) {
            .modal-lg, .modal-xl {
                max-width: 900px !important;
            }
        }

        .round-type option:disabled {
            color: #6c757d;
            background-color: #e9ecef;
        }

        .round-type option[value=""] {
            color: #6c757d;
            font-style: italic;
        }
        
        .sub-criteria-percentage-summary {
            background: #d1ecf1;
            padding: 6px;
            border-radius: 4px;
            margin: 8px 0;
            border-left: 3px solid #17a2b8;
            font-size: 0.9em;
        }
    `;
    document.head.appendChild(style);
});

window.addEventListener('resize', function () {
    const searchButtonIcon = document.querySelector('#content nav form .form-input button .bx');
    const searchForm = document.querySelector('#content nav form');
    
    if(this.innerWidth > 576) {
        if (searchButtonIcon) searchButtonIcon.classList.replace('bx-x', 'bx-search');
        if (searchForm) searchForm.classList.remove('show');
    }
});