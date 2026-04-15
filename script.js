let transactions = [];
let income = 0;
let expenses = 0;

const list = document.getElementById("list");

function addTransaction() {
    const name = document.getElementById("name").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const type = document.getElementById("type").value;
    const category = document.getElementById("category").value;

    if (!name || isNaN(amount)) return;

    // ✅ CREATE transaction object
    const transaction = {
        name,
        amount,
        type,
        category
    };

    // ✅ SAVE in array
    transactions.push(transaction);
    saveTransactions(); 

    // ✅ CREATE UI item (same as before)
    const item = document.createElement("li");
    item.textContent = `${name} - $${amount} (${type}, ${category})`;
    list.appendChild(item);

    // ✅ UPDATE totals
    if (type === "income") income += amount;
    else expenses += amount;

    updateSummary();
    updateChart();

    // clear inputs
    document.getElementById("name").value = "";
    document.getElementById("amount").value = "";
}

function updateSummary() {
    document.getElementById("income").textContent = income;
    document.getElementById("expenses").textContent = expenses;
    document.getElementById("profit").textContent = income - expenses;
}

let chart;

function updateChart() {
    const ctx = document.getElementById("chart");

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Income", "Expenses"],
            datasets: [{
                data: [income, expenses],
                backgroundColor: ["#22c55e", "#ef4444"]
            }]
        }
    });
}
function saveTransactions() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
} 
function loadTransactions() {
    const data = localStorage.getItem("transactions");

    if (data) {
        transactions = JSON.parse(data);
    }
} 
function updateChart() {
    const ctx = document.getElementById("chart");

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Income", "Expenses"],
            datasets: [{
                data: [income, expenses],
                backgroundColor: ["#22c55e", "#ef4444"]
            }]
        }
    });
}

// ✅ ADD IT RIGHT BELOW (or anywhere around here)
function displayTransactions() {
    list.innerHTML = "";

    income = 0;
    expenses = 0;

    transactions.forEach(t => {
        const item = document.createElement("li");
        item.textContent = `${t.name} - $${t.amount} (${t.type}, ${t.category})`;
        list.appendChild(item);

        if (t.type === "income") income += t.amount;
        else expenses += t.amount;
    });

    updateSummary();
    updateChart();
}

loadTransactions();
displayTransactions(); 
