// Import necessary functions from the Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import {
    getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, orderBy, serverTimestamp, Timestamp
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import {
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

// --- IMPORTANT: Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyC3vUnHweEw4cQUYb80zv2-_aP4uemRIdg",
    authDomain: "tasktracker-de513.firebaseapp.com",
    projectId: "tasktracker-de513",
    storageBucket: "tasktracker-de513.firebasestorage.app",
    messagingSenderId: "131785072610",
    appId: "1:131785072610:web:3ac50d06ca55a46238a3bb",
    measurementId: "G-46CKMG13F2"
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- DOM Element References (UPDATED FOR NEW HTML) ---
const headerNav = document.querySelector('header nav');
const goToSignupHeroBtn = document.getElementById('goToSignupHero');
const goToLoginHeroBtn = document.getElementById('goToLoginHero');
const goToLoginSignupLink = document.getElementById('goToLoginSignupLink');
const goToSignupLoginLink = document.getElementById('goToSignupLoginLink');

const signupSection = document.getElementById('signup');
const loginSection = document.getElementById('login');
const authSection = document.getElementById('authSection'); // May not be directly used now
const taskManagementSection = document.getElementById('taskManagementSection');

const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');
const signupEmailInput = document.getElementById('signupEmail');
const signupPasswordInput = document.getElementById('signupPassword');
const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');
const signupBtnLanding = document.getElementById('signupBtnLanding');
const loginBtnLanding = document.getElementById('loginBtnLanding');

const logoutBtn = document.getElementById('logoutBtn');
const signupMessage = document.getElementById('signup-message');
const loginMessage = document.getElementById('login-message');
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('taskInput');
const dueDateInput = document.getElementById('dueDate'); // ADD THIS LINE
const taskList = document.getElementById('taskList');
const taskMessage = document.getElementById('task-message');
const loadingIndicator = document.getElementById('loading-indicator');
const noTasksMessage = document.getElementById('no-tasks-message');
const userInfo = document.getElementById('user-info');
const userEmailSpan = document.getElementById('user-email');



let currentUserId = null; // Store the current user's ID

// --- Helper Functions ---
function showMessage(element, message, isError = false) {
    element.textContent = message;
    element.className = 'message ' + (isError ? 'error' : 'success');
    setTimeout(() => { element.textContent = ''; element.className = 'message'; }, 5000);
}

function clearMessage(element) {
    element.textContent = '';
    element.className = 'message';
}

function showLoading(show) {
    loadingIndicator.style.display = show ? 'block' : 'none';
}

function toggleAuthVisibility(showLogin = false) {
    signupSection.style.display = showLogin ? 'none' : 'block';
    loginSection.style.display = showLogin ? 'block' : 'none';
    window.location.hash = showLogin ? 'login' : 'signup';
}

function toggleTaskManagementSection(isLoggedIn) {
    if (isLoggedIn) {
        document.getElementById('landingPage').style.display = 'none';
        signupSection.style.display = 'none';
        loginSection.style.display = 'none';
        taskManagementSection.style.display = 'block';
        // userInfo.style.display = 'block'; // No longer using this ID
        const userInfoHeader = document.getElementById('user-info-header');
        if (userInfoHeader) {
            userInfoHeader.style.display = 'flex'; // Show user info in header
        }
        userEmailSpan.textContent = auth.currentUser.email;
        loadTasks();
        if (headerNav) {
            headerNav.style.display = 'none'; // Hide header nav on login
        }
    } else {
        document.getElementById('landingPage').style.display = 'block';
        signupSection.style.display = 'none';
        loginSection.style.display = 'none';
        taskManagementSection.style.display = 'none';
        // userInfo.style.display = 'none'; // No longer using this ID
        const userInfoHeader = document.getElementById('user-info-header');
        if (userInfoHeader) {
            userInfoHeader.style.display = 'none'; // Hide user info in header
        }
        userEmailSpan.textContent = '';
        taskList.innerHTML = '';
        currentUserId = null;
        clearMessage(signupMessage);
        clearMessage(loginMessage);
        clearMessage(taskMessage);
        if (headerNav) {
            headerNav.style.display = 'block'; // Show header nav on logout
        }
    }
}

// Also, ensure that the initial state on page load is set correctly:
document.addEventListener('DOMContentLoaded', () => {
    // ... other DOMContentLoaded code ...
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User logged in:", user.uid, user.email);
            currentUserId = user.uid;
            toggleTaskManagementSection(true); // Show task management
        } else {
            console.log("User logged out");
            currentUserId = null;
            toggleTaskManagementSection(false); // Show landing page
        }
    });
    // ... rest of DOMContentLoaded code ...
});
// --- Authentication Functions ---
async function handleSignUp(e) {
    e.preventDefault();
    clearMessage(signupMessage);
    const email = signupEmailInput.value;
    const password = signupPasswordInput.value;
    if (!email || !password) {
        showMessage(signupMessage, "Please enter email and password.", true);
        return;
    }
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        showMessage(signupMessage, "Sign up successful! You are now logged in.", false);
        signupForm.reset();
        // onAuthStateChanged will handle UI update
    } catch (error) {
        console.error("Sign up error:", error);
        showMessage(signupMessage, `Sign up failed: ${error.message}`, true);
    }
}

