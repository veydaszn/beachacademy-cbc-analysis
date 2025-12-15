// Global variables
let detailedLearners = [];
let summaryLearners = [];
let chart;
const MAX_TOTAL_SCORE = 72; // 8 points * 9 subjects

// --- Helper Function: Grade to Number Conversion (8-Point System) ---
function gradeToNumber(grade) {
  // Implements the 8-point score map (EE1=8, BE2=1)
  const scoreMap = {
    'EE1': 8,
    'EE2': 7,
    'ME1': 6,
    'ME2': 5,
    'AE1': 4,
    'AE2': 3, // Included for completeness, though not in current data
    'BE1': 2, // Included for completeness
    'BE2': 1  // Included for completeness
  };
  
  // Returns the score or 0 if the grade is unknown
  return scoreMap[grade] || 0; 
}

// --- INITIAL DATA FETCH AND SETUP ---
document.addEventListener('DOMContentLoaded', () => {
  fetch("./data.json")
    .then(res => {
      if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}.`);
      }
      return res.json();
    })
    .then(data => {
      detailedLearners = data.detailed_performance; 
      summaryLearners = data.performance_summary; 
      
      if (detailedLearners && detailedLearners.length > 0) {
          populateDropdown();
          // Populate the Class Results table
          populateClassTable(detailedLearners); 
          // Populate the Subject Performance Tally
          populateTallyTable(detailedLearners); 
          
          // Start the dashboard with the first learner's data
          updateDashboard(detailedLearners[0]);
      } else {
          console.error("Data loaded, but 'detailed_performance' array is empty or missing.");
      }
    })
    .catch(error => {
      console.error("DATA LOADING FAILED:", error.message);
      const select = document.getElementById('learnerSelect');
      if (select) select.innerHTML = '<option disabled selected>Error loading data</option>';

      // Provide a visible error message in the UI so users know why no data appears
      const report = document.getElementById('report');
      if (report) {
        report.innerHTML = `
          <div style="padding:20px;background:#fee;border:1px solid #f99;border-radius:6px;">
            <strong>Error loading data:</strong> ${error.message}.
            <div style="margin-top:8px;">If you opened the HTML file directly, serve the folder with a local server (for example: <code>python3 -m http.server</code>) and reload.</div>
          </div>`;
      }
    });
});


// --- POPULATE DROPDOWN (Fixes the Empty Dropdown Issue) ---
function populateDropdown() {
  const select = document.getElementById("learnerSelect");
  select.innerHTML = ''; 

  // Add default option
  const defaultOption = document.createElement("option");
  defaultOption.textContent = "Select Learner:";
  defaultOption.value = "";
  defaultOption.disabled = true;
  defaultOption.selected = true;
  select.appendChild(defaultOption);

  detailedLearners.forEach((l, i) => {
    const option = document.createElement("option");
    option.value = i; 
    option.textContent = l.learner;
    select.appendChild(option);
  });

  select.addEventListener("change", e => {
    const index = parseInt(e.target.value);
    updateDashboard(detailedLearners[index]); 
  });
}

// --- POPULATE CLASS RESULTS TABLE (Fixes Class Results Not Showing & Implements 72 Max Score) ---
function populateClassTable(learners) {
    const thead = document.getElementById("classTableHead");
    const tbody = document.getElementById("classTable").querySelector("tbody");
    thead.innerHTML = '';
    tbody.innerHTML = '';

    // Create header
    const headerTr = document.createElement("tr");
    headerTr.appendChild(document.createElement("th")).textContent = "Subject";
    learners.forEach(l => {
        const th = document.createElement("th");
        th.textContent = l.learner;
        headerTr.appendChild(th);
    });
    thead.appendChild(headerTr);

    // Get subjects
    const subjects = Object.keys(learners[0].subjects);

    // For each subject, create row
    subjects.forEach(sub => {
        const tr = document.createElement("tr");
        tr.appendChild(document.createElement("td")).textContent = sub;
        learners.forEach(l => {
            const score = gradeToNumber(l.subjects[sub]);
            tr.appendChild(document.createElement("td")).textContent = score;
        });
        tbody.appendChild(tr);
    });

    // Add total row
    const totalTr = document.createElement("tr");
    totalTr.appendChild(document.createElement("td")).textContent = "Total";
    learners.forEach(l => {
        const total = Object.values(l.subjects).reduce((sum, grade) => sum + gradeToNumber(grade), 0);
        totalTr.appendChild(document.createElement("td")).textContent = total;
    });
    tbody.appendChild(totalTr);
}


// --- POPULATE SUBJECT PERFORMANCE TALLY ---
function populateTallyTable(learners) {
    const thead = document.getElementById("tallyTableHead");
    const tbody = document.getElementById("tallyTable").querySelector("tbody");
    thead.innerHTML = '';
    tbody.innerHTML = '';

    const subjects = Object.keys(learners[0].subjects);
    const grades = ['EE1', 'EE2', 'ME1', 'ME2', 'AE1', 'AE2', 'BE1', 'BE2'];
    const tally = {};

    subjects.forEach(sub => {
        tally[sub] = {};
        grades.forEach(g => tally[sub][g] = 0);
    });

    learners.forEach(l => {
        subjects.forEach(sub => {
            const grade = l.subjects[sub];
            if (tally[sub][grade] !== undefined) {
                tally[sub][grade]++;
            }
        });
    });

    // Create header
    const headerTr = document.createElement("tr");
    headerTr.appendChild(document.createElement("th")).textContent = "Grade";
    subjects.forEach(sub => {
        const th = document.createElement("th");
        th.textContent = sub;
        headerTr.appendChild(th);
    });
    thead.appendChild(headerTr);

    // For each grade, create row
    grades.forEach(grade => {
        const tr = document.createElement("tr");
        tr.appendChild(document.createElement("td")).textContent = grade;
        subjects.forEach(sub => {
            tr.appendChild(document.createElement("td")).textContent = tally[sub][grade];
        });
        tbody.appendChild(tr);
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

// --- EXPORT TALLY PDF LOGIC ---

const exportTallyBtn = document.getElementById("exportTallyBtn");

if (exportTallyBtn) {
  exportTallyBtn.addEventListener("click", () => {
    const tallyWrapper = document.querySelectorAll(".table-wrapper")[1]; // Assuming the tally is the second table-wrapper

    html2canvas(tallyWrapper, { scale: 2 }).then(canvas => {
      const imgData = canvas.toDataURL("image/png");
      const { jsPDF } = window.jspdf;

      const pdf = new jsPDF("p", "mm", "a4");
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;

      pdf.setFontSize(16);
      pdf.text("CBC Subject Performance Tally", 10, 15);
      pdf.addImage(imgData, "PNG", 0, 20, width, height);

      pdf.save("CBC_Subject_Tally.pdf");
    });
  });
    }
