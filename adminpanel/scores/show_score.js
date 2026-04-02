// show_score.js
document.addEventListener('DOMContentLoaded', function() {
    const eventSelect = document.getElementById('eventSelect');
    const roundTypeSelect = document.getElementById('roundTypeSelect');
    const categorySelect = document.getElementById('categorySelect');
    const criteriaSelect = document.getElementById('criteriaSelect');
    const tableBody = document.querySelector('tbody');

    let events = [];
    let criteria = [];
    let isLoadingCriteria = false;

    // State persistence keys
    const STATE_KEYS = {
        event: 'selectedEventId',
        roundType: 'selectedRoundType',
        category: 'selectedCategory',
        criteria: 'selectedCriteria'
    };

    // Save state to sessionStorage
    function saveState(key, value) {
        sessionStorage.setItem(STATE_KEYS[key], value);
    }

    // Get state from sessionStorage
    function getState(key) {
        return sessionStorage.getItem(STATE_KEYS[key]);
    }

    // Clear state
    function clearState(fromKey = null) {
        const keys = ['event', 'roundType', 'category', 'criteria'];
        const startClearing = fromKey ? keys.indexOf(fromKey) + 1 : 0;
        
        for (let i = startClearing; i < keys.length; i++) {
            sessionStorage.removeItem(STATE_KEYS[keys[i]]);
        }
    }

    // Disable/Enable dropdowns
    function setDropdownState(dropdown, enabled) {
        dropdown.disabled = !enabled;
        if (!enabled) {
            dropdown.style.opacity = '0.5';
            dropdown.style.cursor = 'not-allowed';
        } else {
            dropdown.style.opacity = '1';
            dropdown.style.cursor = 'pointer';
        }
    }

    // Initialize - disable dependent dropdowns
    setDropdownState(roundTypeSelect, false);
    setDropdownState(categorySelect, false);
    setDropdownState(criteriaSelect, false);

    // Load events
    fetch('get_events.php')
        .then(response => response.json())
        .then(data => {
            events = data;
            eventSelect.innerHTML = '<option value="" disabled selected>Select Event</option>';
            data.forEach(event => {
                const option = document.createElement('option');
                option.value = event.id;
                option.textContent = event.event_name;
                eventSelect.appendChild(option);
            });

            // Restore saved state
            const savedEventId = getState('event');
            if (savedEventId) {
                eventSelect.value = savedEventId;
                loadRoundTypesForEvent(savedEventId);
            }
        })
        .catch(error => console.error('Error loading events:', error));

    // Event selection change
    eventSelect.addEventListener('change', function() {
        const eventId = this.value;
        
        // Save event selection
        saveState('event', eventId);
        
        // Clear dependent states
        clearState('event');
        
        // Reset dependent dropdowns
        roundTypeSelect.innerHTML = '<option value="" selected disabled>Select Criteria Type</option>';
        categorySelect.value = '';
        criteriaSelect.innerHTML = '<option value="" selected disabled>Select Score</option>';
        tableBody.innerHTML = '';
        criteria = [];
        
        // Disable dependent dropdowns
        setDropdownState(roundTypeSelect, false);
        setDropdownState(categorySelect, false);
        setDropdownState(criteriaSelect, false);

        if (eventId) {
            loadRoundTypesForEvent(eventId);
        }
    });

    // Load round types for selected event
    function loadRoundTypesForEvent(eventId) {
        // Fetch available round types for this event from the database
        fetch(`get_round_types.php?event_id=${eventId}`)
            .then(response => response.json())
            .then(data => {
                roundTypeSelect.innerHTML = '<option value="" selected disabled>Select Criteria Type</option>';
                
                if (data.length > 0) {
                    data.forEach(roundType => {
                        const option = document.createElement('option');
                        option.value = roundType.round_type;
                        option.textContent = formatRoundTypeName(roundType.round_type);
                        roundTypeSelect.appendChild(option);
                    });
                    
                    // Enable round type dropdown
                    setDropdownState(roundTypeSelect, true);
                    
                    // Restore saved round type
                    const savedRoundType = getState('roundType');
                    if (savedRoundType) {
                        roundTypeSelect.value = savedRoundType;
                        onRoundTypeSelected(savedRoundType);
                    }
                } else {
                    roundTypeSelect.innerHTML = '<option value="" selected disabled>No criteria types available</option>';
                }
            })
            .catch(error => {
                console.error('Error loading criteria types:', error);
                roundTypeSelect.innerHTML = '<option value="" selected disabled>Error loading criteria types</option>';
            });
    }

    // Format round type name for display - UPDATED
    function formatRoundTypeName(roundType) {
        const names = {
            'regular': 'Preliminary',
            'top10': 'Top 10',
            'top5': 'Top 5',
            'top3': 'Top 3'
        };
        return names[roundType] || roundType;
    }

    // Round type selection change
    roundTypeSelect.addEventListener('change', function() {
        const roundType = this.value;
        
        // Save round type selection
        saveState('roundType', roundType);
        
        // Clear dependent states
        clearState('roundType');
        
        if (roundType) {
            onRoundTypeSelected(roundType);
        }
    });

    function onRoundTypeSelected(roundType) {
        const eventId = eventSelect.value;
        
        // Enable category dropdown
        setDropdownState(categorySelect, true);
        
        // Auto-select "Select All" category
        categorySelect.value = 'all';
        saveState('category', 'all');
        
        // Load criteria for this event and round type
        loadCriteria(eventId, roundType);
        
        // Restore saved category if exists
        const savedCategory = getState('category');
        if (savedCategory) {
            categorySelect.value = savedCategory;
        }
    }

    // Category selection change
    categorySelect.addEventListener('change', function() {
        // Save category selection
        saveState('category', this.value);
        
        if (!isLoadingCriteria) {
            loadScores();
        }
    });

    // Criteria selection change
    criteriaSelect.addEventListener('change', function() {
        // Save criteria selection
        saveState('criteria', this.value);
        
        if (!isLoadingCriteria) {
            loadScores();
        }
    });

    function loadCriteria(eventId, roundType = '') {
        isLoadingCriteria = true;
        
        let url = `get_criteria.php?event_id=${eventId}`;
        if (roundType && roundType !== '') {
            url += `&round_type=${roundType}`;
        }

        fetch(url)
            .then(response => response.json())
            .then(data => {
                criteria = data;
                criteriaSelect.innerHTML = '<option value="" selected>Overall</option>';
                data.forEach(criterion => {
                    const option = document.createElement('option');
                    option.value = criterion.id;
                    option.textContent = criterion.criteria_name;
                    criteriaSelect.appendChild(option);
                });
                
                // Enable criteria dropdown
                setDropdownState(criteriaSelect, true);
                
                isLoadingCriteria = false;
                
                // Restore saved criteria
                const savedCriteria = getState('criteria');
                if (savedCriteria) {
                    criteriaSelect.value = savedCriteria;
                }
                
                loadScores();
            })
            .catch(error => {
                console.error('Error loading criteria:', error);
                isLoadingCriteria = false;
            });
    }

    function loadScores() {
        const eventId = eventSelect.value;
        const roundType = roundTypeSelect.value;
        const category = categorySelect.value;
        const criteriaId = criteriaSelect.value;

        if (!eventId) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Please select an event</td></tr>';
            return;
        }

        if (!roundType) {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Please select a criteria type</td></tr>';
            return;
        }

        if (isLoadingCriteria) {
            console.log('Waiting for criteria to load...');
            return;
        }

        let url = `get_scores.php?event_id=${eventId}&show_partial=true`;
        
        if (roundType && roundType !== '') {
            url += `&round_type=${roundType}`;
        }
        
        if (category && category !== '' && category !== 'all') {
            url += `&category=${category}`;
        }
        
        if (criteriaId && criteriaId !== '') {
            url += `&criteria_id=${criteriaId}`;
        }

        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Loading scores...</td></tr>';

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.error) {
                    tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error: ${data.error}</td></tr>`;
                    return;
                }

                if (data.status === 'no_scores' || data.status === 'no_scores_found' || data.status === 'no_candidates' || data.status === 'no_criteria' || data.status === 'no_round_selected') {
                    let message = data.message || 'No data found';
                    tableBody.innerHTML = `<tr><td colspan="7" class="text-center">${message}</td></tr>`;
                    return;
                }

                if (data.results && data.results.length > 0) {
                    displayScores(data.results, data.completeness, category);
                } else {
                    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No scores found for the selected filters</td></tr>';
                }
            })
            .catch(error => {
                console.error('Error loading scores:', error);
                tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error loading scores: ${error.message}</td></tr>`;
            });
    }

    function displayScores(scores, completeness, selectedCategory) {
        tableBody.innerHTML = '';

        // CRITICAL: If "Select All" is chosen, rank separately by category
        if (selectedCategory === 'all') {
            // Separate scores by category
            const maleScores = scores.filter(s => s.category === '1');
            const femaleScores = scores.filter(s => s.category === '2');

            // Sort each category separately
            maleScores.sort((a, b) => b.total_score - a.total_score);
            femaleScores.sort((a, b) => b.total_score - a.total_score);

            // Assign ranks within each category
            maleScores.forEach((score, index) => {
                score.rank = index + 1;
            });

            femaleScores.forEach((score, index) => {
                score.rank = index + 1;
            });

            // Combine them back for display (males first, then females)
            scores = [...maleScores, ...femaleScores];
        } else {
            // Single category - normal ranking
            scores.sort((a, b) => b.total_score - a.total_score);
            scores.forEach((score, index) => {
                score.rank = index + 1;
            });
        }

        // Add info row if partial results
        if (completeness && completeness.overall_completion_percentage < 100 && completeness.overall_completion_percentage > 0) {
            const infoRow = document.createElement('tr');
            infoRow.style.backgroundColor = '#fff3cd';
            const infoCell = document.createElement('td');
            infoCell.colSpan = 7;
            infoCell.innerHTML = `
                <div class="alert alert-warning mb-0" style="margin: 10px;">
                    <strong>⚠️ Partial Results:</strong> 
                    ${completeness.overall_completion_percentage}% of expected scores submitted for this criteria type. 
                    Rankings may change as more judges submit.
                    <br>
                    <small>
                        Criteria Type: ${formatRoundTypeName(completeness.round_type) || 'All'} | 
                        Active Judges: ${completeness.active_judges ? completeness.active_judges.length : 0}
                    </small>
                </div>
            `;
            infoRow.appendChild(infoCell);
            tableBody.appendChild(infoRow);
        }

        // Add category headers if "Select All"
        let currentCategory = null;

        scores.forEach(score => {
            // Add category header row when category changes (only for "Select All")
            if (selectedCategory === 'all' && score.category !== currentCategory) {
                currentCategory = score.category;
                const headerRow = document.createElement('tr');
                const isMale = score.category === '1';
                headerRow.style.backgroundColor = isMale ? '#e3f2fd' : '#fce4ec';
                const headerCell = document.createElement('td');
                headerCell.className = 'category-header';
                headerCell.colSpan = 7;
                headerCell.style.fontWeight = 'bold';
                headerCell.style.textAlign = 'center';
                headerCell.style.padding = '12px';
                headerCell.style.fontSize = '16px';
                headerCell.style.color = isMale ? '#1976d2' : '#c2185b';
                headerCell.textContent = score.category === '1' ? 'MALE CATEGORY' : 'FEMALE CATEGORY';
                headerRow.appendChild(headerCell);
                tableBody.appendChild(headerRow);
            }

            const row = document.createElement('tr');
            
            // Photo - circular
            const photoCell = document.createElement('td');
            photoCell.style.textAlign = 'center';
            
            if (score.photo && score.photo !== 'No Photo' && score.photo !== 'null' && score.photo.trim() !== '') {
                const img = document.createElement('img');
                let photoPath = score.photo;
                
                if (!photoPath.startsWith('http') && !photoPath.startsWith('../') && !photoPath.startsWith('./')) {
                    photoPath = photoPath.replace(/^[\/\\]/, '');
                }
                
                img.src = photoPath;
                img.alt = score.candidate_name;
                img.style.width = '50px';
                img.style.height = '50px';
                img.style.objectFit = 'cover';
                img.style.borderRadius = '50%';
                img.style.border = '2px solid #ddd';
                
                img.onerror = function() {
                    console.warn('Failed to load photo:', photoPath);
                    this.style.display = 'none';
                    const fallback = document.createElement('div');
                    fallback.innerHTML = '<span class="text-muted" style="font-size: 12px;">No Photo</span>';
                    photoCell.appendChild(fallback);
                };
                
                photoCell.appendChild(img);
            } else {
                const fallbackDiv = document.createElement('div');
                fallbackDiv.style.width = '50px';
                fallbackDiv.style.height = '50px';
                fallbackDiv.style.borderRadius = '50%';
                fallbackDiv.style.backgroundColor = '#f0f0f0';
                fallbackDiv.style.display = 'flex';
                fallbackDiv.style.alignItems = 'center';
                fallbackDiv.style.justifyContent = 'center';
                fallbackDiv.style.margin = '0 auto';
                fallbackDiv.style.border = '2px solid #ddd';
                fallbackDiv.innerHTML = '<span class="text-muted" style="font-size: 10px;">No Photo</span>';
                photoCell.appendChild(fallbackDiv);
            }

            // Candidate Name
            const nameCell = document.createElement('td');
            nameCell.textContent = score.candidate_name;

            // Candidate Number
            const numberCell = document.createElement('td');
            numberCell.textContent = score.candidate_no;

            // Event Name
            const eventCell = document.createElement('td');
            eventCell.textContent = score.event_name;

            // Criteria Name
            const criteriaCell = document.createElement('td');
            criteriaCell.textContent = score.criteria_name || 'Overall';

            // Total Score with percentage
            const scoreCell = document.createElement('td');
            scoreCell.textContent = score.total_score.toFixed(2) + '%';
            
            if (score.completion_percentage && score.completion_percentage < 100) {
                scoreCell.innerHTML = `${score.total_score.toFixed(2)}% <small class="text-muted">(${score.completion_percentage}% complete)</small>`;
            }

            // Rank
            const rankCell = document.createElement('td');
            rankCell.textContent = score.rank;

            row.appendChild(photoCell);
            row.appendChild(nameCell);
            row.appendChild(numberCell);
            row.appendChild(eventCell);
            row.appendChild(criteriaCell);
            row.appendChild(scoreCell);
            row.appendChild(rankCell);

            tableBody.appendChild(row);
        });
    }
});