async function handleSignIn(e) {
    e.preventDefault();
    clearMessage(loginMessage);
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;
    if (!email || !password) {
        showMessage(loginMessage, "Please enter email and password.", true);
        return;
    }
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showMessage(loginMessage, "Login successful!", false);
        loginForm.reset();
        // onAuthStateChanged will handle UI update
    } catch (error) {
        console.error("Sign in error:", error);
        showMessage(loginMessage, `Login failed: ${error.message}`, true);
    }
}

async function handleSignOut() {
    try {
        await signOut(auth);
        console.log("User signed out");
        toggleTaskManagementSection(false); // Show landing page on logout
    } catch (error) {
        console.error("Sign out error:", error);
        showMessage(taskMessage, `Logout failed: ${error.message}`, true);
    }
}

// --- Task Functions ---
function getUserTasksCollectionRef() {
    if (!currentUserId) return null;
    return collection(db, "tasks", currentUserId, "userTasks");
}

async function handleAddTask(e) {
    e.preventDefault();
    clearMessage(taskMessage);
    const taskName = taskInput.value.trim();
    const dueDate = dueDateInput.value; // Get the value of the due date input

    if (taskName === "") {
        showMessage(taskMessage, "Task description cannot be empty!", true);
        return;
    }
    if (!currentUserId) {
        showMessage(taskMessage, "You must be logged in to add tasks.", true);
        return;
    }

    const tasksCollectionRef = getUserTasksCollectionRef();
    if (!tasksCollectionRef) return;

    try {
        await addDoc(tasksCollectionRef, {
            name: taskName,
            dueDate: dueDate, // Save the due date to Firebase
            status: "In Progress",
            createdAt: serverTimestamp()
        });
        showMessage(taskMessage, "Task added successfully!", false);
        taskInput.value = "";
        dueDateInput.value = ""; // Clear the due date input after adding
        loadTasks();
    } catch (error) {
        console.error("Error adding task: ", error);
        showMessage(taskMessage, `Error adding task: ${error.message}`, true);
    }
}

async function loadTasks() {
    if (!currentUserId) {
        taskList.innerHTML = '';
        return;
    }

    const tasksCollectionRef = getUserTasksCollectionRef();
    if (!tasksCollectionRef) return;

    showLoading(true);
    taskList.innerHTML = "";
    noTasksMessage.style.display = 'none';

    try {
        const q = query(tasksCollectionRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            noTasksMessage.style.display = 'block';
        } else {
            querySnapshot.forEach((doc) => {
                renderTaskItem(doc.id, doc.data());
            });
        }

    } catch (error) {
        console.error("Error loading tasks: ", error);
        showMessage(taskMessage, `Error loading tasks: ${error.message}`, true);
    } finally {
        showLoading(false);
    }
}

function renderTaskItem(id, taskData) {
    const taskItem = document.createElement("li");
    taskItem.classList.add("task-item");
    taskItem.dataset.id = id;
    if (taskData.status === "Completed") {
        taskItem.classList.add("completed");
    }

    let dateString = '';
    if (taskData.createdAt && taskData.createdAt instanceof Timestamp) {
        dateString = taskData.createdAt.toDate().toLocaleDateString();
    }

    let dueDateDisplay = '';
    if (taskData.dueDate) {
        dueDateDisplay = `<span class="due-date">Due: ${taskData.dueDate}</span>`;
    }

    taskItem.innerHTML = `
        <span class="task-name">${taskData.name} ${dateString ? '('+dateString+')' : ''}</span>
        ${dueDateDisplay}
        <div class="task-actions">
            <button class="complete-btn">${taskData.status === "Completed" ? '🔄 Reopen' : '✅ Complete'}</button>
            <button class="edit-btn">✏️ Edit</button>
            <button class="delete-btn">❌ Delete</button>
        </div>
    `;

    taskList.appendChild(taskItem);
}

