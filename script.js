/* =========================
   LOCALLEDGER - APP STATE
========================= */

let transactions = [];
let filterType = "all";
let chart;

/* =========================
   DOM ELEMENTS
========================= */

const list = document.getElementById("list");
const incomeEl = document.getElementById("income");
const expenseEl = document.getElementById("expenses");
const profitEl = document.getElementById("profit");
const totalTxEl = document.getElementById("totalTx");
const searchEl = document.getElementById("search");

/* =========================
   LOAD DATA
========================= */

function loadTransactions() {
    const data = localStorage.getItem("transactions");
    if (data) {
        transactions = JSON.parse(data);
    }
}

/* =========================
   SAVE DATA
========================= */

function saveTransactions() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

/* =========================
   ADD TRANSACTION
========================= */

function addTransaction() {
    const name = document.getElementById("name").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const type = document.getElementById("type").value;
    const category = document.getElementById("category").value;
    const date = document.getElementById("date").value;

    if (!name || isNaN(amount)) return;

    const transaction = {
        id: Date.now(),
        name,
        amount,
        type,
        category,
        date: date || new Date().toISOString().split("T")[0]
    };

    transactions.push(transaction);
    saveTransactions();

    clearForm();
    renderTransactions();
}

/* =========================
   DELETE TRANSACTION
========================= */

function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    renderTransactions();
}

/* =========================
   CLEAR FORM
========================= */

function clearForm() {
    document.getElementById("name").value = "";
    document.getElementById("amount").value = "";
}

/* =========================
   FILTER
========================= */

function setFilter(type) {
    filterType = type;
    renderTransactions();
}

/* =========================
   FILTER + SEARCH LOGIC
========================= */

function getFilteredTransactions() {
    const search = searchEl.value.toLowerCase();

    return transactions.filter(t => {
        const matchesType = filterType === "all" || t.type === filterType;
        const matchesSearch =
            t.name.toLowerCase().includes(search) ||
            t.category.toLowerCase().includes(search);

        return matchesType && matchesSearch;
    });
}

/* =========================
   RENDER TRANSACTIONS
========================= */

function renderTransactions() {
    list.innerHTML = "";

    const filtered = getFilteredTransactions();

    let income = 0;
    let expenses = 0;

    filtered.forEach(t => {
        if (t.type === "income") income += t.amount;
        else expenses += t.amount;

        const div = document.createElement("div");
        div.className = `transaction ${t.type}`;

        div.innerHTML = `
            <div class="tx-info">
                <div class="tx-name">${t.name}</div>
                <div class="tx-meta">
                    ${t.category} • ${t.date}
                </div>
            </div>

            <div>
                <strong>
                    ${t.type === "income" ? "+" : "-"}$${t.amount}
                </strong>
                <button onclick="deleteTransaction(${t.id})" style="margin-top:6px; background:#ef4444;">
                    Delete
                </button>
            </div>
        `;

        list.appendChild(div);
    });

    updateSummary(income, expenses, filtered.length);
updateChart(income, expenses);
checkEmptyState(filtered.length);
}

/* =========================
   SUMMARY
========================= */

function updateSummary(income, expenses, total) {
    incomeEl.textContent = `$${income}`;
    expenseEl.textContent = `$${expenses}`;
    profitEl.textContent = `$${income - expenses}`;
    totalTxEl.textContent = total;
}

/* =========================
   CHART
========================= */

function updateChart(income, expenses) {
    const ctx = document.getElementById("chart");

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Income", "Expenses"],
            datasets: [{
                data: [income, expenses],
                backgroundColor: ["#16a34a", "#dc2626"]
            }]
        }
    });
}

/* =========================
   INITIAL LOAD
========================= */

loadTransactions();
renderTransactions();

/* =========================
   LIVE SEARCH
========================= */

searchEl.addEventListener("input", renderTransactions);

function checkEmptyState(filteredLength) {
    const empty = document.getElementById("emptyState");

    if (filteredLength === 0) {
        empty.style.display = "block";
    } else {
        empty.style.display = "none";
    }
}
