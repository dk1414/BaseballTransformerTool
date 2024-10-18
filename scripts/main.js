

$(document).ready(function() {
    // Base API URL
    const apiUrl = 'https://baseball-model-api-41381551043.us-central1.run.app'; 
  
    // Variables to store data
    let batters = [];
    let pitchers = [];
    let pitchTypes = [];
    let pitchSequence = [];
    let selectedZone;
    let eventsChart;
    let hitLocationChart;
  
    // Define a color mapping for event categories
    const eventColorMap = {
      'B': '#3498db',            // Blue for Ball
      'S': '#e74c3c',            // Red for Strike
      'double': '#f23f19',       // Orange for Double
      'single': '#6af219',       // Lime for Single
      'field_out': '#194ff2',    // Dark Blue for Field Out
      'hit_by_pitch': '#8819f2', // Purple for Hit by Pitch
      'home_run': '#19f2ce',     // Teal for Home Run
      'strikeout': '#eef611',    // Yellow for Strikeout
      'triple': '#f611cb',       // Pink for Triple
      'walk': '#11f685'          // Mint for Walk
      // Add more event types and their corresponding colors as needed
    };

    // Define a name mapping for event categories
    const eventNameMap = {
      'B': 'Ball',
      'S': 'Strike',
      'double': 'Double',
      'single': 'Single',
      'field_out': 'Field Out',
      'hit_by_pitch': 'Hit by Pitch',
      'home_run': 'Home Run',
      'strikeout': 'Strikeout',
      'triple': 'Triple',
      'walk': 'Walk'
      // Add more event types and their corresponding display names as needed
    };

    // Define a mapping for pitch types
    const pitchTypeMap = {
      'CH': 'Changeup',
      'CU': 'Curveball',
      'FC': 'Cutter',
      'EP': 'Eephus',
      'FO': 'Forkball',
      'FF': 'Four-Seam Fastball',
      'KN': 'Knuckleball',
      'KC': 'Knuckle-curve',
      'SC': 'Screwball',
      'SI': 'Sinker',
      'SL': 'Slider',
      'SV': 'Slurve',
      'FS': 'Splitter',
      'ST': 'Sweeper'
    };
  
    // Initialize the application
    init();
  
    function init() {
      callHealthEndpoint(); // Call /health to keep the container awake
      loadPlayersFromJSON(); // Load players from players.json
      setupEventListeners();
  
      // Initialize Select2 for searchable dropdowns
      $('.searchable').select2({
        placeholder: 'Select an option',
        allowClear: true,
        width: '100%'
      });
    }
  
    // Call the /health endpoint to wake up container
    function callHealthEndpoint() {
      $.ajax({
        url: `${apiUrl}/health`,
        method: 'GET',
        success: function(response) {
          console.log('Health check successful:', response);
        },
        error: function(jqXHR, textStatus, errorThrown) {
          console.warn('Health check failed:', textStatus, errorThrown);
          // Optionally, implement retry logic or notify the user
        }
      });
    }
  
    // Load players from players.json
    function loadPlayersFromJSON() {
      $.getJSON('players.json') // Ensure the path is correct
        .done(function(data) {
          batters = data.batters;
          pitchers = data.pitchers;
          populatePlayerSelects();
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          console.error('Error loading players from JSON:', textStatus, errorThrown);
          alert('Failed to load player data. Please try again later.');
        });
    }
  
    // Populate the batter and pitcher dropdowns
    function populatePlayerSelects() {
      const batterSelect = $('#batter-select');
      const pitcherSelect = $('#pitcher-select');
  
      batterSelect.empty();
      pitcherSelect.empty();
  
      batterSelect.append('<option value=""></option>'); // For Select2 placeholder
      pitcherSelect.append('<option value=""></option>'); // For Select2 placeholder
  
      batters.forEach(function(batter) {
        batterSelect.append(`<option value="${batter}">${batter}</option>`);
      });
  
      pitchers.forEach(function(pitcher) {
        pitcherSelect.append(`<option value="${pitcher}">${pitcher}</option>`);
      });
    }
  
    // Set up event listeners
    function setupEventListeners() {
      // When pitcher is selected, fetch pitch types
      $('#pitcher-select').on('change', function() {
        const pitcherName = $(this).val();
        if (pitcherName) {
          fetchPitchTypes(pitcherName);
        } else {
          $('#pitch-type-select').empty().append('<option value="">Select a pitcher first</option>');
        }
      });
  
      // Add pitch button
      $('#add-pitch-button').on('click', function() {
        addPitchToSequence();
      });
  
      // Predict button
      $('#predict-button').on('click', function() {
        makePrediction();
      });
  
      // Reset sequence button
      $('#reset-sequence-button').on('click', function() {
        resetSequence();
      });
  
      // Disable the add pitch button initially
      $('#add-pitch-button').prop('disabled', true);
      $('#predict-button').prop('disabled', true);
  
      // Enable add pitch button when all fields are filled
      $('select').on('change', function() {
        validateForm();
      });
  
      // Create the strike zone
      createStrikeZone();
  
      // Event select options
      populateEventSelect();
      populateCountSelects();
    }
  
    // Fetch pitch types for the selected pitcher
    function fetchPitchTypes(pitcherName) {
      $.getJSON(`${apiUrl}/get_pitch_types`, { pitcher_name: pitcherName })
        .done(function(data) {
          pitchTypes = data.pitch_types;
          populatePitchTypeSelect();
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
          console.error('Error fetching pitch types:', textStatus, errorThrown);
          alert('Failed to load pitch types. Please try again later.');
        });
    }
  
    // Populate pitch type select with full names
    function populatePitchTypeSelect() {
      const pitchTypeSelect = $('#pitch-type-select');
      pitchTypeSelect.empty();
      pitchTypeSelect.append('<option value=""></option>'); // For Select2 placeholder
  
      pitchTypes.forEach(function(pitchTypeCode) {
        const pitchTypeName = pitchTypeMap[pitchTypeCode] || pitchTypeCode;
        pitchTypeSelect.append(`<option value="${pitchTypeCode}">${pitchTypeName}</option>`);
      });
    }
  
    // Populate event select without Select2
    function populateEventSelect() {
      const eventSelect = $('#event-select');
      const events = Object.keys(eventNameMap); // Use keys from eventNameMap
      eventSelect.empty();
      eventSelect.append('<option value=""></option>'); // For Select2 placeholder
  
      events.forEach(function(event) {
        eventSelect.append(`<option value="events_${event}">${eventNameMap[event] || event}</option>`);
      });
    }
  
    // Populate balls, strikes, and outs selects without Select2
    function populateCountSelects() {
      const ballsSelect = $('#balls-select');
      const strikesSelect = $('#strikes-select');
      const outsSelect = $('#outs-select');
  
      ballsSelect.empty();
      strikesSelect.empty();
      outsSelect.empty();
  
      ballsSelect.append('<option value=""></option>'); // For Select2 placeholder
      strikesSelect.append('<option value=""></option>'); // For Select2 placeholder
      outsSelect.append('<option value=""></option>'); // For Select2 placeholder
  
      for (let i = 0; i <= 3; i++) {
        ballsSelect.append(`<option value="${i}">${i}</option>`);
      }
  
      for (let i = 0; i <= 2; i++) {
        strikesSelect.append(`<option value="${i}">${i}</option>`);
        outsSelect.append(`<option value="${i}">${i}</option>`);
      }
    }
  
    // Create the strike zone grid and corner zones
    function createStrikeZone() {
      const strikeZoneContainer = $('#strike-zone-container');
      strikeZoneContainer.empty(); // Clear any existing content
  
      // Create the grid for zones 1-9 (labels start from top-left)
      const grid = $('<div class="strike-zone-grid"></div>');
      const zoneNumbers = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
      ];
  
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const zoneNumber = zoneNumbers[row][col];
          const cell = $(`<div class="zone" data-zone="${zoneNumber}" id="zone-${zoneNumber}">${zoneNumber}</div>`);
          grid.append(cell);
        }
      }
      strikeZoneContainer.append(grid);
  
      // Add zones 11-14 as corner zones
      const zone11 = $('<div class="zone-corner" data-zone="11" id="zone-11">11</div>');
      const zone12 = $('<div class="zone-corner" data-zone="12" id="zone-12">12</div>');
      const zone13 = $('<div class="zone-corner" data-zone="13" id="zone-13">13</div>');
      const zone14 = $('<div class="zone-corner" data-zone="14" id="zone-14">14</div>');
  
      // Append corner zones to the container
      strikeZoneContainer.append(zone11, zone12, zone13, zone14);
  
      // Add click event listener to all zones using event delegation
      $('#strike-zone-container').on('click', '.zone, .zone-corner', function() {
        $('.zone, .zone-corner').removeClass('selected');
        $(this).addClass('selected');
        selectedZone = $(this).data('zone');
        $('#selected-zone-display').text(`Selected Zone: ${selectedZone}`);
        validateForm();
      });
  
      // Enable keyboard navigation for zones
      $('#strike-zone-container').on('keypress', '.zone, .zone-corner', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          $(this).click();
        }
      });
    }
  
    // Validate the form to enable or disable the add pitch button
    function validateForm() {
      const batterName = $('#batter-select').val();
      const pitcherName = $('#pitcher-select').val();
      const pitchType = $('#pitch-type-select').val();
      const eventType = $('#event-select').val();
      const balls = $('#balls-select').val();
      const strikes = $('#strikes-select').val();
      const outs = $('#outs-select').val();
  
      if (
        batterName &&
        pitcherName &&
        pitchType &&
        eventType &&
        balls !== '' &&
        strikes !== '' &&
        outs !== '' &&
        selectedZone !== undefined
      ) {
        $('#add-pitch-button').prop('disabled', false);
      } else {
        $('#add-pitch-button').prop('disabled', true);
      }
  
      // Enable predict button if there is at least one pitch
      if (pitchSequence.length >= 1) {
        $('#predict-button').prop('disabled', false);
      } else {
        $('#predict-button').prop('disabled', true);
      }
    }
  
    // Add pitch to the sequence
    function addPitchToSequence() {
      if (pitchSequence.length >= 8) {
        alert('You have reached the maximum number of pitches.');
        return;
      }
  
      const batterName = $('#batter-select').val();
      const pitcherName = $('#pitcher-select').val();
      const pitchTypeCode = $('#pitch-type-select').val(); // Changed variable name for clarity
      const eventType = $('#event-select').val();
      const balls = $('#balls-select').val();
      const strikes = $('#strikes-select').val();
      const outs = $('#outs-select').val();
      const zone = selectedZone;
  
      // Validate inputs
      if (!batterName || !pitcherName || !pitchTypeCode || !eventType || zone === undefined) {
        alert('Please complete all fields and selections.');
        return;
      }
  
      // Create pitch info object
      const pitchInfo = {
        batter_name: batterName,
        pitcher_name: pitcherName,
        pitch_type: `pitch_type_${pitchTypeCode}`, // Format pitch_type as required by API
        zone: parseInt(zone),
        event: eventType,
        balls: parseInt(balls),
        strikes: parseInt(strikes),
        outs: parseInt(outs),
        hit_location: 0 // Default hit location to 0 as per updated instructions
      };
  
      // Add pitch to sequence
      pitchSequence.push(pitchInfo);
      updatePitchList();
  
      // Reset form fields
      $('#pitch-type-select').val('').trigger('change'); // Reset and trigger change for Select2
      $('#event-select').val('').trigger('change');
      $('#balls-select').val('').trigger('change');
      $('#strikes-select').val('').trigger('change');
      $('#outs-select').val('').trigger('change');
      $('.zone, .zone-corner').removeClass('selected');
      selectedZone = undefined;
      $('#selected-zone-display').text('Selected Zone: None');
      validateForm();
    }
  
    // Update the list of added pitches
    function updatePitchList() {
      const pitchList = $('#pitch-list');
      pitchList.empty();
  
      if (pitchSequence.length === 0) {
        pitchList.append('<p>No pitches added yet.</p>');
        return;
      }
  
      const list = $('<ul></ul>');
      pitchSequence.forEach(function(pitch, index) {
        const eventKey = pitch.event.replace('events_', '');
        const displayEvent = eventNameMap[eventKey] || eventKey;
  
        // Map pitch type code to full name
        const pitchTypeFullName = pitchTypeMap[pitch.pitch_type.replace('pitch_type_', '')] || pitch.pitch_type;
  
        const listItem = $(`
          <li>
            <strong>Pitch ${index + 1}:</strong> ${pitchTypeFullName}, ${displayEvent}, Balls: ${pitch.balls}, Strikes: ${pitch.strikes}, Outs: ${pitch.outs}
          </li>`);
        list.append(listItem);
      });
  
      pitchList.append(list);
    }
  
    // Make prediction by sending data to the API
    function makePrediction() {
      const requestData = {
        pitch_info: pitchSequence
      };
  
      // Show loading spinners
      $('#events-loading').show();
      $('#hitmap-loading').show();
  
      // Hide existing charts and images
      $('#events-chart').hide();
      $('#hit-location-chart-container').find('img').hide();
      $('#hit-location-placeholder').hide();
  
      $.ajax({
        url: `${apiUrl}/predict`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(requestData),
        success: function(response) {
          displayPrediction(response.prediction);
        },
        error: function(jqXHR, textStatus, errorThrown) {
          console.error('Error making prediction:', textStatus, errorThrown);
          alert('Failed to make prediction. Please try again later.');
  
          // Hide loading spinners
          $('#events-loading').hide();
          $('#hitmap-loading').hide();
  
          // Show placeholders
          $('#events-chart').show();
          $('#hit-location-chart-container').find('img').hide();
          $('#hit-location-placeholder').show();
        }
      });
    }
  
    function displayPrediction(prediction) {
      // Extract data from prediction
      const columns = prediction.columns;
      const data = prediction.data;
    
      // Find indices for events and hit locations
      const eventColumns = columns.filter(col => col.startsWith('events_'));
      const hitLocationColumns = columns.filter(col => col.startsWith('hit_location_'));
    
      const eventData = [];
      const eventLabels = [];
    
      eventColumns.forEach(function(col) {
        eventLabels.push(col); // Keep the 'events_' prefix for consistent mapping
        eventData.push(data[columns.indexOf(col)]);
      });
    
      // Create charts
      createEventsChart(eventLabels, eventData);
    
      // Display the heatmap image
      if (prediction.heatmap) {
        const heatmapImage = new Image();
        heatmapImage.src = 'data:image/png;base64,' + prediction.heatmap;
        heatmapImage.alt = 'Hit Location Heatmap';
        heatmapImage.style.width = '100%'; // Adjust as needed
    
        // Clear existing content and append the heatmap image
        $('#hit-location-chart-container').empty();
        $('#hit-location-chart-container').append('<h5>Hit Location Probability Heatmap</h5>');
        $('#hit-location-chart-container').append(heatmapImage);
      } else {
        $('#hit-location-chart-container').text('No heatmap available.');
      }
    
      // Hide loading spinners and show charts
      $('#events-loading').hide();
      $('#hitmap-loading').hide();
      $('#events-chart').show();
      $('#hit-location-chart-container').find('img').show();
    }
  
    // Create events pie chart with consistent colors and readable labels
    function createEventsChart(labels, data) {
      const ctx = document.getElementById('events-chart').getContext('2d');
      
      // Destroy existing chart if it exists to avoid duplication
      if (eventsChart) {
        eventsChart.destroy();
      }
  
      // Assign colors based on the eventColorMap
      const backgroundColors = labels.map(label => {
        // Extract the event key by removing 'events_' prefix if present
        const eventKey = label.startsWith('events_') ? label.replace('events_', '') : label;
        return eventColorMap[eventKey] || '#95a5a6'; // Default color if not mapped
      });
  
      // Assign readable labels based on the eventNameMap
      const readableLabels = labels.map(label => {
        const eventKey = label.startsWith('events_') ? label.replace('events_', '') : label;
        return eventNameMap[eventKey] || eventKey; // Default to eventKey if not mapped
      });
  
      eventsChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: readableLabels, // Use readable labels
          datasets: [{
            data: data,
            backgroundColor: backgroundColors
          }]
        },
        options: {
          plugins: {
            title: {
              display: true,
              text: 'Event Probabilities',
              font: {
                size: 18
              },
              padding: {
                bottom: 20
              }
            },
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 20,
                padding: 15
              }
            }
          }
        }
      });
    }
  
    // Reset the pitch sequence and predictions
    function resetSequence() {
      pitchSequence = [];
      updatePitchList();
      resetPredictions();
      validateForm();
    }
  
    // Reset predictions
    function resetPredictions() {
      // Clear the events chart
      if (eventsChart) {
        eventsChart.destroy();
      }
      $('#events-chart').remove(); // Remove the existing canvas
      $('#events-chart-container').append('<canvas id="events-chart"></canvas>');
  
      // Clear the hit location chart
      $('#hit-location-chart-container').empty().append('<p id="hit-location-placeholder">No heatmap available.</p>');
  
      // Hide loading spinners if visible
      $('#events-loading').hide();
      $('#hitmap-loading').hide();
    }
  
});



     




