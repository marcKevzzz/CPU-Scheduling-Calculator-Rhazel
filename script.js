import {
  renderResultTableTurnaround,
  renderResultTableWaiting,
  renderGanttChart,
  generateTimeline,
  renderCPUUtilization,
  getProcessData,
  addRow,
  deleteRow,
  onAlgorithmChange,
  resetUI,
} from "./algorithms/render.js";

import { calculateFCFS } from "./algorithms/fcfs.js";
import { calculateSJF } from "./algorithms/sjf.js";
import { calculateNPP } from "./algorithms/npp.js";
import { calculateRR } from "./algorithms/rr.js";
import { calculateSRTF } from "./algorithms/srtf.js";
import { calculatePP } from "./algorithms/pp.js";

function scheduleAndRender(algorithm, options = {}, mode) {
  const { processes, timeQuantum } = getProcessData("#processTable", mode);
  if (!processes || !processes.length) return;

  try {
    const output =
      options.algorithm === "RR"
        ? algorithm(processes, timeQuantum)
        : algorithm(processes);

    const { result, totalTime, totalIdle, ganttChart } = output;

    renderResultTableTurnaround(result);
    renderResultTableWaiting(result);
    renderGanttChart(options, ganttChart);
    generateTimeline(result);
    renderCPUUtilization(totalIdle, result, ganttChart);
  } catch (error) {
    console.error("Error during scheduling or rendering:", error);
  }
}

export function updateTableColumns(selectedValue) {
  const table = document.getElementById("processTable");
  const headerRow = table.querySelector("thead tr");
  const bodyRows = table.querySelectorAll("tbody tr");

  const hasPriorityColumn = table.querySelector("th.priority-col");
  const hasTimeQuantumColumn = table.querySelector("th.timeQuantum-col");

  const needsPriority = selectedValue === "NPP" || selectedValue === "PP";
  const needsTimeQuantum = selectedValue === "RR";

  // Remove Priority column if not needed
  if (!needsPriority && hasPriorityColumn) {
    hasPriorityColumn.remove();
    bodyRows.forEach((row) => {
      const priorityCell = row.querySelector("td.priority-col");
      if (priorityCell) priorityCell.remove();
    });
  }

  // Remove Time Quantum column if not needed
  if (!needsTimeQuantum && hasTimeQuantumColumn) {
    hasTimeQuantumColumn.remove();
    bodyRows.forEach((row) => {
      const tqCell = row.querySelector("td.timeQuantum-col");
      if (tqCell) tqCell.remove();
    });
  }

  // Add Priority column if needed and not already present
  if (needsPriority && !hasPriorityColumn) {
    const priorityHeader = document.createElement("th");
    priorityHeader.classList.add("priority-col");
    priorityHeader.innerHTML = `   <th class="border border-black">P</th>`;
    headerRow.appendChild(priorityHeader);

    bodyRows.forEach((row) => {
      const newCell = document.createElement("td");
      newCell.classList.add("priority-col");
      newCell.innerHTML = `  <input
                  class="input border-0 outline-0 w-full bg-transparent drop-shadow-none ring-0 ps-1 input py-1"
                  type="number"
                  min="0"
                />`;
      row.appendChild(newCell);
    });
  }

  // Add Time Quantum column if needed and not already present (as last column)
  if (needsTimeQuantum && !hasTimeQuantumColumn) {
    const tqHeader = document.createElement("th");
    tqHeader.classList.add("timeQuantum-col", "border", "border-black", "py-2");
    tqHeader.innerHTML = `TQ`;
    headerRow.appendChild(tqHeader);
  }
}
let algorithmValue = "";
const radioButtons = document.querySelectorAll("input[type='radio']");
radioButtons.forEach((radio) => {
  radio.addEventListener("change", () => {
    updateTableColumns(radio.value);
    algorithmValue = radio.value;
    onAlgorithmChange(radio.value);
    selectLbl.classList.remove("hide");
    selectLbl.textContent = `${algorithmValue} SELECTED!`;
  });
});

// // Initial check
// document.addEventListener("DOMContentLoaded", () => {
//   const selectedRadio = document.querySelector("input[type='radio']:checked");
// });

