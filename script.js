// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

// Your Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyC3vUnHweEw4cQUYb80zv2-_aP4uemRIdg",
    authDomain: "tasktracker-de513.firebaseapp.com",
    projectId: "tasktracker-de513",
    storageBucket: "tasktracker-de513.firebasestorage.app",
    messagingSenderId: "131785072610",
    appId: "1:131785072610:web:3ac50d06ca55a46238a3bb",
    measurementId: "G-46CKMG13F2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Reference to tasks collection
const tasksCollection = collection(db, "tasks");

// Sign up user
async function signUp() {
    const email = document.getElementById("emailInput").value;
    const password = document.getElementById("passwordInput").value;

    try {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("User created successfully!");
        window.location.reload(); // Refresh to show logged in state
    } catch (error) {
        alert(error.message);
    }
}

// Sign in user
async function signIn() {
    const email = document.getElementById("emailInput").value;
    const password = document.getElementById("passwordInput").value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        alert("Logged in successfully!");
        window.location.reload(); // Refresh to show logged in state
    } catch (error) {
        alert(error.message);
    }
}

// Sign out user
async function signOutUser() {
    await signOut(auth);
    alert("Logged out successfully!");
    window.location.reload();
}

// Show task input and logout button when logged in
auth.onAuthStateChanged((user) => {
    const authSection = document.getElementById("authSection");
    const taskSection = document.getElementById("taskSection");
    const logoutBtn = document.getElementById("logoutBtn");

    if (user) {
        authSection.style.display = "none";  // Hide login form
        taskSection.style.display = "block";  // Show task section
        logoutBtn.style.display = "block";  // Show logout button
        loadTasks();  // Load tasks for the logged-in user
    } else {
        authSection.style.display = "block";  // Show login form
        taskSection.style.display = "none";  // Hide task section
        logoutBtn.style.display = "none";  // Hide logout button
    }
});

// Function to add a new task (linked to user UID)
async function addTask() {
    const taskInput = document.getElementById("taskInput").value;
    if (taskInput === "") return alert("Task cannot be empty!");

    const user = auth.currentUser;
    if (!user) return alert("Please log in to add tasks!");

    await addDoc(collection(db, "tasks", user.uid, "taskList"), { name: taskInput, status: "In Progress" });

    document.getElementById("taskInput").value = "";
    loadTasks(); // Refresh tasks
}

// Function to load tasks for the logged-in user
async function loadTasks() {
    const taskList = document.getElementById("taskList");
    taskList.innerHTML = ""; // Clear previous list

    const user = auth.currentUser;
    if (!user) return;

    const taskCollection = collection(db, "tasks", user.uid, "taskList");
    const querySnapshot = await getDocs(taskCollection);
    querySnapshot.forEach((doc) => {
        const taskData = doc.data();
        const taskItem = document.createElement("li");
        taskItem.innerHTML = `
            ${taskData.name} - ${taskData.status} 
            <button onclick="updateTask('${doc.id}')">✅ Complete</button>
            <button onclick="deleteTask('${doc.id}')">❌ Delete</button>
        `;
        taskList.appendChild(taskItem);
    });
}

// Function to update task status to "Completed"
async function updateTask(taskId) {
    const taskRef = doc(db, "tasks", auth.currentUser.uid, "taskList", taskId); // Include the UID and taskId
    try {
        await updateDoc(taskRef, { status: "Completed" });
        loadTasks(); // Refresh the task list
    } catch (error) {
        console.error("Error updating task: ", error);
    }
}

// Function to delete a task
async function deleteTask(taskId) {
    const taskRef = doc(db, "tasks", auth.currentUser.uid, "taskList", taskId); // Include the UID and taskId
    try {
        await deleteDoc(taskRef);
        loadTasks(); // Refresh the task list
    } catch (error) {
        console.error("Error deleting task: ", error);
    }
}


// Load tasks on page load
window.onload = loadTasks;

// Expose functions to HTML
window.addTask = addTask;
window.updateTask = updateTask;
window.deleteTask = deleteTask;
window.signUp = signUp;
window.signIn = signIn;
window.signOutUser = signOutUser;