taskList.addEventListener('click', async (e) => {
    const target = e.target;
    const taskItem = target.closest('.task-item');
    if (!taskItem) return;

    const taskId = taskItem.dataset.id;
    if (!currentUserId || !taskId) return;

    const taskDocRef = doc(db, "tasks", currentUserId, "userTasks", taskId);

    if (target.classList.contains('complete-btn')) {
        const currentStatus = taskItem.classList.contains('completed') ? "Completed" : "In Progress";
        const newStatus = currentStatus === "Completed" ? "In Progress" : "Completed";
        try {
            await updateDoc(taskDocRef, { status: newStatus });
            loadTasks();
        } catch (error) {
            console.error("Error updating task status: ", error);
            showMessage(taskMessage, `Error updating status: ${error.message}`, true);
        }
    } else if (target.classList.contains('delete-btn')) {
        if (confirm("Are you sure you want to delete this task?")) {
            try {
                await deleteDoc(taskDocRef);
                loadTasks();
                showMessage(taskMessage, "Task deleted.", false);
            } catch (error) {
                console.error("Error deleting task: ", error);
                showMessage(taskMessage, `Error deleting task: ${error.message}`, true);
            }
        }
    } else if (target.classList.contains('edit-btn')) {
        handleEditTask(taskItem);
    } else if (target.classList.contains('save-btn')) {
        handleSaveTask(taskItem, taskDocRef);
    } else if (target.classList.contains('cancel-btn')) {
        loadTasks();
    }
});

function handleEditTask(taskItem) {
    const taskNameSpan = taskItem.querySelector('.task-name');
    const actionsDiv = taskItem.querySelector('.task-actions');
    const currentName = taskNameSpan.textContent.split('(')[0].trim();

    taskNameSpan.style.display = 'none';
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.classList.add('edit-input');
    taskItem.insertBefore(input, actionsDiv);

    actionsDiv.innerHTML = `
        <button class="save-btn">💾 Save</button>
        <button class="cancel-btn">❌ Cancel</button>
    `;
    input.focus();
}

async function handleSaveTask(taskItem, taskDocRef) {
    const input = taskItem.querySelector('.edit-input');
    const newName = input.value.trim();

    if (newName === "") {
        showMessage(taskMessage, "Task name cannot be empty!", true);
        input.focus();
        return;
    }

    try {
        await updateDoc(taskDocRef, { name: newName });
        loadTasks();
        showMessage(taskMessage, "Task updated successfully!", false);
    } catch (error) {
        console.error("Error saving task: ", error);
        showMessage(taskMessage, `Error saving task: ${error.message}`, true);
        loadTasks();
    }
}

// --- Authentication State Observer ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        console.log("User logged in:", user.uid, user.email);
        currentUserId = user.uid;
        toggleTaskManagementSection(true); // Show task management
    } else {
        // User is signed out
        console.log("User logged out");
        currentUserId = null;
        toggleTaskManagementSection(false); // Show landing page
    }
});

// --- Event Listeners Setup (UPDATED FOR NEW HTML) ---
document.addEventListener('DOMContentLoaded', () => {
    if (goToSignupHeroBtn) {
        goToSignupHeroBtn.addEventListener('click', () => toggleAuthVisibility(false));
    }
    if (goToLoginHeroBtn) {
        goToLoginHeroBtn.addEventListener('click', () => toggleAuthVisibility(true));
    }
    if (goToLoginSignupLink) {
        goToLoginSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleAuthVisibility(true);
        });
    }
    if (goToSignupLoginLink) {
        goToSignupLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleAuthVisibility(false);
        });
    }
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignUp);
    }
    if (loginForm) {
        loginForm.addEventListener('submit', handleSignIn);
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleSignOut);
    }
    if (taskForm) {
        taskForm.addEventListener('submit', handleAddTask);
    }

    // Optional: Check URL hash on load (moved inside DOMContentLoaded)
    if (window.location.hash === '#login') {
        toggleAuthVisibility(true);
    } else if (window.location.hash === '#signup') {
        toggleAuthVisibility(false);
    }
});

console.log("Task Tracker script loaded.");