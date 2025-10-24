document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Clear activity select so repeated fetches don't duplicate options
      activitySelect.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
  const activityCard = document.createElement("div");
  activityCard.className = "activity-card";
  // mark the card with the activity name for easy lookup
  activityCard.dataset.activity = name;

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p class="availability"><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activitiesList.appendChild(activityCard);

        // Participants section (bulleted list)
        const participantsDiv = document.createElement("div");
        participantsDiv.className = "participants";

        const participantsHeader = document.createElement("h5");
        const participants = details.participants || [];
        participantsHeader.textContent = `Participants (${participants.length})`;
        participantsDiv.appendChild(participantsHeader);

        const ul = document.createElement("ul");
        ul.className = "participants-list";

        if (participants.length === 0) {
          const li = document.createElement("li");
          li.className = "participant-empty";
          li.textContent = "No participants yet";
          ul.appendChild(li);
        } else {
          participants.forEach((email) => {
            const li = document.createElement("li");
            li.className = "participant-item";

            const avatar = document.createElement("span");
            avatar.className = "participant-avatar";
            // Create simple initials from email local part
            const local = email.split("@")[0] || "";
            const initials = local
              .split(/[\.\-_]/)
              .map((s) => s[0])
              .filter(Boolean)
              .slice(0, 2)
              .join("")
              .toUpperCase();
            avatar.textContent = initials || "U";

            const emailSpan = document.createElement("span");
            emailSpan.className = "participant-email";
            emailSpan.textContent = email;

            // Remove/unregister button
            const removeBtn = document.createElement("button");
            removeBtn.className = "participant-remove";
            removeBtn.title = "Unregister";
            removeBtn.setAttribute("aria-label", `Unregister ${email}`);
            removeBtn.innerHTML = "✖";

            // Click handler to call DELETE endpoint
            removeBtn.addEventListener("click", async (ev) => {
              ev.stopPropagation();
              removeBtn.disabled = true;
              try {
                const delResp = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(email)}`,
                  { method: "DELETE" }
                );
                const delResult = await delResp.json();

                if (delResp.ok) {
                  // Remove from DOM
                  li.remove();

                  // Update the local details.participants array so counts stay in sync
                  details.participants = (details.participants || []).filter((p) => p !== email);

                  // Update participants header count
                  const participantsHeader = participantsDiv.querySelector("h5");
                  const count = details.participants.length;
                  participantsHeader.textContent = `Participants (${count})`;

                  // Update availability text
                  const availabilityP = activityCard.querySelector(".availability");
                  const spotsLeftUpdated = details.max_participants - details.participants.length;
                  if (availabilityP) {
                    availabilityP.innerHTML = `<strong>Availability:</strong> ${spotsLeftUpdated} spots left`;
                  }

                  // If no participants remain, show empty text
                  const remaining = participantsDiv.querySelectorAll(".participant-item").length;
                  if (remaining === 0) {
                    ul.innerHTML = "";
                    const emptyLi = document.createElement("li");
                    emptyLi.className = "participant-empty";
                    emptyLi.textContent = "No participants yet";
                    ul.appendChild(emptyLi);
                  }

                  // show global message
                  messageDiv.textContent = delResult.message || "Unregistered";
                  messageDiv.className = "success";
                  messageDiv.classList.remove("hidden");
                  setTimeout(() => messageDiv.classList.add("hidden"), 4000);
                } else {
                  messageDiv.textContent = delResult.detail || "Failed to unregister";
                  messageDiv.className = "error";
                  messageDiv.classList.remove("hidden");
                }
              } catch (err) {
                console.error("Error unregistering:", err);
                messageDiv.textContent = "Failed to unregister. Please try again.";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
              } finally {
                removeBtn.disabled = false;
              }
            });

            li.appendChild(avatar);
            li.appendChild(emailSpan);
            li.appendChild(removeBtn);
            ul.appendChild(li);
          });
        }

        participantsDiv.appendChild(ul);
        activityCard.appendChild(participantsDiv);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh UI to show the new participant without requiring a full page reload
        // re-fetch activities and re-render cards and select
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
