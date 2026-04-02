// script.js
document.addEventListener('DOMContentLoaded', function() {
    // Fetch judge information and selected data
    fetchJudgeData();
    fetchEventAndCandidateData();
    
    // Add modal HTML structure to the document
    addModalToDOM();
});

// Variable to track refresh status
let lastRefreshValue = null;

// Function to add modal HTML to the DOM
function addModalToDOM() {
    const modalHTML = `
        <div class="modal-overlay" id="modal-overlay">
            <div class="modal-content">
                <h4 id="modal-title">Message</h4>
                <p id="modal-message"></p>
                <div id="modal-buttons">
                    <button class="btn btn-primary" onclick="closeModal()">OK</button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal HTML to the body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add modal styles to the document
    const modalStyles = `
        <style>
            .modal-overlay {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            
            .modal-content {
                background-color: white;
                padding: 20px;
                border-radius: 5px;
                max-width: 500px;
                width: 80%;
                text-align: center;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
            }
            
            #modal-buttons {
                margin-top: 15px;
            }
            
            .auto-close-modal .modal-content {
                padding-bottom: 30px;
            }
            
            .auto-close-modal #modal-buttons {
                display: none;
            }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', modalStyles);
}

// Function to show modal
function showModal(message, title = 'Message', callback = null, autoClose = false) {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalMessage = document.getElementById('modal-message');
    const modalTitle = document.getElementById('modal-title');
    const modalButtons = document.getElementById('modal-buttons');
    
    modalTitle.textContent = title;
    modalMessage.innerHTML = message;
    
    modalMessage.style.display = 'block';
    modalTitle.style.display = 'block';
    
    if (autoClose) {
        modalOverlay.classList.add('auto-close-modal');
        modalButtons.style.display = 'none';
        
        // Auto close after 1 second
        setTimeout(() => {
            closeModal();
            if (callback && typeof callback === 'function') {
                callback();
            }
        }, 1000);
    } else {
        modalOverlay.classList.remove('auto-close-modal');
        modalButtons.style.display = 'block';
        
        if (callback) {
            modalOverlay.dataset.callback = true;
            window.modalCallback = callback;
        } else {
            modalOverlay.dataset.callback = false;
        }
    }
    
    modalOverlay.style.display = 'flex';
}

// Function to close modal
function closeModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    modalOverlay.style.display = 'none';
    modalOverlay.classList.remove('auto-close-modal');
    
    const modalButtons = document.getElementById('modal-buttons');
    modalButtons.style.display = 'block';
    
    if (modalOverlay.dataset.callback === 'true' && typeof window.modalCallback === 'function') {
        window.modalCallback();
        window.modalCallback = null;
    }
}

// Function to show confirmation modal
function showConfirmModal(message, confirmCallback) {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = modalOverlay.querySelector('.modal-content');
    const originalContent = modalContent.innerHTML;
    
    modalContent.innerHTML = `
        <h4>Confirmation</h4>
        <p>${message}</p>
        <div id="modal-buttons">
            <button class="btn btn-primary" onclick="handleConfirm()">Confirm</button><br>
            <button class="btn btn-secondary mr-2" onclick="restoreModalContent()">Cancel</button>
        </div>
    `;
    
    window.originalModalContent = originalContent;
    window.confirmCallback = confirmCallback;
    
    modalOverlay.style.display = 'flex';
}

// Function to restore original modal content
function restoreModalContent() {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = modalOverlay.querySelector('.modal-content');
    
    if (window.originalModalContent) {
        modalContent.innerHTML = window.originalModalContent;
        window.originalModalContent = null;
    }
    
    modalOverlay.style.display = 'none';
}

// Function to handle confirm button click
function handleConfirm() {
    restoreModalContent();
    
    if (typeof window.confirmCallback === 'function') {
        window.confirmCallback();
        window.confirmCallback = null;
    }
}

