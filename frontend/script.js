
fetch("data.json")
  .then(res => res.json())
  .then(data => {
    populateTable(data);
    drawChart(data);
  });

function populateTable(data) {
  const tbody = document.querySelector("#performance-table tbody");

  data.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.Learner}</td>
      <td>${row.EE}</td>
      <td>${row.ME}</td>
      <td>${row.AE}</td>
    `;
    tbody.appendChild(tr);
  });
}

function drawChart(data) {
  const labels = data.map(d => d.Learner);
  const ee = data.map(d => d.EE);
  const me = data.map(d => d.ME);
  const ae = data.map(d => d.AE);

  new Chart(document.getElementById("barChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "EE", data: ee },
        { label: "ME", data: me },
        { label: "AE", data: ae }
      ]
    }
  });
}
