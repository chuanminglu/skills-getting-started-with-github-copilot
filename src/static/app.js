document.addEventListener('DOMContentLoaded', function() {
  const activitiesList = document.getElementById('activities-list');
  const activitySelect = document.getElementById('activity');
  const signupForm = document.getElementById('signup-form');
  const messageDiv = document.getElementById('message');
  
  // Fetch activities from API
  fetch('/activities')
    .then(response => response.json())
    .then(activities => {
      displayActivities(activities);
      populateActivitySelect(activities);
    })
    .catch(error => {
      console.error('Error fetching activities:', error);
      activitiesList.innerHTML = '<p class="error">Failed to load activities. Please try again later.</p>';
    });
  
  // Function to display activities with participants
  function displayActivities(activities) {
    activitiesList.innerHTML = '';
    
    if (Object.keys(activities).length === 0) {
      activitiesList.innerHTML = '<p>No activities available at this time.</p>';
      return;
    }
    
    for (const [name, details] of Object.entries(activities)) {
      const card = document.createElement('div');
      card.className = 'activity-card';
      
      const participantsHTML = details.participants.length > 0 
        ? `
          <div class="participants">
            <h5>Current Participants:</h5>
            <ul>
              ${details.participants.map(email => 
                `<li>
                  ${email}
                  <span class="delete-icon" data-activity="${name}" data-email="${email}">✖</span>
                </li>`
              ).join('')}
            </ul>
          </div>
        ` 
        : '<p class="no-participants">No participants yet. Be the first to join!</p>';
      
      card.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${details.participants.length}/${details.max_participants} spots filled</p>
        ${participantsHTML}
      `;
      
      activitiesList.appendChild(card);
    }
    
    // Add event listeners to delete icons
    document.querySelectorAll('.delete-icon').forEach(icon => {
      icon.addEventListener('click', handleUnregister);
    });
  }
  
  // Function to handle unregister
  function handleUnregister(e) {
    const activityName = e.target.dataset.activity;
    const email = e.target.dataset.email;
    
    if (confirm(`Are you sure you want to remove ${email} from ${activityName}?`)) {
      // Send unregister request
      fetch(`/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`, {
        method: 'DELETE'
      })
        .then(response => {
          if (!response.ok) {
            return response.json().then(data => {
              throw new Error(data.detail || 'Failed to unregister');
            });
          }
          return response.json();
        })
        .then(data => {
          showMessage(data.message, 'success');
          // Refresh activities to show updated participants
          return fetch('/activities');
        })
        .then(response => response.json())
        .then(activities => {
          displayActivities(activities);
        })
        .catch(error => {
          showMessage(error.message, 'error');
        });
    }
  }
  
  // Function to populate the activity select dropdown
  function populateActivitySelect(activities) {
    // Keep the default option
    const defaultOption = activitySelect.querySelector('option');
    activitySelect.innerHTML = '';
    activitySelect.appendChild(defaultOption);
    
    for (const name of Object.keys(activities)) {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    }
  }
  
  // Handle form submission
  signupForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const activity = activitySelect.value;
    
    if (!email || !activity) {
      showMessage('Please fill out all fields', 'error');
      return;
    }
    
    // Send signup request
    fetch(`/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`, {
      method: 'POST'
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.detail || 'Failed to sign up');
          });
        }
        return response.json();
      })
      .then(data => {
        showMessage(data.message, 'success');
        // Refresh activities to show updated participants
        fetch('/activities')
          .then(response => response.json())
          .then(activities => {
            displayActivities(activities);
          });
      })
      .catch(error => {
        showMessage(error.message, 'error');
      });
  });
  
  // Function to show messages
  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    
    // Hide the message after 5 seconds
    setTimeout(() => {
      messageDiv.className = 'message hidden';
    }, 5000);
  }
});
