

document.addEventListener("DOMContentLoaded", () => {
  // ALL your JS code here

  let detailedLearners = []; // Changed 'learners' to 'detailedLearners' for clarity
let chart;

// --- 1. FETCH AND LOAD DATA FIX ---
// Assuming "../data.json" now contains the structure:
// { "detailed_performance": [ ... ], "performance_summary": [ ... ] }
fetch("data.json")
  .then(res => {
    if (!res.ok) throw new Error("Failed to load data.");
    return res.json();
  })
  .then(data => {
    // FIX: Extract the correct array from the new JSON structure
    detailedLearners = data.detailed_performance; 
    
    // Check if data is available before proceeding
    if (detailedLearners && detailedLearners.length > 0) {
        populateDropdown();
        
        // Start the dashboard with the first learner's data
        updateDashboard(detailedLearners[0]);
    } else {
        console.error("Detailed performance data array is empty or missing.");
    }
  })
  .catch(error => {
    console.error("Data loading error:", error);
    // You might want to display an error message on the dashboard here.
  });


function populateDropdown() {
  const select = document.getElementById("learnerSelect");
  
  // Use the detailedLearners array, which now correctly holds the list
  detailedLearners.forEach((l, i) => {
    const option = document.createElement("option");
    // We are still using the array index (i) as the value, which is fine
    // as long as the array order doesn't change.
    option.value = i; 
    option.textContent = l.learner; // Learner name is correctly pulled from the object
    select.appendChild(option);
  });

  select.addEventListener("change", e => {
    // The change listener still correctly uses the array index (e.target.value)
    // to find the corresponding learner object.
    updateDashboard(detailedLearners[e.target.value]);
  });
}

function updateDashboard(learner) {
  // This part remains excellent, using Object.keys/map to prepare data for charts
  const subjects = Object.keys(learner.subjects);
  const values = subjects.map(s => gradeToNumber(learner.subjects[s]));

  updateChart(subjects, values);
  updateSummary(learner.subjects);
}

// ... (The rest of your functions: gradeToNumber, updateChart, updateSummary, exportPDF are excellent and remain unchanged)

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


document.getElementById("exportBtn").addEventListener("click", exportPDF);

function exportPDF() {
  const report = document.getElementById("report");
  // You might want to grab the currently selected learner name here
  const currentLearnerName = detailedLearners[document.getElementById("learnerSelect").value]?.learner || "Report";

  html2canvas(report, { scale: 2 }).then(canvas => {
    const imgData = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    const padding = 10;
    const textHeight = 10;
    
    // Add Learner Name at the top
    pdf.setFontSize(16);
    pdf.text(`Learner: ${currentLearnerName}`, padding, textHeight);

    // Add Image below the text
    pdf.addImage(imgData, "PNG", 0, textHeight + 5, pdfWidth, pdfHeight); 

    // Use the dynamic name for saving
    pdf.save(`${currentLearnerName}_CBC_Report.pdf`);
  });
}

 
});

