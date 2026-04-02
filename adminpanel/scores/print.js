// print.js
document.addEventListener('DOMContentLoaded', function() {
    // Get the print icon element
    const printIcon = document.querySelector('.bxs-printer');
    
    // Add click event listener to the print icon
    printIcon.addEventListener('click', function() {
        openPrintModal();
    });
    
    // Helper function to format criteria type names
    function formatCriteriaTypeName(roundType) {
        const names = {
            'regular': 'Preliminary Criteria',
            'preliminary': 'Preliminary Criteria',
            'top10': 'Top 10',
            'top5': 'Top 5',
            'top3': 'Top 3'
        };
        return names[roundType] || roundType;
    }
    
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
    
    // Function to open the print modal
    function openPrintModal() {
        var printModal = new bootstrap.Modal(document.getElementById('printModal'));
        printModal.show();
        
        // Get main dropdown values
        const eventSelect = document.getElementById('eventSelect');
        const roundTypeSelect = document.getElementById('roundTypeSelect');
        const categorySelect = document.getElementById('categorySelect');
        const criteriaSelect = document.getElementById('criteriaSelect');
        
        // Clone and populate event select
        const printEventSelect = document.getElementById('printEventSelect');
        printEventSelect.innerHTML = eventSelect.innerHTML;
        
        // Auto-select current event from main dropdown
        if (eventSelect.value) {
            printEventSelect.value = eventSelect.value;
        }
        
        // Clone and populate round type select
        const printRoundTypeSelect = document.getElementById('printRoundTypeSelect');
        printRoundTypeSelect.innerHTML = roundTypeSelect.innerHTML;
        
        // Auto-select current round type from main dropdown
        if (roundTypeSelect.value) {
            printRoundTypeSelect.value = roundTypeSelect.value;
        }
        
        // Clone and populate category select
        const printCategorySelect = document.getElementById('printCategorySelect');
        printCategorySelect.innerHTML = categorySelect.innerHTML;
        
        // Auto-select current category from main dropdown
        if (categorySelect.value) {
            printCategorySelect.value = categorySelect.value;
        }
        
        // Reset criteria container
        const criteriaContainer = document.getElementById('printCriteriaContainer');
        criteriaContainer.innerHTML = '';
        
        // Add "Select All" checkbox
        const selectAllDiv = document.createElement('div');
        selectAllDiv.style.marginBottom = '10px';
        selectAllDiv.style.paddingBottom = '10px';
        selectAllDiv.style.borderBottom = '2px solid #dee2e6';
        selectAllDiv.style.fontWeight = '600';
        
        const selectAllCheckbox = document.createElement('input');
        selectAllCheckbox.type = 'checkbox';
        selectAllCheckbox.id = 'criteria-select-all';
        selectAllCheckbox.style.marginRight = '8px';
        
        const selectAllLabel = document.createElement('label');
        selectAllLabel.htmlFor = 'criteria-select-all';
        selectAllLabel.textContent = 'Select All';
        selectAllLabel.style.cursor = 'pointer';
        selectAllLabel.style.marginLeft = '5px';
        selectAllLabel.style.fontWeight = '600';
        
        selectAllDiv.appendChild(selectAllCheckbox);
        selectAllDiv.appendChild(selectAllLabel);
        criteriaContainer.appendChild(selectAllDiv);
        
        // Add "Overall" option
        const overallDiv = document.createElement('div');
        overallDiv.style.marginBottom = '5px';
        overallDiv.classList.add('criteria-checkbox-item');
        
        const overallCheckbox = document.createElement('input');
        overallCheckbox.type = 'checkbox';
        overallCheckbox.id = 'criteria-overall';
        overallCheckbox.value = '';
        overallCheckbox.style.marginRight = '8px';
        overallCheckbox.classList.add('individual-criteria');
        
        const overallLabel = document.createElement('label');
        overallLabel.htmlFor = 'criteria-overall';
        overallLabel.textContent = 'Overall';
        overallLabel.style.cursor = 'pointer';
        overallLabel.style.marginLeft = '5px';
        
        overallDiv.appendChild(overallCheckbox);
        overallDiv.appendChild(overallLabel);
        criteriaContainer.appendChild(overallDiv);
        
        // Auto-select "Overall" if it's selected in main dropdown
        if (!criteriaSelect.value || criteriaSelect.value === '') {
            overallCheckbox.checked = true;
        }
        
        // Load criteria for current event and round type from main dropdown
        const currentEventId = eventSelect.value;
        const currentRoundType = roundTypeSelect.value;
        const currentCriteriaId = criteriaSelect.value;
        
        if (currentEventId && currentRoundType) {
            loadCriteriaForPrintModal(currentEventId, currentRoundType, currentCriteriaId);
        }
        
        // Select All functionality
        selectAllCheckbox.addEventListener('change', function() {
            const allCheckboxes = criteriaContainer.querySelectorAll('.individual-criteria');
            allCheckboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
        });
        
        // Update "Select All" state when individual checkboxes change
        criteriaContainer.addEventListener('change', function(e) {
            if (e.target.classList.contains('individual-criteria')) {
                const allCheckboxes = criteriaContainer.querySelectorAll('.individual-criteria');
                const checkedCheckboxes = criteriaContainer.querySelectorAll('.individual-criteria:checked');
                selectAllCheckbox.checked = allCheckboxes.length === checkedCheckboxes.length;
            }
        });
        
        // Event listener for event change in print modal
        printEventSelect.addEventListener('change', function(e) {
            const eventId = e.target.value;
            const roundType = printRoundTypeSelect.value;
            if (eventId && roundType) {
                loadCriteriaForPrintModal(eventId, roundType, '');
            } else {
                // Clear criteria except Select All and Overall
                clearCriteriaCheckboxes();
            }
        });
        
        // Event listener for round type change in print modal
        printRoundTypeSelect.addEventListener('change', function(e) {
            const eventId = printEventSelect.value;
            const roundType = e.target.value;
            if (eventId && roundType) {
                loadCriteriaForPrintModal(eventId, roundType, '');
            } else {
                // Clear criteria except Select All and Overall
                clearCriteriaCheckboxes();
            }
        });
        
        // Print button click handler - FIXED VERSION
        const printBtn = document.getElementById('printBtn');
        
        // Remove any existing event listeners by cloning the element
        printBtn.replaceWith(printBtn.cloneNode(true));
        const newPrintBtn = document.getElementById('printBtn');
        
        newPrintBtn.addEventListener('click', function printButtonHandler() {
            // Get selected values from print modal
            const selectedEvent = printEventSelect.value;
            const selectedEventText = printEventSelect.options[printEventSelect.selectedIndex].text;
            
            // Validate: Check if event is selected
            if (!selectedEvent) {
                showValidationModal('Please select an event before printing.', 'warning');
                return;
            }
            
            // Get selected round type
            const selectedRoundType = printRoundTypeSelect.value;
            const selectedRoundTypeText = formatCriteriaTypeName(printRoundTypeSelect.value);
            
            // Validate: Check if round type is selected
            if (!selectedRoundType) {
                showValidationModal('Please select a criteria type before printing.', 'warning');
                return;
            }
            
            // Get selected category
            const selectedCategory = printCategorySelect.value;
            const selectedCategoryText = printCategorySelect.options[printCategorySelect.selectedIndex].text;
            
            // Validate: Check if category is selected
            if (!selectedCategory) {
                showValidationModal('Please select a category before printing.', 'warning');
                return;
            }
            
            // Get selected criteria
            const selectedCriteria = [];
            const criteriaCheckboxes = criteriaContainer.querySelectorAll('.individual-criteria:checked');
            criteriaCheckboxes.forEach(checkbox => {
                let criteriaId = checkbox.value;
                let criteriaName = checkbox.nextElementSibling.textContent;
                selectedCriteria.push({
                    id: criteriaId,
                    name: criteriaName
                });
            });
            
            // Validate: If no criteria selected, show modal
            if (selectedCriteria.length === 0) {
                showValidationModal('Please select at least one criteria to print.', 'warning');
                return;
            }
            
            // Close the modal after validation passes
            printModal.hide();
            
            // Create a print container
            const printContainer = document.createElement('div');
            printContainer.id = 'printContainer';
            printContainer.style.display = 'none';
            document.body.appendChild(printContainer);
            
            // Determine if we need to split by categories
            const categoriesToPrint = selectedCategory === 'all' 
                ? [{id: '1', name: 'Male'}, {id: '2', name: 'Female'}] 
                : [{id: selectedCategory, name: selectedCategoryText}];
            
            // Set up print data fetching
            let fetchPromises = [];
            
            // Loop through each category if "Select All" is chosen
            categoriesToPrint.forEach(category => {
                selectedCriteria.forEach(criteria => {
                    let url = `get_scores.php?event_id=${selectedEvent}&round_type=${selectedRoundType}`;
                    
                    // Always include specific category when splitting
                    url += `&category=${category.id}`;
                    
                    if (criteria.id) {
                        url += `&criteria_id=${criteria.id}`;
                    }
                    
                    // Add parameter to show partial results
                    url += '&show_partial=true';
                    
                    // Create a promise for this fetch operation
                    const fetchPromise = fetch(url)
                        .then(response => response.json())
                        .then(data => {
                            let results;
                            
                            // Check if we received the new format with 'results' property
                            if (data.results) {
                                results = data.results;
                            } else if (Array.isArray(data)) {
                                // Original format (direct array)
                                results = data;
                            } else {
                                results = [];
                            }
                            
                            return {
                                criteriaId: criteria.id,
                                criteriaName: criteria.name,
                                categoryId: category.id,
                                categoryName: category.name,
                                roundType: selectedRoundTypeText,
                                results: results
                            };
                        })
                        .catch(error => {
                            console.error('Error loading scores:', error);
                            return {
                                criteriaId: criteria.id,
                                criteriaName: criteria.name,
                                categoryId: category.id,
                                categoryName: category.name,
                                roundType: selectedRoundTypeText,
                                results: []
                            };
                        });
                    
                    fetchPromises.push(fetchPromise);
                });
            });
            
            // Process all fetches
            Promise.all(fetchPromises).then(allData => {
                // Create print content
                let printContent = '';
                let pageIndex = 0;
                
                // Use a Set to track unique combinations and avoid duplicates
                const processedCombinations = new Set();
                
                allData.forEach((data) => {
                    const { criteriaId, criteriaName, categoryId, categoryName, roundType, results } = data;
                    
                    // Create a unique key for this combination
                    const combinationKey = `${criteriaId}-${categoryId}`;
                    
                    // Skip if we've already processed this combination
                    if (processedCombinations.has(combinationKey)) {
                        return;
                    }
                    
                    // Mark this combination as processed
                    processedCombinations.add(combinationKey);
                    
                    // Sort candidates by their total score (descending)
                    const sortedResults = [...results].sort((a, b) => b.total_score - a.total_score);
                    
                    // Assign ranks
                    let currentRank = 1;
                    let previousScore = sortedResults.length > 0 ? sortedResults[0].total_score : 0;
                    
                    sortedResults.forEach((candidate, idx) => {
                        // If current score is different from previous, increment rank
                        if (candidate.total_score < previousScore) {
                            currentRank = idx + 1;
                            previousScore = candidate.total_score;
                        }
                        candidate.rank = currentRank;
                    });
                    
                    // Create a new page for each criteria + category combination
                    printContent += `
                        <div class="print-page" ${pageIndex > 0 ? 'style="page-break-before: always;"' : ''}>
                            <div class="print-header">
                                <h2>CONTESTANTS SCORE REPORT</h2>
                                <div class="print-divider"></div>
                                <h3>${selectedEventText}</h3>
                                <h4>${roundType} - ${criteriaName} - ${categoryName}</h4>
                                <p class="print-date">Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                            <table class="print-table">
                                <thead>
                                    <tr>
                                        <th style="width: 10%;">No.</th>
                                        <th style="width: 50%; text-align: left;">Candidate Name</th>
                                        <th style="width: 20%;">Total Score</th>
                                        <th style="width: 20%;">Rank</th>
                                    </tr>
                                </thead>
                                <tbody>
                    `;
                    
                    if (sortedResults.length === 0) {
                        printContent += `
                            <tr>
                                <td colspan="4" style="text-align: center; padding: 30px; color: #6c757d; font-style: italic;">No data available</td>
                            </tr>
                        `;
                    } else {
                        sortedResults.forEach(candidate => {
                            printContent += `
                                <tr>
                                    <td style="text-align: center; font-weight: 600;">${candidate.candidate_no || 'N/A'}</td>
                                    <td style="text-align: left; padding-left: 15px;">${candidate.candidate_name || 'Unknown'}</td>
                                    <td style="text-align: center; font-weight: 500;">${typeof candidate.total_score === 'number' ? candidate.total_score.toFixed(2) : '0.00'}%</td>
                                    <td style="text-align: center; font-weight: 700; color: #2c3e50;">${candidate.rank}</td>
                                </tr>
                            `;
                        });
                    }
                    
                    printContent += `
                                </tbody>
                            </table>
                    `;
                    
                    // Add signature line only for Overall criteria (when criteriaId is empty)
                    if (!criteriaId || criteriaId === '') {
                        printContent += `
                            <div class="signature-section">
                                <div class="signature-line"></div>
                                <p class="signature-label">TABULATOR</p>
                            </div>
                        `;
                    }
                    
                    printContent += `
                        </div>
                    `;
                    
                    pageIndex++;
                });
                
                // Add content to print container
                printContainer.innerHTML = printContent;
                
                // Create a print-specific stylesheet
                const printStyle = document.createElement('style');
                printStyle.id = 'print-style';
                printStyle.innerHTML = `
                    @font-face {
                        font-family: 'Poppins';
                        src: url('../../assets/fonts/Poppins/Poppins-Regular.ttf') format('truetype');
                        font-weight: 400;
                        font-style: normal;
                    }

                    @font-face {
                        font-family: 'Poppins';
                        src: url('../../assets/fonts/Poppins/Poppins-Medium.ttf') format('truetype');
                        font-weight: 500;
                        font-style: normal;
                    }

                    @font-face {
                        font-family: 'Poppins';
                        src: url('../../assets/fonts/Poppins/Poppins-SemiBold.ttf') format('truetype');
                        font-weight: 600;
                        font-style: normal;
                    }

                    @font-face {
                        font-family: 'Poppins';
                        src: url('../../assets/fonts/Poppins/Poppins-Bold.ttf') format('truetype');
                        font-weight: 700;
                        font-style: normal;
                    }
                    
                    @page {
                        margin: 0;
                        size: auto;
                    }
                    
                    @media print {
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
                            font-family: 'Poppins', sans-serif;
                        }
                        .print-page {
                            width: 100%;
                            height: 100vh;
                            margin: 0;
                            padding: 30px 40px;
                            font-family: 'Poppins', sans-serif;
                            position: relative;
                            box-sizing: border-box;
                        }
                        .print-header {
                            text-align: center;
                            margin-bottom: 30px;
                            font-family: 'Poppins', sans-serif;
                        }
                        .print-header h2 {
                            margin: 0;
                            font-size: 20pt;
                            font-weight: 700;
                            color: #1a1a1a;
                            letter-spacing: 1px;
                            text-transform: uppercase;
                            font-family: 'Poppins', sans-serif;
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
                            font-family: 'Poppins', sans-serif;
                        }
                        .print-header h4 {
                            margin: 8px 0;
                            font-size: 13pt;
                            font-weight: 500;
                            color: #34495e;
                            font-family: 'Poppins', sans-serif;
                        }
                        .print-date {
                            margin: 12px 0 0 0;
                            font-size: 9pt;
                            color: #7f8c8d;
                            font-style: italic;
                            font-family: 'Poppins', sans-serif;
                        }
                        .print-table {
                            width: 100%;
                            border-collapse: separate;
                            border-spacing: 0;
                            font-size: 11pt;
                            overflow: hidden;
                            border-radius: 10px;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                            font-family: 'Poppins', sans-serif;
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
                            border-bottom: 1px solid #e0e0e0;
                            color: #2c3e50;
                        }
                        .print-table tbody tr:last-child td {
                            border-bottom: none;
                        }
                        .signature-section {
                            position: absolute;
                            bottom: 80px;
                            right: 80px;
                            width: 300px;
                            text-align: center;
                        }
                        .signature-line {
                            width: 100%;
                            height: 0;
                            border-bottom: 2px solid #2c3e50;
                            margin-bottom: 8px;
                        }
                        .signature-label {
                            font-size: 10pt;
                            font-weight: 600;
                            color: #2c3e50;
                            letter-spacing: 1.5px;
                            text-transform: uppercase;
                            font-family: 'Poppins', sans-serif;
                            margin: 0;
                            padding: 0;
                        }
                    }
                `;
                document.head.appendChild(printStyle);
                
                // Open print dialog
                setTimeout(function() {
                    window.print();
                    
                    // Clean up after printing
                    setTimeout(function() {
                        document.body.removeChild(printContainer);
                        document.head.removeChild(printStyle);
                    }, 1000);
                }, 500);
            }).catch(error => {
                console.error('Error processing print data:', error);
                showValidationModal('Error preparing print data. Please try again.', 'error');
            });
        });
    }

    // Helper function to clear criteria checkboxes (except Select All and Overall)
    function clearCriteriaCheckboxes() {
        const criteriaContainer = document.getElementById('printCriteriaContainer');
        const criteriaItems = criteriaContainer.querySelectorAll('.criteria-checkbox-item');
        
        criteriaItems.forEach(item => {
            // Skip the first two items (Select All and Overall)
            if (item !== criteriaContainer.firstChild && item !== criteriaContainer.children[1]) {
                item.remove();
            }
        });
    }

    // Separate function to load criteria for print modal - FIXED VERSION
    function loadCriteriaForPrintModal(eventId, roundType, selectedCriteriaId) {
        const criteriaContainer = document.getElementById('printCriteriaContainer');
        
        // Clear previous criteria except Select All and Overall
        clearCriteriaCheckboxes();
        
        // Fetch criteria for the selected event and round type
        let url = `get_criteria.php?event_id=${eventId}`;
        if (roundType && roundType !== '') {
            url += `&round_type=${roundType}`;
        }
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                data.forEach(criteria => {
                    const div = document.createElement('div');
                    div.style.marginBottom = '5px';
                    div.classList.add('criteria-checkbox-item');
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.id = 'criteria-' + criteria.id;
                    checkbox.value = criteria.id;
                    checkbox.style.marginRight = '8px';
                    checkbox.classList.add('individual-criteria');
                    
                    // Auto-select if this criteria matches the selected one in main dropdown
                    if (selectedCriteriaId && selectedCriteriaId == criteria.id) {
                        checkbox.checked = true;
                    }
                    
                    const label = document.createElement('label');
                    label.htmlFor = 'criteria-' + criteria.id;
                    label.textContent = criteria.criteria_name;
                    label.style.cursor = 'pointer';
                    label.style.marginLeft = '5px';
                    
                    div.appendChild(checkbox);
                    div.appendChild(label);
                    criteriaContainer.appendChild(div);
                });
                
                // Update "Select All" checkbox state
                const selectAllCheckbox = document.getElementById('criteria-select-all');
                const allCheckboxes = criteriaContainer.querySelectorAll('.individual-criteria');
                const checkedCheckboxes = criteriaContainer.querySelectorAll('.individual-criteria:checked');
                selectAllCheckbox.checked = allCheckboxes.length === checkedCheckboxes.length && allCheckboxes.length > 0;
            })
            .catch(error => {
                console.error('Error loading criteria:', error);
                showValidationModal('Failed to load criteria. Please try again.', 'error');
            });
    }
});