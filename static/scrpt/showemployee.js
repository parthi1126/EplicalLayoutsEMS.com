const side=document.getElementById('side-bar')
let cnt=0
function menu(){
    cnt++
    if (cnt%2==1){
        side.style.display='flex'
    }
    else{
        side.style.display="none"
    }
}

function block(event, id) {
    event.preventDefault();
    const blockBtn = event.target.closest('.block');
    const row = blockBtn.closest('tr');
    const statusElement = row.querySelector('.blocked');

    fetch(`/block_employee/${id}`, {
        method: 'POST',
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const isBlocked = data.new_status === "Blocked";
            statusElement.innerText = isBlocked ? "Blocked" : "Active";
            blockBtn.innerHTML = isBlocked
                ? '<i class="fas fa-unlock"></i> Unblock'
                : '<i class="fas fa-ban"></i> Block';
            blockBtn.style.backgroundColor = isBlocked ? "#2ecc71" : "#dc143c";
        } else {
            alert("Failed to update status.");
        }
    })
    .catch(err => {
        console.error("Error:", err);
        alert("Error blocking employee.");
    });
}

    var count=0

    function block(event) {
        count++
        // Prevent default action (not mandatory here but good practice)
        event.preventDefault();

        // Find the clicked <p class="block">
        const clickedBlockBtn = event.target.closest('.block');

        // Find the parent <tr>
        const row = clickedBlockBtn.closest('tr');

        // Find the .blocked <p> inside that row
        const statusElement = row.querySelector('.blocked');

        // Change its text
        if (statusElement.innerText === "Blocked") {
        statusElement.innerText = "Active";
        event.target.style.backgroundColor = "#dc143c";  // Crimson red
        event.target.innerText = "Block";
        event.target.innerHTML = '<i class="fas fa-ban"></i> Block';
    } else {
        statusElement.innerText = "Blocked";
        event.target.style.backgroundColor = "#2ecc71";  // Green
        event.target.innerText = "Unblock";
        event.target.innerHTML = '<i class="fas fa-unlock"></i> Unblock';
    }

    }
