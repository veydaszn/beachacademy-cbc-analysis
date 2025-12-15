let learners = [];
let chart;

fetch("data.json")
  .then(res => res.json())
  .then(data => {
    learners = data;
    populateDropdown();
    updateDashboard(data[0]);
  });

function populateDropdown() {
  const select = document.getElementById("learnerSelect");
  learners.forEach((l, i) => {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = l.learner;
    select.appendChild(option);
  });

  select.addEventListener("change", e => {
    updateDashboard(learners[e.target.value]);
  });
}

function updateDashboard(learner) {
  const subjects = Object.keys(learner.subjects);
  const values = subjects.map(s => gradeToNumber(learner.subjects[s]));

  updateChart(subjects, values);
  updateSummary(learner.subjects);
}

function gradeToNumber(grade) {
  return {
    EE1: 5,
    EE2: 4.5,
    ME1: 4,
    ME2: 3.5,
    AE1: 3
  }[grade] || 0;
}

function updateChart(labels, data) {
  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("subjectChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Performance Score",
        data
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, max: 5 }
      }
    }
  });
}

function updateSummary(subjects) {
  const ul = document.getElementById("summary");
  ul.innerHTML = "";

  Object.entries(subjects).forEach(([sub, grade]) => {
    const li = document.createElement("li");
    li.textContent = `${sub}: ${grade}`;
    ul.appendChild(li);
  });
}
