// Import necessary functions from the Firebase SDK
// Make sure you have installed Firebase: npm install firebase
// Or are using the script tags in HTML for ES Modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import {
    getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, orderBy, serverTimestamp, Timestamp // Added Timestamp
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import {
    getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail // Added password reset
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

// --- IMPORTANT: Firebase Configuration ---
// REPLACE THIS with your actual Firebase project configuration.
// CONSIDER USING ENVIRONMENT VARIABLES for security. DO NOT commit keys to Git.
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

// --- Firestore Security Rules Reminder ---
// In your Firebase Console -> Firestore Database -> Rules, set rules like this
// to ensure users can only access their own tasks:
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read, write, update, delete only their own tasks
    match /tasks/{userId}/{document=**} { // Allows access to subcollections too
      allow read, write, update, delete: if request.auth != null && request.auth.uid == userId;
    }
  }
}
*/

// --- DOM Element References ---
const authSection = document.getElementById('authSection');
const taskManagementSection = document.getElementById('taskManagementSection');
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const signupBtn = document.getElementById('signupBtn');
const loginBtn = document.getElementById('loginBtn');
// const resetPasswordBtn = document.getElementById('resetPasswordBtn'); // Uncomment if using
const logoutBtn = document.getElementById('logoutBtn');
const authMessage = document.getElementById('auth-message');

const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('taskInput');
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
    // Auto-hide message after some time (optional)
    setTimeout(() => { element.textContent = ''; element.className = 'message'; }, 5000);
}

function clearMessage(element) {
    element.textContent = '';
    element.className = 'message';
}

function showLoading(show) {
    loadingIndicator.style.display = show ? 'block' : 'none';
}

function toggleSections(isLoggedIn) {
    if (isLoggedIn) {
        authSection.style.display = 'none';
        taskManagementSection.style.display = 'block';
        userInfo.style.display = 'block';
        userEmailSpan.textContent = auth.currentUser.email; // Display user email
    } else {
        authSection.style.display = 'block';
        taskManagementSection.style.display = 'none';
        userInfo.style.display = 'none';
        userEmailSpan.textContent = '';
        taskList.innerHTML = ''; // Clear tasks on logout
        currentUserId = null;
        clearMessage(authMessage);
        clearMessage(taskMessage);
    }
}

// --- Authentication Functions ---
async function handleSignUp(e) {
    e.preventDefault(); // Prevent default form submission if using forms
    clearMessage(authMessage);
    const email = emailInput.value;
    const password = passwordInput.value;
    if (!email || !password) {
        showMessage(authMessage, "Please enter email and password.", true);
        return;
    }
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        // No need to reload, onAuthStateChanged will handle UI update
        showMessage(authMessage, "Sign up successful! You are now logged in.", false);
        // Clear form fields after successful signup
        authForm.reset();
    } catch (error) {
        console.error("Sign up error:", error);
        showMessage(authMessage, `Sign up failed: ${error.message}`, true);
    }
}

async function handleSignIn(e) {
    e.preventDefault(); // Prevent default form submission if using forms
    clearMessage(authMessage);
    const email = emailInput.value;
    const password = passwordInput.value;
    if (!email || !password) {
        showMessage(authMessage, "Please enter email and password.", true);
        return;
    }
    try {
        await signInWithEmailAndPassword(auth, email, password);
        // No need to reload, onAuthStateChanged will handle UI update
        showMessage(authMessage, "Login successful!", false);
         // Clear form fields after successful login
        authForm.reset();
    } catch (error) {
        console.error("Sign in error:", error);
        showMessage(authMessage, `Login failed: ${error.message}`, true);
    }
}

async function handleSignOut() {
    clearMessage(authMessage);
    try {
        await signOut(auth);
        // No need to reload, onAuthStateChanged will handle UI update
        // Maybe show a success message briefly on the login form
        // showMessage(authMessage, "Logged out successfully.", false);
        console.log("User signed out");
    } catch (error) {
        console.error("Sign out error:", error);
        showMessage(authMessage, `Logout failed: ${error.message}`, true);
    }
}

 // Optional: Password Reset
async function handlePasswordReset() {
    clearMessage(authMessage);
    const email = emailInput.value;
    if (!email) {
        showMessage(authMessage, "Please enter your email address to reset password.", true);
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        showMessage(authMessage, "Password reset email sent! Check your inbox.", false);
    } catch (error) {
        console.error("Password reset error:", error);
        showMessage(authMessage, `Password reset failed: ${error.message}`, true);
    }
}


// --- Task Functions ---

// Get reference to the user's specific task collection
function getUserTasksCollectionRef() {
    if (!currentUserId) return null;
    // Use collection(db, 'parentCollection', 'documentId', 'subCollection')
    return collection(db, "tasks", currentUserId, "userTasks");
}

// Add a new task
async function handleAddTask(e) {
    e.preventDefault(); // Prevent default form submission
    clearMessage(taskMessage);
    const taskName = taskInput.value.trim();

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
            status: "In Progress", // 'In Progress' or 'Completed'
            createdAt: serverTimestamp() // Add a timestamp
        });
        showMessage(taskMessage, "Task added successfully!", false);
        taskInput.value = ""; // Clear input field
        loadTasks(); // Refresh tasks list
    } catch (error) {
        console.error("Error adding task: ", error);
        showMessage(taskMessage, `Error adding task: ${error.message}`, true);
    }
}

