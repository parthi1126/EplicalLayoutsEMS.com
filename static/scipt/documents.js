const tableBody = document.getElementById("requestTableBody");

    function addRequest(docName) {
      const row = document.createElement("tr");
      const today = new Date().toLocaleDateString("en-GB");

      row.innerHTML = `
        <td>${docName}</td>
        <td>${today}</td>
        <td><span class="status pending">Pending</span></td>
      `;
      tableBody.prepend(row);
    }

    function filterTable(query) {
      const rows = tableBody.querySelectorAll("tr");
      const q = query.toLowerCase();
      rows.forEach(row => {
        const match = row.innerText.toLowerCase().includes(q);
        row.style.display = match ? "" : "none";
      });
    }