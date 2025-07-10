// dark.js - Improved Dark Mode Toggle with localStorage
const darkModeToggle = document.getElementById("b"); // The moon/sun icon

// Check for saved dark mode preference
const savedMode = localStorage.getItem("darkMode");

// Apply dark mode if previously enabled
if (savedMode === "enabled") {
    document.body.classList.add("dark-mode");
    darkModeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>'; // Show sun (light mode toggle)
} else {
    document.body.classList.remove("dark-mode");
    darkModeToggle.innerHTML = '<i class="bi bi-moon-fill"></i>'; // Show moon (dark mode toggle)
}

// Toggle dark mode on button click
darkModeToggle.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");

    // Save preference to localStorage
    if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("darkMode", "enabled");
        darkModeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>'; // Change to sun icon
    } else {
        localStorage.setItem("darkMode", "disabled");
        darkModeToggle.innerHTML = '<i class="bi bi-moon-fill"></i>'; // Change back to moon icon
    }
});