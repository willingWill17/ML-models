const ctx = document.getElementById("scatterChart").getContext("2d");

// Initial data
const initialData = [
  { x: 1, y: 2 },
  { x: 2, y: 3 },
  { x: 3, y: 7 },
  { x: 4, y: 5 },
  { x: 5, y: 1 },
];
// console.log(initialData, initialData[0]);
// console.log(typeof initialData, typeof initialData[0]["x"]);
let scatterData = [...initialData];

let a = 1,
  b = 0,
  c = 0;
let polyA = 1,
  polyB = 0,
  polyC = 0; // Polynomial parameters
let C = 1,
  epsilon = 0.1;
let svrWeight = 0,
  svrBias = 0;
let functionType = "linear"; // Default function type

const scatterChart = new Chart(ctx, {
  type: "scatter",
  data: {
    datasets: [
      {
        label: "Sample Points",
        data: scatterData,
        backgroundColor: "rgb(75, 192, 192)",
        borderColor: "rgb(75, 192, 192)",
        pointRadius: 5,
      },
      {
        label: "Function Curve",
        data: [],
        borderColor: "rgb(255, 99, 132)",
        borderWidth: 2,
        type: "line",
        pointRadius: 0,
        fill: false,
      },
      {
        label: "SVR Support Vectors",
        data: [],
        backgroundColor: "rgba(255, 165, 0, 0.7)",
        borderColor: "rgb(255, 165, 0)",
        pointRadius: 7,
        pointStyle: "circle",
        showLine: false,
        hidden: true,
      },
      {
        label: "SVR Margin Boundaries",
        data: [],
        borderColor: "rgba(153, 102, 255, 0.5)",
        borderWidth: 1,
        borderDash: [5, 5],
        type: "line",
        pointRadius: 0,
        fill: false,
        hidden: true,
      },
      {
        label: "SVR Upper Margin",
        data: [],
        borderColor: "rgba(153, 102, 255, 0.5)",
        borderWidth: 1,
        borderDash: [5, 5],
        type: "line",
        pointRadius: 0,
        fill: false,
        hidden: true,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "linear",
        position: "bottom",
        title: { display: true, text: "X Axis" },
        min: -5,
        max: 10,
      },
      y: {
        title: { display: true, text: "Y Axis" },
        min: -10,
        max: 15,
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += `(${context.parsed.x.toFixed(
                2
              )}, ${context.parsed.y.toFixed(2)})`;
            }
            return label;
          },
        },
      },
    },
  },
});

function predictSVR(x) {
  return x * svrWeight + svrBias; // Fallback
}

// Generate consistent support vectors from data points
function generateSupportVectors(data, threshold = 0.4) {
  const vectors = [];
  const seed = C + epsilon; // Use parameters as seed

  // Select support vectors deterministically based on parameters
  for (let i = 0; i < data.length; i++) {
    // Use a deterministic formula instead of random
    const point = data[i];
    const selection = (Math.sin(point.x * seed) + 1) / 2; // Value between 0-1

    if (selection > threshold) {
      vectors.push({
        x: point.x,
        y: point.y,
        alpha: C * (0.5 + Math.abs(Math.cos(point.x)) * 0.5), // Deterministic alpha
      });
    }
  }

  // Ensure we have at least 3 support vectors for stability
  if (vectors.length < 3) {
    // Add the three points with highest y-values as support vectors
    const sortedPoints = [...data].sort((a, b) => b.y - a.y).slice(0, 3);
    for (const point of sortedPoints) {
      if (!vectors.some((v) => v.x === point.x && v.y === point.y)) {
        vectors.push({
          x: point.x,
          y: point.y,
          alpha: C * 0.8,
        });
      }
    }
  }

  return vectors;
}