// Function to fetch judge data
function fetchJudgeData() {
    fetch('get_judge_data.php')
        .then(response => response.json())
        .then(data => {
            if(data.success) {
                document.getElementById('judge-name').textContent = "" + data.judge_username;
            } else {
                console.error('Error fetching judge data:', data.message);
                document.getElementById('judge-name').textContent = 'Session Error';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('judge-name').textContent = 'Error Loading Judge';
        });
}

// Store subcriteria data for calculations
let subcriteriaData = [];

// Function to fetch event and candidate data
function fetchEventAndCandidateData() {
    fetch('get_selected_data.php')
        .then(response => response.json())
        .then(data => {
            if(data.success) {
                // Update event name
                document.getElementById('event-name').textContent = data.event_name;
                
                // Update criteria title (inside the box, without badge)
                const criteriaTitle = document.getElementById('criteria-title');
                criteriaTitle.textContent = data.criteria_name;
                
                // Update candidate information
                const candidatePhoto = document.getElementById('candidate-photo');
                candidatePhoto.src = '../adminpanel/contestants/' + data.photo;
                candidatePhoto.alt = data.candidate_name;
                
                document.getElementById('candidate-number').textContent = 'Candidate #' + data.candidate_number;
                // Candidate name removed from here
                document.getElementById('candidate-num-box').textContent = data.candidate_number;
                document.getElementById('candidate-name-info').textContent = data.candidate_name;
                
                // Store subcriteria data globally
                subcriteriaData = data.subcriteria || [];
                
                const scores = data.scores || [];
                console.log('Scores from response:', scores);
                
                // Generate scoring form with all data including scores
                generateScoringForm(
                    data.subcriteria,
                    data.candidate_id,
                    data.criteria_id,
                    data.min_score,
                    data.max_score,
                    data.percentage,
                    scores
                );
            } else {
                console.error('Error fetching data:', data.message);
                document.getElementById('event-name').textContent = 'Error Loading Event';
                document.getElementById('criteria-title').textContent = 'Error Loading Criteria';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('event-name').textContent = 'Error Loading Data';
        });
}

function findScore(subcriteriaId, scores) {
    if (!scores || scores.length === 0) {
        console.log(`No scores found for subcriteria ID: ${subcriteriaId}`);
        return null;
    }
    
    console.log(`Looking for score with subcriteria ID: ${subcriteriaId}, type: ${typeof subcriteriaId}`);
    
    if (subcriteriaId === null) {
        const mainScore = scores.find(s => s.subcriteria_id === null);
        const result = mainScore ? parseFloat(mainScore.score) : null;
        console.log(`Found main criteria score: ${result}`);
        return result;
    }
    
    const targetSubId = String(subcriteriaId);
    
    const scoreObj = scores.find(s => {
        if (s.subcriteria_id === null) return false;
        return String(s.subcriteria_id) === targetSubId;
    });
    
    if (scoreObj) {
        const result = parseFloat(scoreObj.score);
        console.log(`Found score ${result} for subcriteria ${subcriteriaId}`);
        return result;
    } else {
        console.log(`No score found for subcriteria ${subcriteriaId} among available scores:`, 
            scores.map(s => `ID: ${s.subcriteria_id}, Score: ${s.score}`));
        return null;
    }
}

// Function to generate the scoring form
function generateScoringForm(subcriteria, candidateId, criteriaId, mainMinScore, mainMaxScore, mainPercentage, scores = []) {
    const criteriaList = document.getElementById('criteria-list');
    criteriaList.innerHTML = '';
    
    console.log('Scores for form generation:', scores);
    
    if (!subcriteria || subcriteria.length === 0) {
        const criteriaName = document.getElementById('criteria-title').textContent;
        const minScore = parseFloat(mainMinScore) || 0;
        const maxScore = parseFloat(mainMaxScore) || 10;
        const percentage = parseFloat(mainPercentage) || 100;
        
        console.log('Main criteria values:', {
            criteriaName: criteriaName,
            minScore: minScore,
            maxScore: maxScore,
            percentage: percentage
        });
        
        const dbScore = findScore(null, scores);
        console.log('Database score for main criteria:', dbScore);
        
        const initialValue = dbScore !== null ? dbScore : minScore;
        
        const scoreDiv = document.createElement('div');
        scoreDiv.className = 'score-item';
        scoreDiv.innerHTML = `
            <div class="score-row">
                <label for="score-main">${criteriaName} (${percentage}%) [${minScore}-${maxScore}]</label>
                <div class="score-control">
                    <button type="button" class="btn btn-outline-danger" onclick="decrementScore('score-main')">-</button>
                    <input type="number" id="score-main" class="form-control" value="${initialValue}" min="${minScore}" max="${maxScore}" required
                           data-min="${minScore}" data-max="${maxScore}" data-percentage="${percentage}" step="1">
                    <button type="button" class="btn btn-outline-success" onclick="incrementScore('score-main')">+</button>
                </div>
            </div>
        `;
        criteriaList.appendChild(scoreDiv);
    } else {
        subcriteria.forEach((criterion, index) => {
            const scoreDiv = document.createElement('div');
            scoreDiv.className = 'score-item';
            
            const minScore = parseFloat(criterion.min_score) || 0;
            const maxScore = parseFloat(criterion.max_score) || 10;
            const percentage = parseFloat(criterion.percentage) || 0;
            
            const subcriteriaId = criterion.id;
            
            console.log(`Processing subcriteria: ${criterion.sub_criteria_name}, ID: ${subcriteriaId}`);
            
            const dbScore = findScore(subcriteriaId, scores);
            console.log(`Database score for subcriteria ${subcriteriaId} (${criterion.sub_criteria_name}):`, dbScore);
            
            const initialValue = dbScore !== null ? parseFloat(dbScore).toFixed(0) : minScore.toFixed(0);
            
            scoreDiv.innerHTML = `
                <div class="score-row">
                    <label for="score-${index}">${criterion.sub_criteria_name} (${percentage}%) [${minScore}-${maxScore}]</label>
                    <div class="score-control">
                        <button type="button" class="btn btn-outline-danger" onclick="decrementScore('score-${index}')">-</button>
                        <input type="number" id="score-${index}" data-subcriteria-id="${subcriteriaId}" 
                               class="form-control" value="${initialValue}" min="${minScore}" max="${maxScore}" required
                               data-min="${minScore}" data-max="${maxScore}" 
                               data-percentage="${percentage}" step="1">
                        <button type="button" class="btn btn-outline-success" onclick="incrementScore('score-${index}')">+</button>
                    </div>
                </div>
            `;
            criteriaList.appendChild(scoreDiv);
        });
    }
    
    const hiddenFields = document.createElement('div');
    hiddenFields.innerHTML = `
        <input type="hidden" id="candidate-id" value="${candidateId}">
        <input type="hidden" id="criteria-id" value="${criteriaId}">
        <input type="hidden" id="is-update" value="${scores && scores.length > 0 ? '1' : '0'}">
    `;
    criteriaList.appendChild(hiddenFields);
    
    const submitBtn = document.querySelector('button[onclick="submitScores()"]');
    if (submitBtn) {
        submitBtn.textContent = scores && scores.length > 0 ? 'Update Scores' : 'Submit Scores';
    }
    
    adjustLayoutBasedOnScreenSize();
    window.addEventListener('resize', adjustLayoutBasedOnScreenSize);
    
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        .score-item {
            margin-bottom: 15px;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background-color: #f9f9f9;
        }
        .score-row {
            display: flex;
            flex-direction: column;
        }
        .score-row label {
            margin-bottom: 5px;
            font-weight: bold;
        }
        .score-control {
            display: flex;
            align-items: center;
        }
        .score-control input {
            flex: 1;
            text-align: center;
            margin: 0 5px;
        }
        @media (min-width: 768px) {
            .score-row {
                flex-direction: column;
                justify-content: space-between;
                align-items: center;
            }
            .score-row label {
                margin-bottom: 0;
                flex: 1;
            }
            .score-control {
                flex: 1;
                justify-content: flex-end;
            }
        }
    `;
    document.head.appendChild(styleEl);
}

function adjustLayoutBasedOnScreenSize() {
    const criteriaList = document.getElementById('criteria-list');
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        criteriaList.style.display = 'block';
    } else {
        criteriaList.style.display = 'flex';
        criteriaList.style.flexWrap = 'wrap';
        criteriaList.style.justifyContent = 'space-between';
    }
}

function incrementScore(inputId) {
    const input = document.getElementById(inputId);
    let value = parseFloat(input.value) || 0;
    const max = parseFloat(input.getAttribute('data-max')) || 10;
    const step = 1;
    
    if (value + step <= max) {
        input.value = (value + step).toFixed(0);
    } else {
        input.value = max.toFixed(0);
    }
}

function decrementScore(inputId) {
    const input = document.getElementById(inputId);
    let value = parseFloat(input.value) || 0;
    const min = parseFloat(input.getAttribute('data-min')) || 0;
    const step = 1;
    
    if (value - step >= min) {
        input.value = (value - step).toFixed(0);
    } else {
        input.value = min.toFixed(0);
    }
}

function submitScores() {
    const isUpdate = document.getElementById('is-update').value === '1';
    const confirmMessage = isUpdate ? 
        'Are you sure you want to update your scores?' : 
        'Are you sure you want to submit your scores?';
    
    showConfirmModal(confirmMessage, function() {
        const scoreInputs = document.querySelectorAll('.score-item input[type="number"]');
        const candidateId = document.getElementById('candidate-id').value;
        const criteriaId = document.getElementById('criteria-id').value;
        
        let allValid = true;
        let scores = [];
        
        scoreInputs.forEach(input => {
            const score = parseFloat(input.value);
            const min = parseFloat(input.getAttribute('data-min')) || 0;
            const max = parseFloat(input.getAttribute('data-max')) || 10;
            
            // ✅ ADD THIS CHECK: Prevent zero scores
            if (score === 0) {
                allValid = false;
                input.classList.add('is-invalid');
                showModal('Score cannot be zero (0). Please enter a valid score.', 'Invalid Score', null, true);
                return;
            }
            
            if (isNaN(score) || score < min || score > max) {
                allValid = false;
                input.classList.add('is-invalid');
                showModal(`Invalid score: ${score}. Must be between ${min} and ${max}.`, 'Validation Error', null, true);
                return;
            } else {
                input.classList.remove('is-invalid');
                
                if (input.id === 'score-main') {
                    scores.push({
                        subcriteria_id: null,
                        score: score
                    });
                } else {
                    const subcriteriaId = input.getAttribute('data-subcriteria-id');
                    scores.push({
                        subcriteria_id: subcriteriaId,
                        score: score
                    });
                }
            }
        });
        
        if (!allValid) {
            showModal('Please enter valid scores within the allowed range for all criteria.', 'Validation Error', null, true);
            return;
        }
        
        console.log('Submitting scores:', {
            candidate_id: candidateId,
            criteria_id: criteriaId,
            scores: scores,
            is_update: document.getElementById('is-update').value
        });
        
        const formData = new FormData();
        formData.append('candidate_id', candidateId);
        formData.append('criteria_id', criteriaId);
        formData.append('scores', JSON.stringify(scores));
        formData.append('is_update', document.getElementById('is-update').value);
        
        fetch('submit_scores.php', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                const successMsg = isUpdate ? 'Scores updated successfully!' : 'Scores submitted successfully!';
                
                showModal(successMsg, 'Success', function() {
                    document.getElementById('is-update').value = '1';
                    
                    const submitBtn = document.querySelector('button[onclick="submitScores()"]');
                    if (submitBtn) {
                        submitBtn.textContent = 'Update Scores';
                    }
                    
                    if (isUpdate) {
                        // For updates, no need to refresh
                    } else {
                        refreshScores();
                    }
                }, true);
            } else {
                showModal(data.message || 'An error occurred while processing scores.', 'Error', null, true); 
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showModal('An error occurred while processing scores. Please try again.', 'Error', null, true);
        });
    });
}

function refreshScores() {
    const candidateId = document.getElementById('candidate-id').value;
    const criteriaId = document.getElementById('criteria-id').value;
    
    fetch('get_selected_data.php')
        .then(response => response.json())
        .then(data => {
            if(data.success) {
                fetchScores(candidateId, criteriaId, data);
            }
        })
        .catch(error => {
            console.error('Error refreshing scores:', error);
        });
}

// Initialize page refresh checking
setInterval(() => {
    fetch("../adminpanel/check_refresh.php")
        .then(res => res.text())
        .then(data => {
            const current = parseInt(data.trim());
            if (lastRefreshValue === null) {
                lastRefreshValue = current;
            } else if (current > lastRefreshValue) {
                lastRefreshValue = current;
                location.reload();
            }
        });
}, 100); // 0.1 seconds