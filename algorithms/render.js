let turnaroundResult = [];

import { updateTableColumns } from "../script.js";

export function renderGanttChart(options = {}, ganttChart) {
  const {
    showQueue = true,
    algorithm = "FCFS",
    containerIds = {
      head: "head",
      body: "gbody",
      tail: "tail",
      queue: "queue",
    },
  } = options;

  console.table("oo nga" + ganttChart);

  const h = document.getElementById(containerIds.head);
  const b = document.getElementById(containerIds.body);
  const t = document.getElementById(containerIds.tail);
  const q = document.getElementById(containerIds.queue);

  h.innerHTML = "";
  b.innerHTML = "";
  t.innerHTML = "";
  if (showQueue && q) q.innerHTML = "";

  const timeline = [];
  const timelineProcess = [];
  const burstDurations = [];
  const timeMarkers = [];

  renderQueueTimeline(ganttChart, q, algorithm);

  ganttChart.forEach((entry) => {
    timeline.push(entry.start);
    timelineProcess.push(entry.label);
    burstDurations.push(entry.end - entry.start);
    timeMarkers.push(entry.start);
  });

  if (ganttChart.length > 0) {
    timeMarkers.push(ganttChart[ganttChart.length - 1].end);
  }

  // Tail (Time scale)
  const allTimePoints = ganttChart.map((e) => e.start);
  allTimePoints.push(ganttChart[ganttChart.length - 1].end);
  allTimePoints.forEach((time, i) => {
    const timeDiv = document.createElement("div");
    timeDiv.classList.add("text-start", "mt-1", "ml-[-1px]");
    timeDiv.style.width = "42px";
    timeDiv.style.minWidth = "42px";
    timeDiv.innerHTML = `${time}`;
    if (i === ganttChart.length) {
      timeDiv.className =
        "border-2 border-black rounded-md bg-white text-black px-2 ml-[-4px] py-1";
      timeDiv.style.height = "fit-content";
      timeDiv.style.width = "fit-content";
    }
    t.appendChild(timeDiv);
  });

  // Body (Gantt process blocks)
  timelineProcess.forEach((label) => {
    const box = document.createElement("div");
    box.classList.add(
      "border-2",
      "border-black",
      "text-center",
      "text-black",
      "py-2"
    );
    box.style.width = "42px";
    box.style.minWidth = "42px";
    box.innerHTML = `${label}`;
    b.appendChild(box);
  });

  if (algorithm === "RR" || algorithm === "SRTF" || algorithm === "PP") {
    const headPanel = document.createElement("div");
    headPanel.classList.add("flex", "flex-col", "ml-[-6px]");

    // Headers
    const rbtHeader = document.createElement("div");
    rbtHeader.classList.add("flex", "flex-row");
    const btHeader = document.createElement("div");
    btHeader.classList.add("flex", "flex-row");

    // Header Labels
    const rbtLbl = document.createElement("div");
    rbtLbl.style.width = "42px";
    rbtLbl.style.minWidth = "42px";
    rbtLbl.innerHTML = "RBt";
    rbtHeader.appendChild(rbtLbl);

    const btLbl = document.createElement("div");
    btLbl.style.width = "42px";
    btLbl.style.minWidth = "42px";
    btLbl.innerHTML = "Bt";
    btHeader.appendChild(btLbl);

    // Build burst map for each process
    const burstDurationsMap = {};
    ganttChart.forEach((entry) => {
      if (entry.label !== "i") {
        burstDurationsMap[entry.label] ??= 0;
        burstDurationsMap[entry.label] += entry.end - entry.start - entry.rbt;
      }
    });

    // Add RBt and Bt per Gantt chart entry
    ganttChart.forEach((entry) => {
      const rbtDiv = document.createElement("div");
      rbtDiv.style.width = "42px";
      rbtDiv.style.minWidth = "42px";

      const btDiv = document.createElement("div");
      btDiv.style.width = "42px";
      btDiv.style.minWidth = "42px";

      if (entry.label === "i") {
        rbtDiv.textContent = "";
        btDiv.textContent = "1";
      } else {
        rbtDiv.textContent = entry.rbt === 0 ? "" : entry.rbt ?? "";
        btDiv.textContent = burstDurationsMap[entry.label] ?? "";
      }

      rbtHeader.appendChild(rbtDiv);
      btHeader.appendChild(btDiv);
    });

    headPanel.appendChild(rbtHeader);
    headPanel.appendChild(btHeader);
    h.appendChild(headPanel);
  } else {
    // Head (Burst Times)
    const burstLabel = document.createElement("div");
    burstLabel.style.width = "42px";
    burstLabel.innerHTML = "Bt";
    h.appendChild(burstLabel);

    burstDurations.forEach((dur) => {
      const btDiv = document.createElement("div");
      btDiv.style.width = "42px";
      btDiv.style.minWidth = "42px";

      btDiv.innerHTML = `${dur}`;
      h.appendChild(btDiv);
    });
  }
}
function renderQueueTimeline(ganttChart, q, algorithm) {
  if (!q) return;
  q.innerHTML = ""; // Clear previous timeline

  const allLabels = new Set();
  ganttChart.forEach((entry) => {
    entry.queue?.forEach((p) =>
      allLabels.add(typeof p === "object" ? p.process : p)
    );
    entry.arrived?.forEach((p) =>
      allLabels.add(typeof p === "object" ? p.process : p)
    );
  });

  const completedSet = new Set();

  ganttChart.forEach((entry) => {
    const queueDiv = document.createElement("div");
    queueDiv.classList.add("gap-2", "tracking-tighter");
    queueDiv.style.width = "42px";
    queueDiv.style.minWidth = "42px";
    queueDiv.style.display = "flex";
    queueDiv.style.flexDirection = "column";

    const renderProc = (proc) => {
      const span = document.createElement("span");
      const name = typeof proc === "object" ? proc.process : proc;
      const priority = typeof proc === "object" ? proc.priority : null;

      span.textContent = priority ? `${name}(${priority})` : name;

      if (["SRTF", "RR", "PP"].includes(algorithm)) {
        if (algorithm === "SRTF") {
          span.classList.add("left");
        }
        if (
          entry.label === name &&
          (entry.rbt === 0 || entry.rbt === null || entry.rbt === undefined) &&
          !completedSet.has(name)
        ) {
          span.classList.add("slashed");
          completedSet.add(name);
        }
      } else if (["FCFS", "SJF", "NPP"].includes(algorithm)) {
        if (entry.label === name && !completedSet.has(name)) {
          span.classList.add("slashed");
          completedSet.add(name);
        }
      }

      queueDiv.appendChild(span);
    };

    entry.queue?.forEach(renderProc);
    entry.arrived?.forEach(renderProc);

    q.appendChild(queueDiv);
  });
}

