// print.js - Enhanced with Round Type Selection
document.addEventListener('DOMContentLoaded', function() {
    // Get the print icon element
    const printIcon = document.querySelector('.bxs-printer');
    
    // Add click event listener to open Bootstrap modal
    if (printIcon) {
        printIcon.addEventListener('click', function() {
            openPrintModal();
        });
    }
    
    function openPrintModal() {
        // Clone event options from main select
        const eventSelect = document.getElementById('eventmonitorSelect');
        const printEventSelect = document.getElementById('printEventSelect');
        
        // Clear and populate event select
        printEventSelect.innerHTML = '<option value="" selected disabled>Select Event</option>';
        Array.from(eventSelect.options).forEach(option => {
            if (option.value) {
                const newOption = option.cloneNode(true);
                printEventSelect.appendChild(newOption);
            }
        });
        
        // Show the modal using Bootstrap
        const printModal = new bootstrap.Modal(document.getElementById('printModal'));
        printModal.show();
    }
    
    // Handle event change to load criteria with round types
    document.getElementById('printEventSelect').addEventListener('change', function() {
        const eventId = this.value;
        const printCriteriaSelect = document.getElementById('printCriteriaSelect');
        
        if (!eventId) return;
        
        // Clear previous criteria options
        printCriteriaSelect.innerHTML = '<option value="" selected disabled>Select Criteria</option>';
        
        // Fetch criteria for the selected event WITH ROUND TYPE
        fetch(`get_monitor.php?action=get_criteria&event_id=${eventId}`)
            .then(response => response.json())
            .then(data => {
                // Group criteria by round type
                const groupedCriteria = {
                    'regular': [],
                    'top10': [],
                    'top5': [],
                    'top3': []
                };
                
                data.forEach(criteria => {
                    if (groupedCriteria[criteria.round_type]) {
                        groupedCriteria[criteria.round_type].push(criteria);
                    }
                });
                
                // Add criteria grouped by round type
                const roundTypeLabels = {
                    'regular': 'Preliminary',
                    'top10': 'Top 10',
                    'top5': 'Top 5',
                    'top3': 'Top 3'
                };
                
                Object.keys(groupedCriteria).forEach(roundType => {
                    if (groupedCriteria[roundType].length > 0) {
                        // Add optgroup for this round type
                        const optgroup = document.createElement('optgroup');
                        optgroup.label = roundTypeLabels[roundType];
                        
                        groupedCriteria[roundType].forEach(criteria => {
                            const option = document.createElement('option');
                            option.value = criteria.id;
                            option.textContent = criteria.criteria_name;
                            option.setAttribute('data-round-type', criteria.round_type);
                            optgroup.appendChild(option);
                        });
                        
                        printCriteriaSelect.appendChild(optgroup);
                    }
                });
            })
            .catch(error => console.error('Error loading criteria:', error));
    });
    
    // Function to show validation modal
    function showValidationModal(message, type = 'warning') {
        // Remove existing validation modal if any
        const existingModal = document.getElementById('validationModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create modal HTML with better styling
        const modalHTML = `
            <div class="modal fade" id="validationModal" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content" style="border: none; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
                        <div class="modal-body text-center" style="padding: 25px 35px;">
                            <div style="width: 50px; height: 50px; margin: 0 auto 15px; border-radius: 50%; background: ${type === 'warning' ? '#fff3cd' : '#f8d7da'}; display: flex; align-items: center; justify-content: center;">
                                <i class='bx ${type === 'warning' ? 'bx-error-circle' : 'bx-x-circle'}' style='font-size: 28px; color: ${type === 'warning' ? '#ffc107' : '#dc3545'}'></i>
                            </div>
                            <h5 style="margin-bottom: 12px; color: #342E37; font-weight: 600; font-size: 18px;">
                                ${type === 'warning' ? 'Validation Required' : 'Error'}
                            </h5>
                            <p style="margin-bottom: 20px; color: #6c757d; font-size: 14px;">${message}</p>
                            <button type="button" class="btn btn-primary" data-bs-dismiss="modal" style="padding: 8px 35px; border-radius: 25px; font-weight: 500; font-size: 14px;">OK</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Append modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Show modal
        const validationModal = new bootstrap.Modal(document.getElementById('validationModal'));
        validationModal.show();
        
        // Remove modal from DOM after it's hidden
        document.getElementById('validationModal').addEventListener('hidden.bs.modal', function() {
            this.remove();
        });
    }
    
    // Handle print button click
    document.getElementById('printButton').addEventListener('click', function() {
        const printEventSelect = document.getElementById('printEventSelect');
        const printCriteriaSelect = document.getElementById('printCriteriaSelect');
        const showSubScores = document.getElementById('printShowSubScore').checked;
        
        const selectedEvent = printEventSelect.value;
        const selectedEventText = printEventSelect.options[printEventSelect.selectedIndex].text;
        
        const selectedCriteria = printCriteriaSelect.value;
        const selectedCriteriaText = printCriteriaSelect.options[printCriteriaSelect.selectedIndex].text;
        
        // Get round type from selected option
        const selectedOption = printCriteriaSelect.options[printCriteriaSelect.selectedIndex];
        const roundType = selectedOption.getAttribute('data-round-type');
        const roundTypeLabel = selectedOption.parentElement.label || 'Regular Round';
        
        // Validate selections - print modal stays open
        if (!selectedEvent) {
            showValidationModal('Please select an event before printing.', 'warning');
            return;
        }
        
        if (!selectedCriteria) {
            showValidationModal('Please select a criteria before printing.', 'warning');
            return;
        }
        
        // Get print modal instance
        const printModalElement = document.getElementById('printModal');
        const printModal = bootstrap.Modal.getInstance(printModalElement);
        
        // Close the print modal only after validation passes
        printModal.hide();
        
        // Get print container
        const printContainer = document.getElementById('printContainer');
        
        // Fetch all data needed for printing
        Promise.all([
            fetch(`get_monitor.php?action=get_all_judges&event_id=${selectedEvent}`)
                .then(response => response.json()),
            
            fetch(`get_monitor.php?action=get_all_contestants&event_id=${selectedEvent}&criteria_id=${selectedCriteria}`)
                .then(response => response.json()),
            
            fetch(`get_monitor.php?action=get_scores&event_id=${selectedEvent}&criteria_id=${selectedCriteria}`)
                .then(response => response.json()),
            
            fetch(`get_monitor.php?action=get_subcriteria&criteria_id=${selectedCriteria}`)
                .then(response => response.json())
        ])
        .then(([judges, contestants, scores, subcriteria]) => {
            // Process data for printing
            const candidates = {};
            
            // Populate with all contestants (already filtered by round type from API)
            contestants.forEach(contestant => {
                candidates[contestant.id] = {
                    id: contestant.id,
                    name: contestant.name,
                    number: contestant.candidate_no,
                    photo: contestant.photo || 'assets/img/no-profile.png',
                    category: contestant.category || contestant.gender || 'Unknown',
                    scores: {}
                };
            });
            
            // Add score data
            scores.forEach(item => {
                if (!candidates[item.candidate_id]) {
                    candidates[item.candidate_id] = {
                        id: item.candidate_id,
                        name: item.candidate_name,
                        number: item.candidate_no,
                        photo: item.photo || 'assets/img/no-profile.png',
                        category: item.category || item.gender || 'Unknown',
                        scores: {}
                    };
                }
                
                if (!candidates[item.candidate_id].scores[item.judge_id]) {
                    candidates[item.candidate_id].scores[item.judge_id] = {};
                }
                
                candidates[item.candidate_id].scores[item.judge_id][item.subcriteria_id] = item.score;
            });
            
            // Separate candidates by category
            const maleCandidates = [];
            const femaleCandidates = [];
            
            Object.values(candidates).forEach(candidate => {
                const category = (candidate.category || '').toString().toLowerCase();
                if (category === 'male' || category === '1') {
                    maleCandidates.push(candidate);
                } else if (category === 'female' || category === '2') {
                    femaleCandidates.push(candidate);
                }
            });
            
            // Sort candidates by number within each category
            const sortByNumber = (a, b) => (parseInt(a.number, 10) || 0) - (parseInt(b.number, 10) || 0);
            maleCandidates.sort(sortByNumber);
            femaleCandidates.sort(sortByNumber);
            
            // Function to create table for a category
            function createCategoryTable(categoryName, categoryData) {
                if (categoryData.length === 0) return '';
                
                let tableHTML = `
                    <div class="print-page" style="page-break-before: ${categoryName === 'Female' ? 'always' : 'auto'};">
                        <div class="print-header">
                            <h2>JUDGES SCORE REPORT</h2>
                            <div class="print-divider"></div>
                            <h3>${selectedEventText}</h3>
                            <h4>${roundTypeLabel} - ${selectedCriteriaText}</h4>
                            <p class="print-category">${categoryName} Category ${showSubScores ? '(With Sub-Scores)' : ''}</p>
                            <p class="print-date">Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <table class="print-table">
                            <thead>
                                <tr>
                                    <th style="width: 10%;">No.</th>
                `;
                
                // Add judge names as columns
                Object.entries(judges).forEach(([id, name]) => {
                    tableHTML += `<th>${name}</th>`;
                });
                
                tableHTML += `</tr></thead><tbody>`;
                
                // Add rows for each contestant
                categoryData.forEach(candidate => {
                    tableHTML += `<tr><td style="text-align: center; font-weight: 600;">${candidate.number}</td>`;
                    
                    // Add score cell for each judge
                    Object.keys(judges).forEach(judgeId => {
                        tableHTML += '<td style="text-align: center; font-weight: 500;">';
                        
                        if (candidate.scores[judgeId]) {
                            if (showSubScores) {
                                const subScores = [];
                                
                                if (subcriteria && subcriteria.length > 0) {
                                    subcriteria.forEach(sub => {
                                        const subScore = candidate.scores[judgeId][sub.id];
                                        subScores.push(subScore !== undefined ? parseInt(subScore) : '-');
                                    });
                                } else {
                                    const subcriteriaIds = Object.keys(candidate.scores[judgeId]).sort();
                                    subcriteriaIds.forEach(subId => {
                                        const score = candidate.scores[judgeId][subId];
                                        subScores.push(score !== undefined ? parseInt(score) : '-');
                                    });
                                }
                                
                                tableHTML += subScores.join(', ');
                            } else {
                                const judgeScores = Object.values(candidate.scores[judgeId]);
                                const judgeTotal = judgeScores.reduce((sum, score) => sum + parseFloat(score), 0);
                                tableHTML += judgeTotal.toFixed(0);
                            }
                        } else {
                            tableHTML += '-';
                        }
                        
                        tableHTML += '</td>';
                    });
                    
                    tableHTML += `</tr>`;
                });
                
                tableHTML += `</tbody></table>`;
                
                // Add summary footer for this category
                tableHTML += `
                    <div class="print-footer">
                        <p>Total Contestants: ${categoryData.length}</p>
                        <p>Round: ${roundTypeLabel}</p>
                    </div>
                </div>`;
                
                return tableHTML;
            }
            
            // Create print content with separate tables for Male and Female
            let printContent = '';
            
            // Add Male table
            if (maleCandidates.length > 0) {
                printContent += createCategoryTable('Male', maleCandidates);
            }
            
            // Add Female table
            if (femaleCandidates.length > 0) {
                printContent += createCategoryTable('Female', femaleCandidates);
            }
            
            // If no candidates found
            if (maleCandidates.length === 0 && femaleCandidates.length === 0) {
                printContent = `
                    <div class="print-page">
                        <div class="print-header">
                            <h2>JUDGES SCORE REPORT</h2>
                            <div class="print-divider"></div>
                            <h3>${selectedEventText}</h3>
                            <h4>${roundTypeLabel} - ${selectedCriteriaText}</h4>
                            <p class="print-date">Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <p style="text-align: center; padding: 30px; color: #6c757d; font-style: italic;">No contestants found for this round</p>
                    </div>
                `;
            }
            
            // Add content to print container
            printContainer.innerHTML = printContent;
            
            // Create print stylesheet with enhanced design
            const printStyle = document.createElement('style');
            printStyle.id = 'print-style';
            printStyle.innerHTML = `
                @font-face {
                    font-family: 'Poppins';
                    src: url('../assets/fonts/Poppins/Poppins-Regular.ttf') format('truetype');
                    font-weight: 400;
                    font-style: normal;
                }

                @font-face {
                    font-family: 'Poppins';
                    src: url('../assets/fonts/Poppins/Poppins-Medium.ttf') format('truetype');
                    font-weight: 500;
                    font-style: normal;
                }

                @font-face {
                    font-family: 'Poppins';
                    src: url('../assets/fonts/Poppins/Poppins-SemiBold.ttf') format('truetype');
                    font-weight: 600;
                    font-style: normal;
                }

                @font-face {
                    font-family: 'Poppins';
                    src: url('../assets/fonts/Poppins/Poppins-Bold.ttf') format('truetype');
                    font-weight: 700;
                    font-style: normal;
                }
                
                @page {
                    margin: 0;
                    size: auto;
                }
                
                @media print {
                    * {
                        font-family: 'Poppins', sans-serif;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #printContainer, #printContainer * {
                        visibility: visible;
                    }
                    #printContainer {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        display: block !important;
                    }
                    .print-page {
                        width: 100%;
                        margin: 0;
                        padding: 30px 40px;
                    }
                    .print-header {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .print-header h2 {
                        margin: 0;
                        font-size: 20pt;
                        font-weight: 700;
                        color: #1a1a1a;
                        letter-spacing: 1px;
                        text-transform: uppercase;
                    }
                    .print-divider {
                        width: 80px;
                        height: 3px;
                        background: #3498db;
                        margin: 12px auto;
                    }
                    .print-header h3 {
                        margin: 15px 0 8px 0;
                        font-size: 15pt;
                        font-weight: 600;
                        color: #2c3e50;
                    }
                    .print-header h4 {
                        margin: 8px 0;
                        font-size: 13pt;
                        font-weight: 500;
                        color: #34495e;
                    }
                    .print-category {
                        margin: 8px 0;
                        font-size: 12pt;
                        font-weight: 600;
                        color: #667eea;
                    }
                    .print-date {
                        margin: 12px 0 0 0;
                        font-size: 9pt;
                        color: #7f8c8d;
                        font-style: italic;
                    }
                    .print-footer {
                        margin-top: 20px;
                        padding-top: 15px;
                        border-top: 2px solid #dee2e6;
                        text-align: center;
                        font-size: 10pt;
                        color: #6c757d;
                    }
                    .print-footer p {
                        margin: 5px 0;
                    }
                    .print-table {
                        width: 100%;
                        border-collapse: separate;
                        border-spacing: 0;
                        font-size: 11pt;
                        overflow: hidden;
                        border-radius: 10px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                        border: 1px solid #dee2e6;
                    }
                    .print-table thead tr th {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 14px 12px;
                        text-align: center;
                        font-weight: 600;
                        font-size: 11pt;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        border: none;
                        border-right: 1px solid rgba(255,255,255,0.2);
                    }
                    .print-table thead tr th:last-child {
                        border-right: none;
                    }
                    .print-table thead tr th:first-child {
                        border-top-left-radius: 10px;
                    }
                    .print-table thead tr th:last-child {
                        border-top-right-radius: 10px;
                    }
                    .print-table tbody tr {
                        page-break-inside: avoid;
                        background: white;
                    }
                    .print-table tbody tr:nth-child(even) {
                        background: #f8f9fa;
                    }
                    .print-table tbody tr:hover {
                        background: #e9ecef;
                    }
                    .print-table tbody tr:last-child td:first-child {
                        border-bottom-left-radius: 10px;
                    }
                    .print-table tbody tr:last-child td:last-child {
                        border-bottom-right-radius: 10px;
                    }
                    .print-table td {
                        padding: 12px;
                        text-align: center;
                        border: none;
                        border-bottom: 1px solid #dee2e6;
                        border-right: 1px solid #dee2e6;
                        color: #2c3e50;
                    }
                    .print-table td:last-child {
                        border-right: none;
                    }
                    .print-table tbody tr:last-child td {
                        border-bottom: none;
                    }
                }
            `;
            document.head.appendChild(printStyle);
            
            // Open print dialog
            setTimeout(function() {
                window.print();
                
                // Clean up after printing
                setTimeout(function() {
                    printContainer.innerHTML = '';
                    if (document.getElementById('print-style')) {
                        document.head.removeChild(printStyle);
                    }
                }, 1000);
            }, 500);
        })
        .catch(error => {
            console.error('Error fetching data for printing:', error);
            showValidationModal('Error preparing print data. Please try again.', 'error');
        });
    });
});