function validateTableInputs(algorithm, options = {}, mode) {
  let invalid = false;
  let firstInvalidInput = null;

  // Get all number inputs inside the table
  const inputs = document.querySelectorAll(
    "#processTable input[type='number']"
  );

  invalid = [...inputs].some((input) => {
    if (!input.value) {
      input.classList.add("is-invalid");
      if (!firstInvalidInput) {
        firstInvalidInput = input;
      }
      return true; // Stop as soon as one invalid input is found
    }
    input.classList.remove("is-invalid");
    return false;
  });

  if (invalid) {
    firstInvalidInput.scrollIntoView({ behavior: "smooth", block: "center" });
    firstInvalidInput.focus();

    showToast("Invalid Input");
    return false;
  }

  // If valid, run your computation
  const hide = document.querySelectorAll(".hide");
  hide.forEach((h) => {
    h.classList.remove("hide");
  });
  showToast(`Calculate Successful`, true);

  scheduleAndRender(algorithm, options, mode);
}

// function resetUIS() {
//   ["head", "gbody", "tail", "queue", "turnaroundTable", "waitingTable"].forEach(
//     (id) => {
//       const el = document.getElementById(id);
//       if (el) el.innerHTML = "";
//     }
//   );
// }

document.addEventListener("DOMContentLoaded", function () {
  const addRowBtn = document.getElementById("addRow");
  if (addRowBtn) {
    addRowBtn.addEventListener("click", () => {
      addRow("#processTable", algorithmValue);
    });
  }

  const clearBtn = document.getElementById("clear");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      // Reset algorithm value and radio buttons FIRST
      algorithmValue = "";
      document.querySelectorAll("input[type='radio']").forEach((radio) => {
        radio.checked = false;
      });

      // Hide or reset selectLbl
      const selectLbl = document.getElementById("selectLbl");
      if (selectLbl) {
        selectLbl.textContent = "";
        selectLbl.classList.add("hide");
      }

      // THEN reset UI (now that algorithmValue is cleared or defaulted)
      resetUI(algorithmValue);
      showToast("Calculation restart!", true);
    });
  }

  const deleteRowBtn = document.getElementById("deleteRow");
  if (deleteRowBtn) {
    deleteRowBtn.addEventListener("click", () => {
      deleteRow("#processTable");
    });
  }
  const selectLbl = document.getElementById("selectLbl");
  const calculate = document.getElementById("calculate");
  calculate.addEventListener("click", () => {
    if (!algorithmValue) {
      showToast("Select an algorithm");
      return false;
    }
    console.log(algorithmValue);
    switch (algorithmValue) {
      case "FCFS":
        validateTableInputs(calculateFCFS, {
          showQueue: true,
          algorithm: "FCFS",
        });

        break;

      case "SJF":
        validateTableInputs(calculateSJF, {
          showQueue: true,
          algorithm: "SJF",
        });
        break;

      case "NPP":
        validateTableInputs(
          calculateNPP,
          {
            showQueue: true,
            algorithm: "NPP",
          },
          "priority"
        );
        break;

      case "PP":
        validateTableInputs(
          calculatePP,
          {
            showQueue: true,
            algorithm: "PP",
          },
          "priority"
        );
        break;

      case "SRTF":
        validateTableInputs(calculateSRTF, {
          showQueue: true,
          algorithm: "SRTF",
        });
        break;

      case "RR":
        validateTableInputs(
          calculateRR,
          {
            showQueue: true,
            algorithm: "RR",
          },
          "roundrobin"
        );

        // validateTableInputs(calculateSRTF, {
        //   showQueue: true,
        //   algorithm: "SRTF",
        // });
        break;
      default:
        selectLbl.classList.add("hidden");
        break;
    }
  });
  document.getElementById("hideToast").addEventListener("click", (b) => {
    hideToast();
  });
});

let toastTimeout;

export function showToast(message, bool = false) {
  const toastLbl = document.getElementById("toastLbl");
  const toast = document.getElementById("toast-danger");
  if (bool) {
    const yes = document.getElementById("success");
    yes.classList.remove("hide");
    document.getElementById("no").classList.add("hide");
  } else {
    const no = document.getElementById("no");
    no.classList.remove("hide");
    document.getElementById("success").classList.add("hide");
  }

  // Set message
  toastLbl.textContent = message;

  // Show toast
  toast.classList.remove("hidden", "opacity-0");
  toast.classList.add("opacity-100");

  // Auto hide after 3s
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    hideToast();
  }, 3000);
}

function hideToast() {
  const toast = document.getElementById("toast-danger");
  toast.classList.add("opacity-0");

  setTimeout(() => {
    toast.classList.add("hidden");
  }, 100); // Match duration-300
}
