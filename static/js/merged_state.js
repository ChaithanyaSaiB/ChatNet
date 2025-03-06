// function buildDynamicURL(threadId, queryIds, justqueryIdsList, json) {
//     const baseURL = '/thread?thread_id=' + threadId;
//     let queryParams = '';

//     if (Array.isArray(queryIds)) {
//         // If queryIds is an array, handle multiple query IDs
//         queryParams = queryIds.map(id => 'query_id=' + id).join('&');
//     } else if (queryIds !== undefined && queryIds !== null) {
//         // If queryIds is a single value (and not undefined or null), handle single query ID
//         queryParams = 'query_id=' + queryIds;
//     } else {
//         console.error('Invalid query ID(s) provided:', queryIds);
//     }

//     if (json) {
//         return baseURL + (queryParams ? '&' + queryParams : '') + '&json_response_format=true';
//     } else {
//         return baseURL + (queryParams ? '&' + queryParams : '');
//     }
// }

document.addEventListener('DOMContentLoaded', function () {
    window.selectCheckBoxesEventListener = function () {
        const hiddenInput = document.querySelector('input[name="just_query_ids"]');
        const selectGroupCheckboxes = document.querySelectorAll('.select-group');
        const groups = document.querySelectorAll('.conversation-group');

        // Function to update the `just_query_ids` value
        function updateJustQueryIds() {
            let justQueryIds = [];
            groups.forEach((group, index) => {
                if (!selectGroupCheckboxes[index]?.checked) { // Check if the toggle is OFF
                    const lastUnit = group.querySelector('.conversation-unit.last');
                    if (lastUnit) {
                        const queryId = lastUnit.querySelector('.query_id').dataset.value;
                        justQueryIds.push(queryId);
                    }
                }
            });
            hiddenInput.value = justQueryIds.join(',');
            console.log(`Updated just_query_ids: ${hiddenInput.value}`);
        }

        // Add event listeners to each checkbox
        selectGroupCheckboxes.forEach(function(checkbox) {
            checkbox.addEventListener('change', function() {
                updateJustQueryIds();
                const groupIndex = this.dataset.groupIndex;
                const group = document.querySelector(`.conversation-group:nth-child(${parseInt(groupIndex) + 1})`);
                const conversationUnits = group.querySelectorAll('.conversation-unit:not(.last)'); // Exclude last unit
                const expandButton = group.querySelector('.expand-button');
                const collapseButton = group.querySelector('.collapse-button');

                // Only affect non-last units
                conversationUnits.forEach(function(unit) {
                    if(checkbox.checked) {
                        unit.classList.add('selected');
                    } else {
                        unit.classList.remove('selected');
                    }
                });

                if(checkbox.checked) {
                    expandButton.style.display = 'inline-block';
                    collapseButton.style.display = 'none';
                    
                    // Reset non-last units to collapsed state
                    const collapsedContainer = group.querySelector('.collapsed-units');
                    const allNonLastUnits = group.querySelectorAll('.conversation-unit:not(.last)');
                    
                    allNonLastUnits.forEach(unit => {
                        unit.classList.add('collapsed');
                        unit.style.display = 'none';
                        collapsedContainer.appendChild(unit);
                    });

                    const expandedContainer = group.querySelector('.expanded-units');
                    if(expandedContainer) expandedContainer.remove();
                } else {
                    expandButton.style.display = 'none';
                    collapseButton.style.display = 'none';
                    
                    // Collapse all non-last units
                    const allNonLastUnits = group.querySelectorAll('.conversation-unit:not(.last)');
                    const collapsedContainer = group.querySelector('.collapsed-units');
                    
                    allNonLastUnits.forEach(unit => {
                        unit.classList.add('collapsed');
                        unit.style.display = 'none';
                        collapsedContainer.appendChild(unit);
                    });
                    
                    const expandedContainer = group.querySelector('.expanded-units');
                    if(expandedContainer) expandedContainer.remove();
                }
            });
        });

        // Initial update on page load
        updateJustQueryIds();
    };

    window.expandAllButtonEventListener = function () {
        // Handle Expand All button click
        const expandButtons = document.querySelectorAll('.expand-button');
        expandButtons.forEach(function (button) {
            button.addEventListener('click', function (event) {
                event.preventDefault();
                console.log("Expand All clicked");
                const groupIndex = this.dataset.groupIndex;
                const group = document.querySelector(`.conversation-group:nth-child(${parseInt(groupIndex) + 1})`);
                const stickyControls = group.querySelector('.sticky-controls');
                const collapsedUnits = group.querySelectorAll('.conversation-unit.collapsed');

                // Create a container for expanded units
                const expandedUnitsContainer = document.createElement('div');
                expandedUnitsContainer.className = 'expanded-units';

                // Move all collapsed units to the expanded container
                collapsedUnits.forEach(function (unit) {
                    expandedUnitsContainer.appendChild(unit);
                    unit.style.display = 'flex';
                    unit.classList.remove('collapsed');
                });

                // Insert the expanded units container after the sticky controls
                stickyControls.insertAdjacentElement('afterend', expandedUnitsContainer);

                // Toggle visibility of buttons
                this.style.display = 'none'; // Hide Expand All button
                const collapseButton = group.querySelector('.collapse-button');
                collapseButton.style.display = 'inline-block'; // Show Collapse All button
            });
        });
    };

    window.collapseAllButtonEventListener = function () {
        // Handle Collapse All button click
        const collapseButtons = document.querySelectorAll('.collapse-button');
        collapseButtons.forEach(function (button) {
            button.addEventListener('click', function (event) {
                event.preventDefault();
                console.log("Collapse All clicked");
                const groupIndex = this.dataset.groupIndex;
                const group = document.querySelector(`.conversation-group:nth-child(${parseInt(groupIndex) + 1})`);

                // Get the expanded container and move units back to their original container
                const expandedUnitsContainer = group.querySelector('.expanded-units');
                if (expandedUnitsContainer) {
                    const collapsedUnitsContainer = group.querySelector('.collapsed-units');
                    const unitsToCollapse = expandedUnitsContainer.querySelectorAll('.conversation-unit');

                    unitsToCollapse.forEach(function (unit) {
                        unit.style.display = 'none';
                        unit.classList.add('collapsed');
                        collapsedUnitsContainer.appendChild(unit);
                    });

                    expandedUnitsContainer.remove(); // Remove the expanded container
                }

                // Toggle visibility of buttons
                this.style.display = 'none'; // Hide Collapse All button
                const expandButton = group.querySelector('.expand-button');
                expandButton.style.display = 'inline-block'; // Show Expand All button
            });
        });
    };

    window.selectCheckBoxesEventListener();
    window.expandAllButtonEventListener();
    window.collapseAllButtonEventListener();
});