// Function to update the selected function's curve
function updateFunction() {
  const xRange = [];
  for (let x = -5; x <= 10; x += 0.1) {
    xRange.push(x);
  }
  //   console.log("xRange", xRange);

  const functionData = [];
  const upperMarginData = [];
  const lowerMarginData = [];

  if (functionType === "linear") {
    for (const x of xRange) {
      functionData.push({ x: x, y: a * x + b });
    }

    // Hide SVR-specific datasets
    scatterChart.data.datasets[2].hidden = true;
    scatterChart.data.datasets[3].hidden = true;
    scatterChart.data.datasets[4].hidden = true;
  } else if (functionType === "polynomial") {
    for (const x of xRange) {
      functionData.push({ x: x, y: polyA * x * x + polyB * x + polyC });
    }

    // Hide SVR-specific datasets
    scatterChart.data.datasets[2].hidden = true;
    scatterChart.data.datasets[3].hidden = true;
    scatterChart.data.datasets[4].hidden = true;
  } else if (functionType === "svr") {
    // Generate support vectors from data points
    const supportVectors = generateSupportVectors(scatterData, 0.3);

    // Predict SVR values for each x in range
    for (const x of xRange) {
      const y = predictSVR(x, supportVectors, "linear");
      functionData.push({ x: x, y: y });

      // Add margin boundaries (ε-tube)
      upperMarginData.push({ x: x, y: y + epsilon });
      lowerMarginData.push({ x: x, y: y - epsilon });
    }

    // Update support vectors visualization
    const supportVectorPoints = supportVectors.map((sv) => ({
      x: sv.x,
      y: sv.y,
    }));
    scatterChart.data.datasets[2].data = supportVectorPoints;
    scatterChart.data.datasets[3].data = lowerMarginData;
    scatterChart.data.datasets[4].data = upperMarginData;

    // Show SVR-specific datasets
    scatterChart.data.datasets[2].hidden = false;
    scatterChart.data.datasets[3].hidden = false;
    scatterChart.data.datasets[4].hidden = false;
  }
  // console.log("functionData", scatterData);
  // Update the function curve dataset
  scatterChart.data.datasets[1].data = functionData;
  //   console.log(scatterData);
  scatterChart.update();
}

// Add random data points
document.getElementById("addDataBtn").addEventListener("click", () => {
  const randomX = Math.random() * 10;
  const randomY = Math.random() * 10;
  scatterData.push({ x: randomX, y: randomY });
  scatterChart.data.datasets[0].data = scatterData;
  updateFunction();
});

// Reset to initial data points
document.getElementById("resetDataBtn").addEventListener("click", () => {
  scatterData = [...initialData];
  scatterChart.data.datasets[0].data = scatterData;
  updateFunction();
});

// Handle function type change
document.getElementById("functionSelect").addEventListener("change", (e) => {
  functionType = e.target.value;

  // Show/hide control sections based on function type
  document.getElementById("linearControls").style.display =
    functionType === "linear" ? "block" : "none";
  document.getElementById("polynomialControls").style.display =
    functionType === "polynomial" ? "block" : "none";
  document.getElementById("svrControls").style.display =
    functionType === "svr" ? "block" : "none";

  // Update the function curve based on new selection
  updateFunction();
});

// Update linear function values
document.getElementById("aSlider").addEventListener("input", (e) => {
  a = parseFloat(e.target.value);
  document.getElementById("aValue").textContent = a.toFixed(1);
  if (functionType === "linear") updateFunction();
});

document.getElementById("bSlider").addEventListener("input", (e) => {
  b = parseFloat(e.target.value);
  document.getElementById("bValue").textContent = b.toFixed(1);
  if (functionType === "linear") updateFunction();
});

// Update polynomial function values
document.getElementById("aSliderPoly").addEventListener("input", (e) => {
  polyA = parseFloat(e.target.value);
  document.getElementById("aPolyValue").textContent = polyA.toFixed(1);
  if (functionType === "polynomial") updateFunction();
});

document.getElementById("bSliderPoly").addEventListener("input", (e) => {
  polyB = parseFloat(e.target.value);
  document.getElementById("bPolyValue").textContent = polyB.toFixed(1);
  if (functionType === "polynomial") updateFunction();
});

document.getElementById("cSliderPoly").addEventListener("input", (e) => {
  polyC = parseFloat(e.target.value);
  document.getElementById("cPolyValue").textContent = polyC.toFixed(1);
  if (functionType === "polynomial") updateFunction();
});

