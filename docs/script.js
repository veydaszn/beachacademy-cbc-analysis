document.addEventListener("DOMContentLoaded", () => {

  let detailedLearners = [];
  let chart;

  /* =========================
     LOAD & NORMALIZE DATA
  ========================== */
  fetch("data.json")
    .then(res => {
      if (!res.ok) throw new Error("Failed to load data.json");
      return res.json();
    })
    .then(rawData => {

      // Normalize your JSON structure
      detailedLearners = rawData.map(l => ({
        learner: l.Learner,
        subjects: {
          EE: l.EE,
          ME: l.ME,
          AE: l.AE
        }
      }));

      if (!detailedLearners.length) {
        throw new Error("No learner data found");
      }

      populateDropdown();
      updateDashboard(detailedLearners[0]);
      populateClassTable();
    })
    .catch(err => console.error("DATA ERROR:", err));

  /* =========================
     DROPDOWN
  ========================== */
  function populateDropdown() {
    const select = document.getElementById("learnerSelect");
    select.innerHTML = "";

    detailedLearners.forEach((l, i) => {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = l.learner;
      select.appendChild(option);
    });

    select.addEventListener("change", e => {
      updateDashboard(detailedLearners[e.target.value]);
    });
  }

  /* =========================
     DASHBOARD UPDATE
  ========================== */
  function updateDashboard(learner) {
    const subjects = Object.keys(learner.subjects);
    const values = subjects.map(s => gradeToNumber(learner.subjects[s]));

    updateChart(subjects, values);
    updateSummary(learner.subjects);
  }

  /* =========================
     GRADE HANDLER
  ========================== */
  function gradeToNumber(value) {
    if (typeof value === "number") return value;

    return {
      EE1: 5,
      EE2: 4.5,
      ME1: 4,
      ME2: 3.5,
      AE1: 3
    }[value] || 0;
  }

  /* =========================
     CHART (FIXED SCALING)
  ========================== */
  function updateChart(labels, data) {
    if (chart) chart.destroy();

    const ctx = document
      .getElementById("subjectChart")
      .getContext("2d");

    chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: "Performance Score",
          data,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 6,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  /* =========================
     SUMMARY LIST
  ========================== */
  function updateSummary(subjects) {
    const ul = document.getElementById("summary");
    ul.innerHTML = "";

    Object.entries(subjects).forEach(([sub, val]) => {
      const li = document.createElement("li");
      li.textContent = `${sub}: ${val}`;
      ul.appendChild(li);
    });
  }

  /* =========================
     EXPORT LEARNER PDF
  ========================== */
  document
    .getElementById("exportBtn")
    .addEventListener("click", exportLearnerPDF);

  function exportLearnerPDF() {
    const report = document.getElementById("report");
    const idx = document.getElementById("learnerSelect").value;
    const learnerName = detailedLearners[idx]?.learner || "CBC_Report";

    html2canvas(report, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL("image/png");
      const { jsPDF } = window.jspdf;

      const pdf = new jsPDF("p", "mm", "a4");
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;

      pdf.setFontSize(16);
      pdf.text(`Learner: ${learnerName}`, 10, 15);
      pdf.addImage(imgData, "PNG", 0, 20, width, height);

      pdf.save(`${learnerName}_CBC_Report.pdf`);
    });
  }

  /* =========================
     CLASS TABLE
  ========================== */
  function populateClassTable() {
    const tbody = document.querySelector("#classTable tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    detailedLearners.forEach(l => {
      const grades = Object.values(l.subjects).map(gradeToNumber);
      const avg = (
        grades.reduce((a, b) => a + b, 0) / grades.length
      ).toFixed(2);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${l.learner}</td>
        <td>${Object.keys(l.subjects).length}</td>
        <td>${avg}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  /* =========================
     EXPORT CLASS PDF
  ========================== */
  const exportClassBtn = document.getElementById("exportClassBtn");

  if (exportClassBtn) {
    exportClassBtn.addEventListener("click", () => {
      const tableWrapper = document.querySelector(".table-wrapper");

      html2canvas(tableWrapper, { scale: 2 }).then(canvas => {
        const imgData = canvas.toDataURL("image/png");
        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF("p", "mm", "a4");
        const width = pdf.internal.pageSize.getWidth();
        const height = (canvas.height * width) / canvas.width;

        pdf.setFontSize(16);
        pdf.text("CBC Class Results Summary", 10, 15);
        pdf.addImage(imgData, "PNG", 0, 20, width, height);

        pdf.save("CBC_Class_Results.pdf");
      });
    });
  }

});
