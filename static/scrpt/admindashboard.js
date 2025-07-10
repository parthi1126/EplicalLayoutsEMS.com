const quotes = [
        "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        "Your limitation—it’s only your imagination.",
        "Push yourself, because no one else is going to do it for you.",
        "Sometimes later becomes never. Do it now.",
        "Great things never come from comfort zones.",
        "Dream it. Wish it. Do it.",
        "Don’t stop when you’re tired. Stop when you’re done.",
        "The harder you work for something, the greater you’ll feel when you achieve it."
    ];

    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    document.getElementById("quote-text").innerText = randomQuote;

    const date = new Date();
    const formattedDate = date.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
document.addEventListener('DOMContentLoaded', function () {
    const side = document.getElementById('side-bar');
    const left = document.querySelector('.left');
    const body = document.querySelector('.abc');
    const navbar = document.querySelector('.navbar');
    const userIcon = document.getElementById('user-icon');
    const profilePopup = document.getElementById('profilePopup');
    const closePopup = document.getElementById('closePopup');

    // Sidebar toggle
    document.getElementById('option').addEventListener('click', function () {
        side.classList.toggle('show-sidebar');
    });

    // Dark mode toggle
    document.getElementById('b').addEventListener('click', function () {
        body.classList.toggle('dark-mode');
        navbar.classList.toggle('dark-mode');
    });

    // Profile popup toggle
    userIcon.addEventListener('click', function (e) {
        e.stopPropagation();
        profilePopup.style.display = profilePopup.style.display === 'block' ? 'none' : 'block';
    });

    // Close profile popup
    closePopup.addEventListener('click', function () {
        profilePopup.style.display = 'none';
    });

    // Close popup when clicking outside
    document.addEventListener('click', function (e) {
        if (!profilePopup.contains(e.target) && e.target !== userIcon) {
            profilePopup.style.display = 'none';
        }
    });
});
const side=document.getElementById('side-bar')
let count=0
function menu(){
    count++
    if (count%2==1){
        side.style.display='flex'
    }
    else{
        side.style.display="none"
    }
}