export function renderResultTableTurnaround(result) {
  const tbody = document.querySelector("#resultTable");
  tbody.innerHTML = "";

  // Sort result by process name (P1, P2...)
  result.sort((a, b) => {
    const aNum = parseInt(a.process.replace(/\D/g, ""));
    const bNum = parseInt(b.process.replace(/\D/g, ""));
    return aNum - bNum;
  });
  let process = 1; // Reset process counter for display
  let ave;
  result.forEach((r) => {
    const row = `
      
      <div class="table-row">
                  <div class="table-cell px-2 py-1 th">TT${process++}wa</div>
                  <div class="table-cell px-2 py-1 border-l-4 border-black flex flex-row">
                  ${r.completion}   -  ${r.arrival}  =   ${r.turnaround}
                  </div>
                </div>
    `;
    ave = (ave || 0) + r.turnaround;
    tbody.insertAdjacentHTML("beforeend", row);
    turnaroundResult.push(r.turnaround); // Store for later use
  });
  const ttave = `
  <div class="table-row">
                  <div class="table-cell px-2 py-1 th"></div>
                  <div class="table-cell px-2 py-1 border-t-4 border-black  flex flex-row">
                    =  ${ave}   /   ${process - 1}
                  </div>
                </div>
  `;
  tbody.insertAdjacentHTML("beforeend", ttave);
  document.getElementById("ttave").textContent =
    (ave / (process - 1)).toFixed(2) + " ms";
}

