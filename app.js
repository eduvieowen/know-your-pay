
const HOURLY_RATE = 17.20;
const CPP_RATE = 0.0595;
const EI_RATE = 0.0166;
const CPP_EXEMPTION = 3500;
const FEDERAL_BRACKETS = [
  { upTo: 55867, rate: 0.15 },
  { upTo: 111733, rate: 0.205 },
  { upTo: 173205, rate: 0.26 },
  { upTo: 246752, rate: 0.29 },
  { upTo: Infinity, rate: 0.33 }
];
const ONTARIO_BRACKETS = [
  { upTo: 51446, rate: 0.0505 },
  { upTo: 102894, rate: 0.0915 },
  { upTo: 150000, rate: 0.1116 },
  { upTo: 220000, rate: 0.1216 },
  { upTo: Infinity, rate: 0.1316 }
];

function calcTax(income, brackets) {
  let tax = 0, prev = 0;
  for (let b of brackets) {
    if (income > b.upTo) {
      tax += (b.upTo - prev) * b.rate;
      prev = b.upTo;
    } else {
      tax += (income - prev) * b.rate;
      break;
    }
  }
  return tax;
}

function getPayPeriodEnd(today = new Date()) {
  const day = today.getDay();
  const daysUntilFriday = (5 - day + 7) % 7;
  const thisFriday = new Date(today);
  thisFriday.setDate(today.getDate() + daysUntilFriday);
  return thisFriday;
}

function isInCurrentPayPeriod(dateStr) {
  const d = new Date(dateStr);
  const end = getPayPeriodEnd();
  const start = new Date(end);
  start.setDate(end.getDate() - 13);
  return d >= start && d <= end;
}

function saveShifts(shifts) {
  localStorage.setItem("kyp_shifts", JSON.stringify(shifts));
}

function loadShifts() {
  return JSON.parse(localStorage.getItem("kyp_shifts") || "[]");
}

function updateShiftList() {
  const list = document.getElementById("shiftList");
  list.innerHTML = "";
  const shifts = loadShifts().filter(s => isInCurrentPayPeriod(s.date));
  shifts.forEach(s => {
    const li = document.createElement("li");
    li.textContent = `${s.date}: ${s.hours.toFixed(2)} hrs`;
    list.appendChild(li);
  });
}

function calculateAndDisplayPay() {
  const shifts = loadShifts().filter(s => isInCurrentPayPeriod(s.date));
  const hours = shifts.reduce((sum, s) => sum + s.hours, 0);
  const gross = hours * HOURLY_RATE;
  const cpp = Math.max(0, (gross - (CPP_EXEMPTION / 26)) * CPP_RATE);
  const ei = gross * EI_RATE;
  const fedTax = calcTax(gross * 26, FEDERAL_BRACKETS) / 26;
  const onTax = calcTax(gross * 26, ONTARIO_BRACKETS) / 26;
  const net = gross - cpp - ei - fedTax - onTax;

  document.getElementById("result").innerText =
    `Hours: ${hours.toFixed(2)}
Gross: $${gross.toFixed(2)}
CPP: $${cpp.toFixed(2)}
EI: $${ei.toFixed(2)}
Fed Tax: $${fedTax.toFixed(2)}
ON Tax: $${onTax.toFixed(2)}
Net: $${net.toFixed(2)}`;
}

document.getElementById("shift-form").addEventListener("submit", e => {
  e.preventDefault();
  const date = document.getElementById("date").value;
  const start = document.getElementById("clockIn").value;
  const end = document.getElementById("clockOut").value;
  const breakMin = parseInt(document.getElementById("break").value) || 0;

  const s = new Date(date + "T" + start);
  const eTime = new Date(date + "T" + end);
  let mins = (eTime - s) / 60000 - breakMin;
  if (mins < 0) mins = 0;
  const hours = mins / 60;

  const shifts = loadShifts();
  shifts.push({ date, hours });
  saveShifts(shifts);
  updateShiftList();
  calculateAndDisplayPay();
  e.target.reset();
});

document.getElementById("reset").addEventListener("click", () => {
  if (confirm("Clear all stored shifts?")) {
    saveShifts([]);
    updateShiftList();
    calculateAndDisplayPay();
  }
});

updateShiftList();
calculateAndDisplayPay();
