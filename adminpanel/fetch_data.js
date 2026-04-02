// fetch_data.js - Enhanced with Round Type Logic and Event Navigation
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const eventSelect = document.getElementById('eventSelect');
    const categorySelect = document.getElementById('categorySelect');
    const candidateSelect = document.getElementById('candidateSelect');
    const criteriaSelect = document.getElementById('criteriaSelect');
    const responseModal = document.getElementById('responseModal');
    const responseMessage = document.getElementById('responseMessage');
    
    // Navigation buttons
    const prevEventBtn = document.querySelector('.prevEvent');
    const nextEventBtn = document.querySelector('.nextEvent');
    const prevCanBtn = document.querySelector('.prevCan');
    const nextCanBtn = document.querySelector('.nextCan');
    const prevCatBtn = document.querySelector('.prevCat');
    const nextCatBtn = document.querySelector('.nextCat');
    const prevCriBtn = document.querySelector('.prevCri');
    const nextCriBtn = document.querySelector('.nextCri');
    
    // Disable candidate selection until criteria is selected
    candidateSelect.disabled = true;
    categorySelect.disabled = true;
    
    // Event listeners for event navigation
    prevEventBtn.addEventListener('click', () => navigateSelect(eventSelect, -1));
    nextEventBtn.addEventListener('click', () => navigateSelect(eventSelect, 1));
    
    // Event listeners for candidate navigation
    prevCanBtn.addEventListener('click', navigateToPrevCandidate);
    nextCanBtn.addEventListener('click', navigateToNextCandidate);
    
    // Category navigation
    prevCatBtn.addEventListener('click', () => navigateSelect(categorySelect, -1));
    nextCatBtn.addEventListener('click', () => navigateSelect(categorySelect, 1));
    
    // Criteria navigation
    prevCriBtn.addEventListener('click', () => navigateSelect(criteriaSelect, -1));
    nextCriBtn.addEventListener('click', () => navigateSelect(criteriaSelect, 1));
    
    // Generic navigation for select elements
    function navigateSelect(selectElement, direction) {
        const currentIndex = selectElement.selectedIndex;
        const newIndex = currentIndex + direction;
        
        if (newIndex > 0 && newIndex < selectElement.options.length) {
            selectElement.selectedIndex = newIndex;
            selectElement.dispatchEvent(new Event('change'));
        }
    }
    
    // Candidate navigation
    function navigateToPrevCandidate() {
        const currentIndex = candidateSelect.selectedIndex;
        if (currentIndex > 1) {
            candidateSelect.selectedIndex = currentIndex - 1;
            candidateSelect.dispatchEvent(new Event('change'));
            checkAndAutoSave();
        }
    }
    
    function navigateToNextCandidate() {
        const currentIndex = candidateSelect.selectedIndex;
        if (currentIndex < candidateSelect.options.length - 1 && currentIndex > 0) {
            candidateSelect.selectedIndex = currentIndex + 1;
            candidateSelect.dispatchEvent(new Event('change'));
            checkAndAutoSave();
        }
    }

    // Initialize Judges Section (populate existing HTML without replacing li or adding h3)
    initializeJudgesSection();

    // Set initial judges count
    updateJudgesCountDisplay();

    // Load events
    loadEvents();

    // Dropdown change listeners
    eventSelect.addEventListener('change', function() {
        loadCriteria(this.value);
        categorySelect.disabled = true;
        candidateSelect.disabled = true;
        categorySelect.value = '';
        candidateSelect.innerHTML = '<option value="" selected disabled>Select Candidate</option>';
        updateEventNavigationButtons();
        checkAndAutoSave();
    });

    criteriaSelect.addEventListener('change', function() {
        if (this.value) {
            categorySelect.disabled = false;
            // Reset category to trigger fresh load
            if (categorySelect.value) {
                loadCandidates(eventSelect.value, categorySelect.value, this.value, true);
            }
        } else {
            categorySelect.disabled = true;
            candidateSelect.disabled = true;
        }
        checkAndAutoSave();
    });

    categorySelect.addEventListener('change', function() {
        if (eventSelect.value && criteriaSelect.value) {
            loadCandidates(eventSelect.value, this.value, criteriaSelect.value, true);
        }
        checkAndAutoSave();
    });

    candidateSelect.addEventListener('change', function() {
        updateNavigationButtonStates();
        checkAndAutoSave();
    });

    // Confirm judges
    document.getElementById('confirmJudgeBtn').addEventListener('click', function() {
        const selectedJudges = [];
        document.querySelectorAll('.judge-checkbox:checked').forEach(checkbox => {
            selectedJudges.push(checkbox.value);
        });

        sessionStorage.setItem('selectedJudges', JSON.stringify(selectedJudges));
        updateJudgesCountDisplay();
        
        const judgeModal = bootstrap.Modal.getInstance(document.getElementById('judgeModal'));
        judgeModal.hide();
        
        checkAndAutoSave();
    });

    // Initialize judges section - populate existing container without creating h3 or replacing li
    function initializeJudgesSection() {
        const judgesContainer = document.getElementById('judgesCheckboxContainer');
        if (!judgesContainer) return;

        // Clear any existing content
        judgesContainer.innerHTML = '';

        const selectedJudgesDiv = document.createElement('div');
        selectedJudgesDiv.id = 'selectedJudgesCount';
        selectedJudgesDiv.textContent = 'Loading judges...';
        selectedJudgesDiv.className = 'judges-count';
        
        const selectJudgesBtn = document.createElement('button');
        selectJudgesBtn.className = 'btn btn-primary select-judges-btn';
        selectJudgesBtn.textContent = 'Select Judges';
        
        selectJudgesBtn.addEventListener('click', function() {
            loadJudges();
            const judgeModal = new bootstrap.Modal(document.getElementById('judgeModal'));
            judgeModal.show();
        });
        
        judgesContainer.appendChild(selectedJudgesDiv);
        judgesContainer.appendChild(selectJudgesBtn);

        // Update display after init
        setTimeout(updateJudgesCountDisplay, 100);
    }

    // Update judges count display
    function updateJudgesCountDisplay() {
        const savedJudges = JSON.parse(sessionStorage.getItem('selectedJudges') || '[]');
        const count = savedJudges.length;
        const selectedJudgesCount = document.getElementById('selectedJudgesCount');
        
        if (!selectedJudgesCount) return;
        
        if (count === 0) {
            selectedJudgesCount.textContent = 'No judges selected';
        } else if (count === 1) {
            selectedJudgesCount.textContent = '1 judge selected';
        } else {
            selectedJudgesCount.textContent = `${count} judges selected`;
        }
    }

    // Auto-save when all fields are filled
    function checkAndAutoSave() {
        const eventId = eventSelect.value;
        const category = categorySelect.value;
        const candidateId = candidateSelect.value;
        const criteriaId = criteriaSelect.value;
        const selectedJudges = JSON.parse(sessionStorage.getItem('selectedJudges') || '[]');
        
        if (eventId && category && candidateId && criteriaId && selectedJudges.length > 0) {
            saveSelections();
        }
    }

    // Update event navigation button states
    function updateEventNavigationButtons() {
        const currentIndex = eventSelect.selectedIndex;
        
        prevEventBtn.disabled = currentIndex <= 0;
        nextEventBtn.disabled = currentIndex < 0 || currentIndex >= eventSelect.options.length - 1;
        
        prevEventBtn.classList.toggle('disabled', prevEventBtn.disabled);
        nextEventBtn.classList.toggle('disabled', nextEventBtn.disabled);
    }

    // Update navigation button states
    function updateNavigationButtonStates() {
        const currentIndex = candidateSelect.selectedIndex;
        
        prevCanBtn.disabled = currentIndex <= 1;
        nextCanBtn.disabled = currentIndex < 1 || currentIndex >= candidateSelect.options.length - 1;
        
        prevCanBtn.classList.toggle('disabled', prevCanBtn.disabled);
        nextCanBtn.classList.toggle('disabled', nextCanBtn.disabled);
    }

    // Load Events
    function loadEvents() {
        fetch('get_events.php')
            .then(response => response.json())
            .then(data => {
                eventSelect.innerHTML = '<option value="" selected disabled>Select Event</option>';
                data.forEach(event => {
                    const option = document.createElement('option');
                    option.value = event.id;
                    option.textContent = event.event_name;
                    eventSelect.appendChild(option);
                });
                checkForLastSavedSelection();
                updateEventNavigationButtons();
            })
            .catch(error => {
                console.error('Error fetching events:', error);
                showModal('Error loading events. Please try again.');
            });
    }

    // Load Criteria with Round Type
    function loadCriteria(eventId) {
        if (!eventId) return;
        
        fetch(`get_criteria.php?event_id=${eventId}`)
            .then(response => response.json())
            .then(data => {
                criteriaSelect.innerHTML = '<option value="" selected disabled>Select Criteria</option>';
                data.forEach(criterion => {
                    const option = document.createElement('option');
                    option.value = criterion.id;
                    option.textContent = criterion.display_name; // Shows "Round Type - Criteria Name"
                    option.setAttribute('data-round-type', criterion.round_type);
                    criteriaSelect.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Error fetching criteria:', error);
                showModal('Error loading criteria. Please try again.');
            });
    }

    // Load Candidates based on round type qualification
    function loadCandidates(eventId, category, criteriaId, autoSelect = false) {
        if (!eventId || !criteriaId) return;
        
        candidateSelect.disabled = true;
        candidateSelect.innerHTML = '<option value="" selected disabled>Loading candidates...</option>';
        
        let url = `get_candidates.php?event_id=${eventId}&criteria_id=${criteriaId}`;
        if (category !== 'all') {
            url += `&category=${category}`;
        }
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                candidateSelect.innerHTML = '<option value="" selected disabled>Select Candidate</option>';
                
                if (data.length === 0) {
                    showModal('No qualified candidates found for this round.');
                    candidateSelect.disabled = true;
                    return;
                }
                
                data.sort((a, b) => {
                    const numA = parseInt(a.candidate_no, 10);
                    const numB = parseInt(b.candidate_no, 10);
                    return numA - numB;
                });
                
                data.forEach(candidate => {
                    const option = document.createElement('option');
                    option.value = candidate.id;
                    option.textContent = `${candidate.candidate_no} - ${candidate.name}`;
                    candidateSelect.appendChild(option);
                });
                
                candidateSelect.disabled = false;
                
                // Auto-select first candidate if autoSelect is true
                if (autoSelect && data.length > 0) {
                    candidateSelect.selectedIndex = 1;
                    candidateSelect.dispatchEvent(new Event('change'));
                }
                
                updateNavigationButtonStates();
            })
            .catch(error => {
                console.error('Error fetching candidates:', error);
                showModal('Error loading candidates. Please try again.');
                candidateSelect.disabled = true;
            });
    }

    // Load Judges (ALL SELECTED BY DEFAULT)
    function loadJudges() {
        fetch('get_judges.php')
            .then(response => response.json())
            .then(data => {
                const judgeCheckboxesContainer = document.getElementById('judgeCheckboxesContainer');
                judgeCheckboxesContainer.innerHTML = '';
                
                const selectAllCheckbox = document.getElementById('select-all-judges');
                const allJudgeIds = [];

                const newSelectAll = selectAllCheckbox.cloneNode(true);
                selectAllCheckbox.replaceWith(newSelectAll);

                newSelectAll.addEventListener('change', function() {
                    const isChecked = this.checked;
                    document.querySelectorAll('.judge-checkbox').forEach(checkbox => {
                        checkbox.checked = isChecked;
                    });
                    updateSelectAllCheckbox();
                });

                data.forEach(judge => {
                    allJudgeIds.push(judge.id);
                    
                    const checkboxDiv = document.createElement('div');
                    checkboxDiv.className = 'form-check judge-item';
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'form-check-input judge-checkbox';
                    checkbox.id = `judge-${judge.id}`;
                    checkbox.value = judge.id;
                    checkbox.checked = true;
                    
                    checkbox.addEventListener('change', updateSelectAllCheckbox);
                    
                    const label = document.createElement('label');
                    label.className = 'form-check-label';
                    label.htmlFor = `judge-${judge.id}`;
                    label.textContent = judge.username;
                    
                    checkboxDiv.appendChild(checkbox);
                    checkboxDiv.appendChild(label);
                    judgeCheckboxesContainer.appendChild(checkboxDiv);
                });

                const savedJudges = sessionStorage.getItem('selectedJudges');
                if (savedJudges) {
                    const savedList = JSON.parse(savedJudges);
                    if (savedList.length > 0) {
                        document.querySelectorAll('.judge-checkbox').forEach(checkbox => {
                            checkbox.checked = savedList.includes(checkbox.value);
                        });
                    }
                } else {
                    sessionStorage.setItem('selectedJudges', JSON.stringify(allJudgeIds));
                    updateJudgesCountDisplay();
                }

                updateSelectAllCheckbox();
            })
            .catch(error => {
                console.error('Error fetching judges:', error);
                showModal('Error loading judges. Please try again.');
            });
    }
    
    // Update Select All checkbox state
    function updateSelectAllCheckbox() {
        const selectAllCheckbox = document.getElementById('select-all-judges');
        if (!selectAllCheckbox) return;
        
        const judgeCheckboxes = document.querySelectorAll('.judge-checkbox');
        const checkedCount = document.querySelectorAll('.judge-checkbox:checked').length;
        
        if (checkedCount === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (checkedCount === judgeCheckboxes.length) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        }
    }
    
    // Check for last saved selection
    function checkForLastSavedSelection() {
        try {
            const savedData = sessionStorage.getItem('lastSavedSelection');
            if (savedData) {
                applyLastSavedSelection();
            }
        } catch (e) {
            console.error('Error checking last saved selection:', e);
        }
    }

    function applyLastSavedSelection() {
        try {
            const savedData = sessionStorage.getItem('lastSavedSelection');
            if (savedData) {
                const data = JSON.parse(savedData);
                
                if (data.eventId && eventSelect) {
                    eventSelect.value = data.eventId;
                    eventSelect.dispatchEvent(new Event('change'));
                    
                    setTimeout(() => {
                        if (data.criteriaId && criteriaSelect) {
                            criteriaSelect.value = data.criteriaId;
                            criteriaSelect.dispatchEvent(new Event('change'));
                        }
                        
                        setTimeout(() => {
                            if (data.categoryId && categorySelect) {
                                categorySelect.value = data.categoryId;
                                categorySelect.dispatchEvent(new Event('change'));
                            }
                            
                            if (data.candidateId && candidateSelect) {
                                setTimeout(() => {
                                    candidateSelect.value = data.candidateId;
                                    candidateSelect.dispatchEvent(new Event('change'));
                                    updateNavigationButtonStates();
                                }, 500);
                            }
                        }, 300);
                    }, 500);
                }
            }
        } catch (e) {
            console.error('Error applying last saved selection:', e);
        }
    }
    
    // Save selections to DB
    function saveSelections() {
        const eventId = eventSelect.value;
        const category = categorySelect.value;
        const candidateId = candidateSelect.value;
        const criteriaId = criteriaSelect.value;
        const selectedJudges = JSON.parse(sessionStorage.getItem('selectedJudges') || '[]');
        
        if (!eventId || !category || !candidateId || !criteriaId || selectedJudges.length === 0) {
            return;
        }
        
        const data = {
            event_id: eventId,
            category: category,
            candidate_id: candidateId,
            criteria_id: criteriaId,
            judge_ids: selectedJudges
        };
        
        fetch('save_selected_data.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                const selectionData = {
                    eventId, 
                    categoryId: category, 
                    candidateId, 
                    criteriaId,
                    timestamp: new Date().getTime()
                };
                sessionStorage.setItem('lastSavedSelection', JSON.stringify(selectionData));
                
                const monitorEvent = document.getElementById('eventmonitorSelect');
                const monitorCategory = document.getElementById('categorymonitorSelect');
                const monitorCriteria = document.getElementById('criteriamonitorSelect');
                
                if (monitorEvent && monitorCategory && monitorCriteria) {
                    monitorEvent.value = eventId;
                    monitorEvent.dispatchEvent(new Event('change'));
                    
                    setTimeout(() => {
                        monitorCategory.value = category;
                        monitorCriteria.value = criteriaId;
                        monitorCriteria.dispatchEvent(new Event('change'));
                    }, 500);
                }
                
                triggerJudgePanelRefresh();
                console.log('Settings saved and judge panels notified');
            }
        })
        .catch(error => {
            console.error('Error saving settings:', error);
        });
    }
    
    // Trigger judge panel refresh
    function triggerJudgePanelRefresh() {
        fetch('set_refresh.php')
            .then(response => response.text())
            .then(data => console.log('Judge panel refresh triggered:', data))
            .catch(error => console.error('Error triggering refresh:', error));
    }

    // Show modal message
    function showModal(message) {
        responseMessage.textContent = message;
        responseModal.style.display = 'flex';
        setTimeout(() => { responseModal.style.display = 'none'; }, 3000);
    }

    // Close modal on outside click
    window.addEventListener('click', function(event) {
        if (event.target === responseModal) {
            responseModal.style.display = 'none';
        }
    });
});