export function renderResultTableWaiting(result) {
  const tbody = document.querySelector("#resultTableWaitingTime");
  tbody.innerHTML = "";

  // Sort result by process name (P1, P2...)
  result.sort((a, b) => {
    const aNum = parseInt(a.process.replace(/\D/g, ""));
    const bNum = parseInt(b.process.replace(/\D/g, ""));
    return aNum - bNum;
  });
  let process = 1; // Reset process counter for display
  let ave;
  result.forEach((r) => {
    const row = `
      
      <div class="table-row">
                  <div class="table-cell px-2 py-1 th">WT${process++}</div>
                  <div class="table-cell px-2 py-1 border-l-4 border-black  flex flex-row">
                  ${turnaroundResult[process - 1]}   -   ${r.burst}   =   ${
      r.waiting
    }
                  </div>
                </div>
    `;
    ave = (ave || 0) + r.waiting;
    tbody.insertAdjacentHTML("beforeend", row);
    turnaroundResult.push(r.waiting); // Store for later use
  });
  const ttave = `
  <div class="table-row">
                  <div class="table-cell px-2 py-1 th"></div>
                  <div class="table-cell px-2 py-1 border-t-4 border-black flex flex-row">
                     =  ${ave}   /   ${process - 1}
                  </div>
                </div>
  `;
  tbody.insertAdjacentHTML("beforeend", ttave);
  document.getElementById("wtave").textContent =
    (ave / (process - 1)).toFixed(2) + " ms";
}

export function generateTimeline(result) {
  const timeline = document.getElementById("timeline");
  timeline.innerHTML = "";

  const vrline = document.createElement("div");
  vrline.className = "timeline-vrline";

  // Group processes by arrival time
  const grouped = {};
  result.forEach((p) => {
    if (!grouped[p.arrival]) {
      grouped[p.arrival] = [];
    }
    grouped[p.arrival].push(p.process);
  });

  // Sort by arrival time
  const sortedArrivals = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b);

  // Render grouped blocks
  sortedArrivals.forEach((arrival) => {
    const block = document.createElement("div");
    block.className = "timeline-block flex flex-col gap-2 py-1 text-center";
    block.style.width = "70px";
    block.style.maxWidth = "250px";

    block.innerHTML = `
        <div class="font-normal ps-1 text-center tracking-tighter">${grouped[
          arrival
        ].join(",")}</div>
        <div><div class="w-1/2 h-[5px] border-r-2 border-black"></div><div class="w-1/2 h-[5px] border-r-2 border-black"></div></div>
        <div class="text-center">${arrival}</div>
      `;

    timeline.appendChild(block);
  });

  timeline.appendChild(vrline);
}
export function renderCPUUtilization(totalIdle, result, ganttChart) {
  console.table(ganttChart);
  let timeline = [];
  let totalBurst = 0;

  ganttChart.forEach((p) => {
    const burst = p.end - p.start;
    timeline.push(burst);
    totalBurst += burst;
  });

  let totalBt = 0;

  result.forEach((p) => {
    totalBt += p.burst;
  });

  // Get the last end time as the total time
  const totalTime =
    ganttChart.length > 0 ? ganttChart[ganttChart.length - 1].end : 0;

  const cpuUtil =
    totalTime === 0 ? 0 : ((totalTime - totalIdle) / totalTime) * 100;

  // Update HTML content
  document.getElementById("burstt").textContent = ` ${totalBurst}`;
  document.getElementById("adds").textContent = ` ${totalBt}`;
  document.getElementById("cpuTotal").textContent = `${cpuUtil.toFixed(2)}%`;

  // Display burst times
  const timelineElement = document.getElementById("completion");
  timelineElement.textContent = `${timeline.join(" + ")}`;

  // Display number of processes (or total burst, depending on your intention)
  const processCountElement = document.getElementById("process");
  processCountElement.textContent = `${totalBt}`;
}

