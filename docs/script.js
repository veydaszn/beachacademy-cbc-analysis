
// --- POPULATE CLASS RESULTS TABLE (Fixes Class Results Not Showing & Implements 72 Max Score) ---
function populateClassTable(learners) {
    const tbody = document.getElementById("classTable").querySelector("tbody");
    tbody.innerHTML = '';

    learners.forEach(l => {
        const subjects = l.subjects;
        let totalScore = 0;
        Object.keys(subjects).forEach(sub => {
            const grade = subjects[sub];
            const score = gradeToNumber(grade);
            totalScore += score;
            const tr = document.createElement("tr");
            tr.innerHTML = `<td>${l.learner}</td><td>${sub}</td><td>${grade}</td><td>${score}</td>`;
            tbody.appendChild(tr);
        });
        // Add total row
        const trTotal = document.createElement("tr");
        trTotal.innerHTML = `<td colspan="3"><strong>Total</strong></td><td><strong>${totalScore}</strong></td>`;
        tbody.appendChild(trTotal);
    });
}


// --- POPULATE SUBJECT PERFORMANCE TALLY ---
function populateTallyTable(learners) {
    const tbody = document.getElementById("tallyTable").querySelector("tbody");
    tbody.innerHTML = '';

    const subjects = Object.keys(learners[0].subjects);
    const tally = {};

    subjects.forEach(sub => {
        tally[sub] = { EE: 0, ME: 0, AE: 0, BE: 0 };
    });

    learners.forEach(l => {
        subjects.forEach(sub => {
            const grade = l.subjects[sub];
            const category = grade.substring(0, 2); // EE, ME, AE, BE
            if (tally[sub][category] !== undefined) {
                tally[sub][category]++;
            }
        });
    });

    subjects.forEach(sub => {
        ['EE', 'ME', 'AE', 'BE'].forEach(grade => {
            const count = tally[sub][grade];
            const tr = document.createElement("tr");
            tr.innerHTML = `<td>${sub}</td><td>${grade}</td><td>${count}</td>`;
            tbody.appendChild(tr);
        });
    });
}


// --- UPDATE LEARNER DASHBOARD ---
function updateDashboard(learnerDetails) {
  // Update Subject Performance Chart
  const subjects = Object.keys(learnerDetails.subjects);
  const values = subjects.map(s => gradeToNumber(learnerDetails.subjects[s]));
  updateChart(subjects, values);
  
  // Update Performance Summary List
  updateSummary(learnerDetails.subjects);
}

// --- UPDATE CHART (Fixes Charts Seeming Infinite) ---
function updateChart(labels, data) {
  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("subjectChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Performance Score (Max 8 points)", // Updated chart label
        data,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false, 
      animation: {
        duration: 0
      },
      scales: {
        y: { beginAtZero: true, max: 8 } // Chart Y-axis max updated to 8
      },
      plugins: {
          legend: {
              display: true // Show the legend since we updated the label
          }
      }
    }
  });
}

// --- UPDATE SUMMARY LIST ---
function updateSummary(subjects) {
  const ul = document.getElementById("summary");
  ul.innerHTML = "";
  
  // Also calculate the total score and percentage for the individual learner display
  const subjectScores = Object.values(subjects).map(gradeToNumber);
  const totalScore = subjectScores.reduce((sum, score) => sum + score, 0);
  const percentage = ((totalScore / MAX_TOTAL_SCORE) * 100).toFixed(1); 
  
  // Display the total score and percentage at the top of the summary list
  const totalLi = document.createElement("li");
  totalLi.innerHTML = `<strong>Total Score:</strong> ${totalScore} / ${MAX_TOTAL_SCORE}`;
  ul.appendChild(totalLi);
  
  const percentLi = document.createElement("li");
  percentLi.innerHTML = `<strong>Overall Percent:</strong> ${percentage}%`;
  ul.appendChild(percentLi);
  
  // Add a divider
  const divider = document.createElement("li");
  divider.style.borderTop = '1px solid #ccc';
  divider.style.marginTop = '5px';
  divider.style.paddingTop = '5px';
  ul.appendChild(divider);

  // List individual subject grades
  Object.entries(subjects).forEach(([sub, grade]) => {
    const score = gradeToNumber(grade);
    const li = document.createElement("li");
    li.textContent = `${sub}: ${grade} (Score: ${score})`; // Display both grade and score
    ul.appendChild(li);
  });
}


// --- EXPORT PDF LOGIC ---

// Helper function to get current learner name
function getCurrentLearnerName() {
    const select = document.getElementById("learnerSelect");
    const index = select.value;
    return index !== "" && detailedLearners[index] ? detailedLearners[index].learner : "Overall_Report";
}

document.getElementById("exportBtn").addEventListener("click", exportPDF);

function exportPDF() {
  const report = document.getElementById("report");
  const currentLearnerName = getCurrentLearnerName();

  html2canvas(report, { scale: 2 }).then(canvas => {
    const imgData = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    const padding = 10;
    const textHeight = 10;
    
    pdf.setFontSize(16);
    pdf.text(`Learner: ${currentLearnerName}`, padding, textHeight);

    pdf.addImage(imgData, "PNG", 0, textHeight + 5, pdfWidth, pdfHeight); 
    pdf.save(`${currentLearnerName}_CBC_Report.pdf`);
  });
}

// --- EXPORT CLASS PDF LOGIC ---

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