// Update SVR parameters
document.getElementById("cSliderSVR").addEventListener("input", (e) => {
  C = parseFloat(e.target.value);
  document.getElementById("cSVRValue").textContent = C.toFixed(1);
  if (functionType === "svr") updateFunction();
});

document.getElementById("epsilonSliderSVR").addEventListener("input", (e) => {
  epsilon = parseFloat(e.target.value);
  document.getElementById("epsilonSVRValue").textContent = epsilon.toFixed(2);
  if (functionType === "svr") updateFunction();
});

document.getElementById("weightSliderSVR").addEventListener("input", (e) => {
  svrWeight = parseFloat(e.target.value);
  const weightValueDisplay = document.getElementById("weightSVRValue");
  if (weightValueDisplay) {
    weightValueDisplay.textContent = svrWeight.toFixed(2);
  }
  if (functionType === "svr") updateFunction();
});

document.getElementById("biasSliderSVR").addEventListener("input", (e) => {
  svrBias = parseFloat(e.target.value);
  document.getElementById("biasSVRValue").textContent = svrBias.toFixed(2);
  if (functionType === "svr") updateFunction();
});

async function fetchData(scatterData, functionType, C, epsilon) {
  // console.log("fetchData called with scatterData:", scatterData);
  content = {
    data: scatterData,
    functionType: functionType,
    C: C,
    epsilon: epsilon,
  };
  // console.log("Content to be sent:", JSON.stringify(content)); // Added logging
  try {
    const response = await fetch("http://127.0.0.1:3053/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(content),
    });
    // console.log("Response status:", response);

    const data = await response.json();
    // console.log("fetchData successful, received:", data); // Log successful response
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error; // Re-throw the error to be caught by the caller
  }
}

document.getElementById("fitDataBtn").addEventListener("click", async () => {
  try {
    console.log(typeof C, typeof epsilon);
    const result = await fetchData(scatterData, functionType, C, epsilon);
    console.log("Result from fetchData:", result);
    if (functionType === "linear") {
      b = result.weights[0];
      a = result.weights[1];
      document.getElementById("aSlider").value = a;
      document.getElementById("bSlider").value = b;
      document.getElementById("aValue").textContent = a.toFixed(1);
      document.getElementById("bValue").textContent = b.toFixed(1);
    } else if (functionType === "polynomial") {
      polyC = result.weights[0];
      polyB = result.weights[1];
      polyA = result.weights[2];
      document.getElementById("aSliderPoly").value = polyA;
      document.getElementById("bSliderPoly").value = polyB;
      document.getElementById("cSliderPoly").value = polyC;
      document.getElementById("aPolyValue").textContent = polyA.toFixed(1);
      document.getElementById("bPolyValue").textContent = polyB.toFixed(1);
      document.getElementById("cPolyValue").textContent = polyC.toFixed(1);
    } else if (functionType === "svr") {
      // result.weights[0] is model.w[0] from backend (slope for linear SVR)
      // result.weights[1] is model.b from backend (intercept for linear SVR)
      svrWeight = result.weights[0];
      svrBias = result.weights[1];

      // Update SVR Weight slider and its display
      document.getElementById("weightSliderSVR").value = svrWeight;
      const weightValueDisplay = document.getElementById("weightSVRValue");
      if (weightValueDisplay) {
        weightValueDisplay.textContent = svrWeight.toFixed(2);
      }

      // Update SVR Bias slider and its display
      document.getElementById("biasSliderSVR").value = svrBias;
      document.getElementById("biasSVRValue").textContent = svrBias.toFixed(2);

      // Clear out the old incorrect assignments to linear regression variables for SVR case
      // b = result.weights[0];
      // a = result.weights[1];
      // document.getElementById("aSlider").value = a;
      // document.getElementById("bSlider").value = b;
      // document.getElementById("aValue").textContent = a.toFixed(1);
      // document.getElementById("bValue").textContent = b.toFixed(1);
    }
    updateFunction();
  } catch (error) {
    console.error("Error in click handler:", error);
  }
});

updateFunction();