export function renderTableHeader(tableSelector, algorithm) {
  const thead = document.querySelector(`${tableSelector} thead`);
  if (!thead) return;

  let headerHTML = `
      <tr>
       <th class="border border-black py-2">JOBS</th>
                 <th class="border border-black py-2">JOBS</th>
                 <th class="border border-black py-2">JOBS</th>
    `;
  //   if (algorithm == "RR") {
  //     headerHTML += `<th>
  //           <div class="title-yellow flex-fill text-center">
  //            Time Quantum
  //           </div>
  //         </th>`;
  //   }
  if (algorithm === "PP" || algorithm === "NPP") {
    headerHTML += ` <th class="border border-black py-2">P</th>`;
  }

  headerHTML += `</tr>`;
  thead.innerHTML = headerHTML;
}
let processCounter = 4;

export function addRow(tableSelector, algorithm = "", isFirstRow = false) {
  const tableBody = document.querySelector(`${tableSelector} tbody`);
  const row = document.createElement("tr");

  let rowContent = `
    <td class="border border-black text-center jobs">
               P${processCounter++}
              </td>
    <td class="border border-black text-center">
                <input
                  class="input border-0 outline-0 w-full bg-transparent drop-shadow-none ps-1 ring-0 input py-2"
                  type="number" min="0"
                />
              </td>
   <td class="border border-black text-center">
                <input
                  class="input border-0 outline-0 w-full bg-transparent drop-shadow-none ps-1 ring-0 input py-2"
                  type="number" min="0"
                />
              </td>
  `;

  // Add Time Quantum column only if it's the first row and algorithm is RR
  if (algorithm === "RR" && isFirstRow) {
    rowContent += `
      
     
       <td class="border border-black text-center" class="timeQuantum-col">
                <input
                  class="input border-0 outline-0 w-full bg-transparent drop-shadow-none ps-1 ring-0 input py-2"
                  type="number" id="timeQuantum"
                  min="0"
                />
              </td>
    `;
  }

  // Add Priority column if algorithm is NPP or PP
  if (algorithm === "NPP" || algorithm === "PP") {
    rowContent += `
       <td class="border border-black text-center" class="priority-col">
                <input
                  class="input border-0 outline-0 w-full bg-transparent drop-shadow-none ring-0 ps-1 input py-2"
                  type="number"
                  min="0"
                />
              </td>
    `;
  }

  row.innerHTML = rowContent;

  tableBody.appendChild(row);
}

export function onAlgorithmChange(algorithm) {
  const tableBody = document.querySelector("#processTable tbody");
  tableBody.innerHTML = ""; // Clear previous rows
  processCounter = 1;

  // Add rows based on the original process count
  for (let i = 0; i < 3; i++) {
    addRow("#processTable", algorithm, i === 0); // Pass `true` for the first row
  }
  updateTableColumns(algorithm); // Also updates headers
}

export function deleteRow(tableSelector) {
  const tableBody = document.querySelector(`${tableSelector} tbody`);
  const rows = tableBody.querySelectorAll("tr");
  if (rows.length > 1) {
    tableBody.removeChild(rows[rows.length - 1]);
    processCounter--;
  }
}

export function getProcessData(tableSelector, mode = "priority") {
  const rows = document.querySelectorAll(`${tableSelector} tbody tr`);
  const processes = [];

  let timeQuantum = null;
  if (mode === "roundrobin") {
    const tqInput = document.getElementById("timeQuantum");
    if (tqInput) {
      const parsedTQ = parseInt(tqInput.value);
      if (!isNaN(parsedTQ) && parsedTQ > 0) {
        timeQuantum = parsedTQ;
      } else {
        console.warn("Invalid or missing time quantum input.");
      }
    }
  }

  rows.forEach((row) => {
    const name = row.querySelector(".jobs")?.textContent.trim();
    const inputs = row.querySelectorAll("input");

    const arrival = parseInt(inputs[0]?.value);
    const burst = parseInt(inputs[1]?.value);
    const extra = parseInt(inputs[2]?.value);

    if (!isNaN(arrival) && !isNaN(burst)) {
      const process = {
        process: name,
        arrival,
        burst,
      };

      if (mode === "priority" && !isNaN(extra)) {
        process.priority = extra;
      }

      processes.push(process);
    }
  });

  console.table(processes);
  console.table(timeQuantum);
  return { processes, timeQuantum }; // Always return both
}
