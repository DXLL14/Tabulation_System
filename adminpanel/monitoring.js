// monitoring.js
document.addEventListener('DOMContentLoaded', function() {
    const eventSelect = document.getElementById('eventmonitorSelect');
    const categorySelect = document.getElementById('categorymonitorSelect');
    const criteriaSelect = document.getElementById('criteriamonitorSelect');
    const tableBody = document.getElementById('eventTableBody');

    const showSubScoreCheckbox = document.getElementById('showSubScore');
    
    const API_ENDPOINT = 'get_monitor.php';
    
    let refreshInterval = null;
    const REFRESH_INTERVAL_MS = 500; // 0.5 seconds
    
    // Variables for sorting
    let sortByNumber = true;
    
    // Variable to store subcriteria information
    let subcriteriaList = [];
    
    // Variable to track sub-score display status
    let showingSubScores = false;

    const stateKey = 'monitoringState';
    
    // Load saved state from sessionStorage
    const savedState = JSON.parse(sessionStorage.getItem(stateKey) || '{}');
    if (savedState.showingSubScores !== undefined) {
        showSubScoreCheckbox.checked = savedState.showingSubScores;
        showingSubScores = savedState.showingSubScores;
    }
    if (savedState.sortByNumber !== undefined) {
        sortByNumber = savedState.sortByNumber;
    }
    
    // Load events for the dropdown
    loadEvents();
    
    // Add event listeners
    eventSelect.addEventListener('change', function() {
        const eventId = this.value;
        if (eventId) {
            loadCriteria(eventId);
            criteriaSelect.innerHTML = '<option value="" selected disabled>Select Criteria</option>';
            categorySelect.value = '';
            tableBody.innerHTML = '';
            resetAutoRefresh();
        }
    });
    
    categorySelect.addEventListener('change', function() {
        const eventId = eventSelect.value;
        const criteriaId = criteriaSelect.value;
        if (eventId && criteriaId) {
            loadScoreData(eventId, criteriaId);
        }
    });
    
    criteriaSelect.addEventListener('change', function() {
        const eventId = eventSelect.value;
        const criteriaId = this.value;
        if (eventId && criteriaId) {
            loadSubcriteria(criteriaId);
            loadScoreData(eventId, criteriaId);
            setupAutoRefresh(eventId, criteriaId);
        }
    });
    
    // Add event listener for the sub-score checkbox
    showSubScoreCheckbox.addEventListener('change', function() {
        showingSubScores = this.checked;
        
        const eventId = eventSelect.value;
        const criteriaId = criteriaSelect.value;
        if (eventId && criteriaId) {
            loadScoreData(eventId, criteriaId);
        }
        
        // Update the button text to reflect current mode
        const sortButton = document.getElementById('sortButton');
        if (sortButton) {
            if (sortByNumber) {
                sortButton.textContent = showingSubScores ? 
                    'Sort by Contestant Number (Sub-Scores Mode)' : 
                    'Sort by Contestant Number';
            } else {
                sortButton.textContent = showingSubScores ? 
                    'Sort by Highest Score (Sub-Scores Mode)' : 
                    'Sort by Highest Score';
            }
        }

        // Save state to sessionStorage
        sessionStorage.setItem(stateKey, JSON.stringify({sortByNumber, showingSubScores}));
    });
    
    // Add sort toggle button to the DOM
    setupSortButton();
    
    // Check for last saved selection in sessionStorage
    checkForLastSavedSelection();
    
    // Function to check for last saved selection
    function checkForLastSavedSelection() {
        try {
            const savedData = sessionStorage.getItem('lastSavedSelection');
            if (savedData) {
                const data = JSON.parse(savedData);
                applyLastSavedSelection();
            }
        } catch (e) {
            console.error('Error checking last saved selection:', e);
        }
    }
    
    // Function to apply the last saved selection
    function applyLastSavedSelection() {
        try {
            const savedData = sessionStorage.getItem('lastSavedSelection');
            if (savedData) {
                const data = JSON.parse(savedData);
                
                // First select the event
                if (data.eventId && eventSelect) {
                    eventSelect.value = data.eventId;
                    eventSelect.dispatchEvent(new Event('change'));
                    
                    // Wait for criteria to load before selecting
                    setTimeout(() => {
                        // Apply category filter FIRST
                        if (data.categoryId && categorySelect) {
                            categorySelect.value = data.categoryId;
                        }
                        
                        // Then select criteria which will trigger loadScoreData
                        if (data.criteriaId && criteriaSelect) {
                            criteriaSelect.value = data.criteriaId;
                            criteriaSelect.dispatchEvent(new Event('change'));
                        }
                    }, 500);
                }
            }
        } catch (e) {
            console.error('Error applying last saved selection:', e);
        }
    }
    
    // Function to set up sort button
    function setupSortButton() {
        const tableContainer = document.querySelector('.table-responsive');
        if (!tableContainer) return;
        
        if (!document.getElementById('sortButton')) {
            const sortButton = document.createElement('button');
            sortButton.id = 'sortButton';
            sortButton.className = 'btn btn-primary mb-2';
            const buttonText = sortByNumber ? 
                (showingSubScores ? 'Sort by Contestant Number (Sub-Scores Mode)' : 'Sort by Contestant Number') : 
                (showingSubScores ? 'Sort by Highest Score (Sub-Scores Mode)' : 'Sort by Highest Score');
            sortButton.textContent = buttonText;
            
            tableContainer.parentNode.insertBefore(sortButton, tableContainer);
            
            sortButton.addEventListener('click', toggleSort);
        }
    }
    
    // Function to toggle sort direction
    function toggleSort() {
        sortByNumber = !sortByNumber;
        const buttonText = sortByNumber ? 
            (showingSubScores ? 'Sort by Contestant Number (Sub-Scores Mode)' : 'Sort by Contestant Number') : 
            (showingSubScores ? 'Sort by Highest Score (Sub-Scores Mode)' : 'Sort by Highest Score');
        
        document.getElementById('sortButton').textContent = buttonText;
        
        const eventId = eventSelect.value;
        const criteriaId = criteriaSelect.value;
        if (eventId && criteriaId) {
            loadScoreData(eventId, criteriaId);
        }

        // Save state to sessionStorage
        sessionStorage.setItem(stateKey, JSON.stringify({sortByNumber, showingSubScores}));
    }
    
    // Function to set up auto-refresh
    function setupAutoRefresh(eventId, criteriaId) {
        resetAutoRefresh();
        
        refreshInterval = setInterval(() => {
            loadScoreData(eventId, criteriaId);
        }, REFRESH_INTERVAL_MS);
        
        addRefreshIndicator();
    }
    
    // Function to reset auto-refresh
    function resetAutoRefresh() {
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }
        
        updateRefreshIndicator(false);
    }
    
    // Function to add refresh indicator
    function addRefreshIndicator() {
        if (!document.getElementById('refreshIndicator')) {
            const indicator = document.createElement('div');
            indicator.id = 'refreshIndicator';
            indicator.className = 'alert alert-info mt-2';
            indicator.innerHTML = 'Auto-refreshing every 3 seconds';
            
            const tableContainer = document.querySelector('.table-responsive');
            if (tableContainer) {
                tableContainer.parentNode.insertBefore(indicator, tableContainer.nextSibling);
            }
        }
        
        updateRefreshIndicator(true);
    }
    
    // Function to update refresh indicator
    function updateRefreshIndicator(active) {
        const indicator = document.getElementById('refreshIndicator');
        if (indicator) {
            if (active) {
                indicator.style.display = 'block';
            } else {
                indicator.style.display = 'none';
            }
        }
    }
    
    // Function to load events
    function loadEvents() {
        fetch(`${API_ENDPOINT}?action=get_events`)
            .then(response => response.json())
            .then(data => {
                eventSelect.innerHTML = '<option value="" selected disabled>Select Event</option>';
                data.forEach(event => {
                    const option = document.createElement('option');
                    option.value = event.id;
                    option.textContent = event.event_name;
                    eventSelect.appendChild(option);
                });
                
                // After loading events, check if we need to apply saved selection
                checkForLastSavedSelection();
            })
            .catch(error => console.error('Error loading events:', error));
    }
    
    // Function to load criteria for selected event WITH ROUND TYPE
    function loadCriteria(eventId) {
        fetch(`${API_ENDPOINT}?action=get_criteria&event_id=${eventId}`)
            .then(response => response.json())
            .then(data => {
                criteriaSelect.innerHTML = '<option value="" selected disabled>Select Criteria</option>';
                data.forEach(criteria => {
                    const option = document.createElement('option');
                    option.value = criteria.id;
                    option.textContent = criteria.display_name; // Shows "Round Type - Criteria Name"
                    option.setAttribute('data-round-type', criteria.round_type);
                    criteriaSelect.appendChild(option);
                });
            })
            .catch(error => console.error('Error loading criteria:', error));
    }
    
    // Function to load subcriteria for selected criteria
    function loadSubcriteria(criteriaId) {
        fetch(`${API_ENDPOINT}?action=get_subcriteria&criteria_id=${criteriaId}`)
            .then(response => response.json())
            .then(data => {
                subcriteriaList = data;
            })
            .catch(error => console.error('Error loading subcriteria:', error));
    }
    
    // Function to load score data for selected event and criteria
    function loadScoreData(eventId, criteriaId) {
        console.log('Loading score data for event:', eventId, 'criteria:', criteriaId);
        
        // Fetch current contestants (now returns an array)
        fetchCurrentContestant(eventId).then(currentContestantIds => {
            console.log('Current contestant IDs:', currentContestantIds);
            
            // Then fetch judges and contestants (passing criteriaId for round type filtering)
            fetchAllJudges(eventId).then(allJudges => {
                fetchAllContestants(eventId, criteriaId).then(allContestants => {
                    // Then fetch scores
                    fetch(`${API_ENDPOINT}?action=get_scores&event_id=${eventId}&criteria_id=${criteriaId}`)
                        .then(response => response.json())
                        .then(data => {
                            updateScoreTable(data, allJudges, allContestants, currentContestantIds);
                        })
                        .catch(error => console.error('Error loading score data:', error));
                });
            });
        });
    }
    
    // Function to fetch ALL judges for an event, even those who haven't voted
    function fetchAllJudges(eventId) {
        return fetch(`${API_ENDPOINT}?action=get_all_judges&event_id=${eventId}`)
            .then(response => response.json())
            .catch(error => {
                console.error('Error fetching all judges:', error);
                return {};
            });
    }
    
    // Function to fetch contestants (filtered by round type)
    function fetchAllContestants(eventId, criteriaId) {
        return fetch(`${API_ENDPOINT}?action=get_all_contestants&event_id=${eventId}&criteria_id=${criteriaId}`)
            .then(response => response.json())
            .catch(error => {
                console.error('Error fetching all contestants:', error);
                return [];
            });
    }
    
    // Function to get currently selected contestants from selected_data table
    function fetchCurrentContestant(eventId) {
        return fetch(`${API_ENDPOINT}?action=get_current_contestant&event_id=${eventId}`)
            .then(response => response.json())
            .then(data => {
                console.log('Fetched current contestants data:', data);
                return data.candidate_ids || [];
            })
            .catch(error => {
                console.error('Error fetching current contestants:', error);
                return [];
            });
    }
    
    // Function to update the score table with judges as columns
    function updateScoreTable(data, allJudges, allContestants, currentContestantIds) {
        const candidates = {};
        const selectedCategory = categorySelect.value;
        
        console.log('Current contestant IDs in updateScoreTable:', currentContestantIds);
        console.log('All contestants:', allContestants);
        
        // First, populate with all contestants to ensure everyone is included
        allContestants.forEach(contestant => {
            // Filter by category if selected
            if (selectedCategory && selectedCategory !== 'all' && selectedCategory !== '') {
                if (contestant.category != selectedCategory) {
                    return; // Skip this contestant
                }
            }
            
            // Convert to string for comparison
            const contestantId = String(contestant.id);
            const isCurrent = currentContestantIds.some(id => String(id) === contestantId);
            
            console.log(`Contestant ${contestant.name} (ID: ${contestantId}): isCurrent = ${isCurrent}`);
            
            candidates[contestant.id] = {
                id: contestant.id,
                name: contestant.name,
                number: contestant.candidate_no,
                category: contestant.category,
                photo: contestant.photo || 'assets/img/no-profile.png',
                scores: {},
                isCurrent: isCurrent
            };
        });
        
        // Then add score data for contestants who have scores
        data.forEach(item => {
            // Only add scores for candidates that passed the category filter
            if (candidates[item.candidate_id]) {
                if (!candidates[item.candidate_id].scores[item.judge_id]) {
                    candidates[item.candidate_id].scores[item.judge_id] = {};
                }
                
                candidates[item.candidate_id].scores[item.judge_id][item.subcriteria_id] = item.score;
            }
        });
        
        updateTableHeader(allJudges);
        
        updateTableContent(Object.values(candidates), allJudges);
    }
    
    // Update table header with judge columns
    function updateTableHeader(judges) {
        const thead = document.querySelector('table thead tr');
        
        // Clear existing headers except the first one (we'll rebuild)
        thead.innerHTML = '';
        
        // Create headers in new order: Contestant No, Photo, Name, Category, then Judges
        const headers = [
            'Contestant No',
            'Photo', 
            'Name',
            'Category'
        ];
        
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            thead.appendChild(th);
        });
        
        // Add judge columns
        Object.entries(judges).forEach(([id, name]) => {
            const th = document.createElement('th');
            th.textContent = name;
            th.dataset.judgeId = id;
            thead.appendChild(th);
        });
    }
    
    // Update table content with candidate data and scores - CONTESTANT NUMBER NOW FIRST
    function updateTableContent(candidates, judges) {
        tableBody.innerHTML = '';
        
        candidates.forEach(candidate => {
            let totalScore = 0;
            
            Object.keys(judges).forEach(judgeId => {
                if (candidate.scores[judgeId]) {
                    const judgeScores = Object.values(candidate.scores[judgeId]);
                    const judgeTotal = judgeScores.reduce((sum, score) => sum + parseFloat(score), 0);
                    totalScore += judgeTotal;
                }
            });
            
            candidate.totalScore = totalScore;
        });
        
        console.log('Candidates before sorting:', candidates.map(c => ({name: c.name, isCurrent: c.isCurrent})));
        
        // Separate current contestants from others
        const currentCandidates = candidates.filter(c => c.isCurrent);
        const otherCandidates = candidates.filter(c => !c.isCurrent);
        
        console.log('Current candidates:', currentCandidates.map(c => c.name));
        console.log('Other candidates count:', otherCandidates.length);
        
        // Sort current candidates
        if (sortByNumber) {
            currentCandidates.sort((a, b) => {
                const numA = parseInt(a.number, 10) || 0;
                const numB = parseInt(b.number, 10) || 0;
                return numA - numB;
            });
        } else {
            currentCandidates.sort((a, b) => b.totalScore - a.totalScore);
        }
        
        // Sort other candidates
        if (sortByNumber) {
            otherCandidates.sort((a, b) => {
                const numA = parseInt(a.number, 10) || 0;
                const numB = parseInt(b.number, 10) || 0;
                return numA - numB;
            });
        } else {
            otherCandidates.sort((a, b) => b.totalScore - a.totalScore);
        }
        
        // Combine: current contestants first, then others
        const sortedCandidates = [...currentCandidates, ...otherCandidates];
        
        console.log('Final sorted candidates:', sortedCandidates.map(c => ({name: c.name, isCurrent: c.isCurrent})));
        
        // Create table rows for sorted candidates
        sortedCandidates.forEach((candidate, index) => {
            const row = document.createElement('tr');
            
            // Add highlight class for current contestants
            if (candidate.isCurrent) {
                console.log(`Highlighting row for ${candidate.name} at position ${index}`);
                row.style.backgroundColor = '#fff3cd';
                row.style.fontWeight = 'bold';
                row.style.border = '3px solid #ffc107';
            }
            
            // CONTESTANT NUMBER CELL - NOW FIRST
            const numberCell = document.createElement('td');
            numberCell.textContent = candidate.number;
            row.appendChild(numberCell);
            
            // Photo cell - NOW SECOND
            const photoCell = document.createElement('td');
            const img = document.createElement('img');
            
            img.src = candidate.photo || 'contestants/' + candidate.photo;
            img.alt = candidate.name;
            img.style.width = '50px';
            img.style.height = '50px';
            img.style.borderRadius = '50%';
            img.style.objectFit = 'cover';
            
            img.onerror = function() {
                this.src = 'assets/img/no-profile.png';
            };
            
            photoCell.appendChild(img);
            row.appendChild(photoCell);
            
            // Name cell - NOW THIRD
            const nameCell = document.createElement('td');
            nameCell.textContent = candidate.name;
            row.appendChild(nameCell);
            
            // Category cell - NOW FOURTH
            const categoryCell = document.createElement('td');
            categoryCell.textContent = candidate.category == 1 ? 'Male' : (candidate.category == 2 ? 'Female' : 'Unknown');
            row.appendChild(categoryCell);
            
            // Add score cells for each judge
            Object.keys(judges).forEach(judgeId => {
                const scoreCell = document.createElement('td');
                
                if (candidate.scores[judgeId]) {
                    if (showingSubScores) {
                        // Show individual sub-criteria scores
                        const subScores = [];
                        
                        if (subcriteriaList && subcriteriaList.length > 0) {
                            subcriteriaList.forEach(subcriteria => {
                                const subScore = candidate.scores[judgeId][subcriteria.id];
                                subScores.push(subScore !== undefined ? parseInt(subScore) : '-');
                            });
                        } else {
                            const subcriteriaIds = Object.keys(candidate.scores[judgeId]).sort();
                            subcriteriaIds.forEach(subId => {
                                const score = candidate.scores[judgeId][subId];
                                subScores.push(score !== undefined ? parseInt(score) : '-');
                            });
                        }
                        
                        scoreCell.textContent = subScores.join(', ');
                    } else {
                        const judgeScores = Object.values(candidate.scores[judgeId]);
                        const judgeTotal = judgeScores.reduce((sum, score) => sum + parseFloat(score), 0);
                        
                        scoreCell.textContent = judgeTotal.toFixed(0);
                    }
                } else {
                    scoreCell.textContent = '-';
                }
                
                row.appendChild(scoreCell);
            });
            
            tableBody.appendChild(row);
        });
    }
});