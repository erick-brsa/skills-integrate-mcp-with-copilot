document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  const authStatus = document.getElementById("auth-status");
  const logoutButton = document.getElementById("logout-button");
  const authMessage = document.getElementById("auth-message");
  const signinTab = document.getElementById("signin-tab");
  const signupTab = document.getElementById("signup-tab");
  const signinForm = document.getElementById("signin-form");
  const signupAuthForm = document.getElementById("signup-form-auth");
  const signinRole = document.getElementById("signin-role");
  const signupRole = document.getElementById("signup-role");
  const signinClubGroup = document.getElementById("signin-club-group");
  const signupClubGroup = document.getElementById("signup-club-group");
  const signinClubSelect = document.getElementById("signin-club");
  const signupClubSelect = document.getElementById("signup-club");
  const signinEmail = document.getElementById("signin-email");
  const signupEmail = document.getElementById("signup-email");
  const activityEmailInput = document.getElementById("email");

  const usersStorageKey = "mergington-users";
  const sessionStorageKey = "mergington-session";

  const memoryStorage = {
    users: null,
    session: null,
  };

  const defaultUsers = [
    {
      name: "Avery Student",
      email: "student@mergington.edu",
      password: "student123",
      role: "student",
      club: "",
    },
    {
      name: "Jordan Club Head",
      email: "clubhead@mergington.edu",
      password: "club123",
      role: "club_head",
      club: "Programming Class",
    },
  ];

  let availableClubs = [];
  let currentSession = loadSession();
  let users = loadUsers();

  function readStorageItem(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.warn("Falling back to in-memory auth state:", error);

      if (key === usersStorageKey && memoryStorage.users !== null) {
        return memoryStorage.users;
      }

      if (key === sessionStorageKey && memoryStorage.session !== null) {
        return memoryStorage.session;
      }

      return null;
    }
  }

  function writeStorageItem(key, value) {
    try {
      window.localStorage.setItem(key, value);
      return;
    } catch (error) {
      console.warn("Persisting auth state in memory only:", error);

      if (key === usersStorageKey) {
        memoryStorage.users = value;
      }

      if (key === sessionStorageKey) {
        memoryStorage.session = value;
      }
    }
  }

  function removeStorageItem(key) {
    try {
      window.localStorage.removeItem(key);
      return;
    } catch (error) {
      console.warn("Clearing in-memory auth state:", error);

      if (key === sessionStorageKey) {
        memoryStorage.session = null;
      }
    }
  }

  function loadUsers() {
    const storedUsers = readStorageItem(usersStorageKey);

    if (!storedUsers) {
      writeStorageItem(usersStorageKey, JSON.stringify(defaultUsers));
      return [...defaultUsers];
    }

    try {
      const parsedUsers = JSON.parse(storedUsers);
      return Array.isArray(parsedUsers) && parsedUsers.length > 0
        ? parsedUsers
        : [...defaultUsers];
    } catch (error) {
      console.error("Error reading stored users:", error);
      return [...defaultUsers];
    }
  }

  function loadSession() {
    const storedSession = readStorageItem(sessionStorageKey);

    if (!storedSession) {
      return null;
    }

    try {
      return JSON.parse(storedSession);
    } catch (error) {
      console.error("Error reading stored session:", error);
      return null;
    }
  }

  function saveUsers() {
    writeStorageItem(usersStorageKey, JSON.stringify(users));
  }

  function saveSession(session) {
    currentSession = session;

    if (session) {
      writeStorageItem(sessionStorageKey, JSON.stringify(session));
    } else {
      removeStorageItem(sessionStorageKey);
    }

    renderAuthState();
  }

  function getRoleLabel(role) {
    return role === "club_head" ? "Club head" : "Student";
  }

  function showAuthMessage(text, className) {
    authMessage.textContent = text;
    authMessage.className = className;
    authMessage.classList.remove("hidden");
  }

  function hideAuthMessage() {
    authMessage.classList.add("hidden");
  }

  function setActiveAuthTab(mode) {
    const isSignIn = mode === "signin";

    signinTab.classList.toggle("active", isSignIn);
    signupTab.classList.toggle("active", !isSignIn);
    signinForm.classList.toggle("hidden", !isSignIn);
    signupAuthForm.classList.toggle("hidden", isSignIn);
    hideAuthMessage();
  }

  function syncClubField(roleSelect, clubGroup, clubSelect) {
    const needsClub = roleSelect.value === "club_head";

    clubGroup.classList.toggle("hidden", !needsClub);
    clubSelect.required = needsClub;

    if (!needsClub) {
      clubSelect.value = "";
    }
  }

  function populateClubOptions() {
    const clubOptions = availableClubs.length > 0 ? availableClubs : ["Loading clubs..."];
    const clubSelects = [signinClubSelect, signupClubSelect];

    clubSelects.forEach((select) => {
      select.innerHTML = "";

      clubOptions.forEach((clubName) => {
        const option = document.createElement("option");
        option.value = availableClubs.length > 0 ? clubName : "";
        option.textContent = clubName;
        select.appendChild(option);
      });
    });
  }

  function renderAuthState() {
    if (currentSession) {
      const clubLabel = currentSession.club ? `, ${currentSession.club}` : "";
      authStatus.textContent = `${currentSession.name} · ${getRoleLabel(currentSession.role)}${clubLabel}`;
      logoutButton.classList.remove("hidden");

      if (activityEmailInput.value === "" || activityEmailInput.value === currentSession.email) {
        activityEmailInput.value = currentSession.email;
      }
      return;
    }

    authStatus.textContent = "Not signed in";
    logoutButton.classList.add("hidden");

    if (activityEmailInput.value === currentSession?.email) {
      activityEmailInput.value = "";
    }
  }

  function upsertUser(newUser) {
    users = users.filter((user) => user.email !== newUser.email);
    users.push(newUser);
    saveUsers();
  }

  function clearAuthForm(mode) {
    const isSignIn = mode === "signin";
    const nameField = isSignIn ? null : document.getElementById("signup-name");
    const emailField = isSignIn ? signinEmail : signupEmail;
    const passwordField = document.getElementById(isSignIn ? "signin-password" : "signup-password");
    const roleField = isSignIn ? signinRole : signupRole;
    const clubField = isSignIn ? signinClubSelect : signupClubSelect;

    if (nameField) {
      nameField.value = "";
    }

    emailField.value = "";
    passwordField.value = "";
    roleField.value = "student";
    clubField.value = "";

    syncClubField(roleField, isSignIn ? signinClubGroup : signupClubGroup, clubField);
  }

  function validateClubChoice(role, club) {
    if (role !== "club_head") {
      return null;
    }

    if (!club) {
      return "Club heads need to choose a club.";
    }

    if (availableClubs.length > 0 && !availableClubs.includes(club)) {
      return "Please choose a valid club.";
    }

    return null;
  }

  function handleAuthSubmit(mode, event) {
    event.preventDefault();

    const role = mode === "signin" ? signinRole.value : signupRole.value;
    const club = mode === "signin" ? signinClubSelect.value : signupClubSelect.value;
    const email = (mode === "signin" ? signinEmail.value : signupEmail.value).trim().toLowerCase();
    const password = document.getElementById(mode === "signin" ? "signin-password" : "signup-password").value;

    if (!email || !password) {
      showAuthMessage("Email and password are required.", "error");
      return;
    }

    const clubError = validateClubChoice(role, club);
    if (clubError) {
      showAuthMessage(clubError, "error");
      return;
    }

    if (mode === "signup") {
      const name = document.getElementById("signup-name").value.trim();

      if (!name) {
        showAuthMessage("Name is required.", "error");
        return;
      }

      const existingUser = users.find((user) => user.email === email);
      if (existingUser) {
        showAuthMessage("An account with that email already exists.", "error");
        return;
      }

      const newUser = {
        name,
        email,
        password,
        role,
        club: role === "club_head" ? club : "",
      };

      upsertUser(newUser);
      saveSession(newUser);
      showAuthMessage(`Account created and signed in as ${name}.`, "success");
      clearAuthForm("signup");
      syncClubField(signupRole, signupClubGroup, signupClubSelect);
      signinEmail.value = email;
      signinRole.value = role;
      syncClubField(signinRole, signinClubGroup, signinClubSelect);
      return;
    }

    const user = users.find(
      (candidate) =>
        candidate.email === email &&
        candidate.password === password &&
        candidate.role === role &&
        (role !== "club_head" || candidate.club === club)
    );

    if (!user) {
      showAuthMessage("We could not verify that account. Check your email, password, role, and club.", "error");
      return;
    }

    saveSession(user);
    showAuthMessage(`Signed in as ${user.name}.`, "success");
    clearAuthForm("signin");
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      availableClubs = Object.keys(activities).sort((left, right) => left.localeCompare(right));
      populateClubOptions();

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });

      renderAuthState();
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = activityEmailInput.value.trim();
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

        if (currentSession) {
          activityEmailInput.value = currentSession.email;
        }

        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

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

  signinTab.addEventListener("click", () => setActiveAuthTab("signin"));
  signupTab.addEventListener("click", () => setActiveAuthTab("signup"));

  signinRole.addEventListener("change", () => syncClubField(signinRole, signinClubGroup, signinClubSelect));
  signupRole.addEventListener("change", () => syncClubField(signupRole, signupClubGroup, signupClubSelect));

  signinForm.addEventListener("submit", (event) => handleAuthSubmit("signin", event));
  signupAuthForm.addEventListener("submit", (event) => handleAuthSubmit("signup", event));

  logoutButton.addEventListener("click", () => {
    saveSession(null);
    activityEmailInput.value = "";
    showAuthMessage("You have been signed out.", "info");
  });

  setActiveAuthTab("signup");
  syncClubField(signinRole, signinClubGroup, signinClubSelect);
  syncClubField(signupRole, signupClubGroup, signupClubSelect);
  renderAuthState();
  fetchActivities();
});