// Load and display tasks for the current user
async function loadTasks() {
    if (!currentUserId) {
        taskList.innerHTML = ''; // Clear list if no user
        return;
    }

    const tasksCollectionRef = getUserTasksCollectionRef();
     if (!tasksCollectionRef) return;

    showLoading(true);
    taskList.innerHTML = ""; // Clear previous list
    noTasksMessage.style.display = 'none'; // Hide 'no tasks' message initially

    try {
        // Optional: Query to order tasks, e.g., by creation date
        const q = query(tasksCollectionRef, orderBy("createdAt", "desc")); // Show newest first
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
             noTasksMessage.style.display = 'block'; // Show 'no tasks' message
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

// Render a single task item in the list
function renderTaskItem(id, taskData) {
    const taskItem = document.createElement("li");
    taskItem.classList.add("task-item");
    taskItem.dataset.id = id; // Store task ID on the element
    if (taskData.status === "Completed") {
        taskItem.classList.add("completed");
    }

    // Format timestamp if it exists
    let dateString = '';
    if (taskData.createdAt && taskData.createdAt instanceof Timestamp) {
        dateString = taskData.createdAt.toDate().toLocaleDateString();
    }

    taskItem.innerHTML = `
        <span class="task-name">${taskData.name} ${dateString ? '('+dateString+')' : ''}</span>
        <div class="task-actions">
            <button class="complete-btn">${taskData.status === "Completed" ? '🔄 Reopen' : '✅ Complete'}</button>
            <button class="edit-btn">✏️ Edit</button>
            <button class="delete-btn">❌ Delete</button>
        </div>
    `;

    // Add event listeners using event delegation (better for performance)
    // Handled by the main taskList event listener below

    taskList.appendChild(taskItem);
}


// --- Event Delegation for Task Actions ---
taskList.addEventListener('click', async (e) => {
    const target = e.target;
    const taskItem = target.closest('.task-item'); // Find parent task item
    if (!taskItem) return; // Clicked outside a task item action

    const taskId = taskItem.dataset.id;
    if (!currentUserId || !taskId) return;

    const taskDocRef = doc(db, "tasks", currentUserId, "userTasks", taskId);

    // Handle Complete/Reopen button
    if (target.classList.contains('complete-btn')) {
        const currentStatus = taskItem.classList.contains('completed') ? "Completed" : "In Progress";
        const newStatus = currentStatus === "Completed" ? "In Progress" : "Completed";
        try {
            await updateDoc(taskDocRef, { status: newStatus });
            loadTasks(); // Refresh list to show updated status/button text
        } catch (error) {
            console.error("Error updating task status: ", error);
            showMessage(taskMessage, `Error updating status: ${error.message}`, true);
        }
    }

    // Handle Delete button
    else if (target.classList.contains('delete-btn')) {
        if (confirm("Are you sure you want to delete this task?")) { // Confirmation dialog
             try {
                await deleteDoc(taskDocRef);
                // taskItem.remove(); // Or reload list
                loadTasks(); // Refresh list
                showMessage(taskMessage, "Task deleted.", false);
            } catch (error) {
                console.error("Error deleting task: ", error);
                showMessage(taskMessage, `Error deleting task: ${error.message}`, true);
            }
        }
    }

    // Handle Edit button
    else if (target.classList.contains('edit-btn')) {
        handleEditTask(taskItem);
    }

     // Handle Save button (appears during edit)
    else if (target.classList.contains('save-btn')) {
        handleSaveTask(taskItem, taskDocRef);
    }

    // Handle Cancel button (appears during edit)
    else if (target.classList.contains('cancel-btn')) {
       loadTasks(); // Simple way to cancel: just reload the list
    }
});


// --- Edit Task Specific Functions ---

// Switch task item to edit mode
function handleEditTask(taskItem) {
    const taskNameSpan = taskItem.querySelector('.task-name');
    const actionsDiv = taskItem.querySelector('.task-actions');
    const currentName = taskNameSpan.textContent.split('(')[0].trim(); // Get name part only

    // Replace name span with input field
    taskNameSpan.style.display = 'none'; // Hide the original span
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.classList.add('edit-input');
    taskItem.insertBefore(input, actionsDiv); // Insert input before actions

    // Change buttons to Save/Cancel
    actionsDiv.innerHTML = `
        <button class="save-btn">💾 Save</button>
        <button class="cancel-btn">❌ Cancel</button>
    `;
    input.focus(); // Focus the input field
}

// Save edited task name
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
        loadTasks(); // Refresh list to show changes
        showMessage(taskMessage, "Task updated successfully!", false);
    } catch (error) {
        console.error("Error saving task: ", error);
        showMessage(taskMessage, `Error saving task: ${error.message}`, true);
         // Optionally revert UI changes or just reload
        loadTasks();
    }
}


// --- Authentication State Observer ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        console.log("User logged in:", user.uid, user.email);
        currentUserId = user.uid; // Set the global currentUserId
        toggleSections(true); // Show task sections, hide auth
        loadTasks(); // Load tasks for the logged-in user
    } else {
        // User is signed out
        console.log("User logged out");
        currentUserId = null;
        toggleSections(false); // Show auth section, hide tasks
    }
});

// --- Initial Event Listeners Setup ---
signupBtn.addEventListener('click', handleSignUp);
loginBtn.addEventListener('click', handleSignIn);
logoutBtn.addEventListener('click', handleSignOut);
taskForm.addEventListener('submit', handleAddTask);
// resetPasswordBtn.addEventListener('click', handlePasswordReset); // Uncomment if using

console.log("Task Tracker script loaded."); // For debugging