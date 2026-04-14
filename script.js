let income = 0;
let expenses = 0;

const list = document.getElementById("list");

function addTransaction() {
    const name = document.getElementById("name").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const type = document.getElementById("type").value;

    if (!name || isNaN(amount)) return;

    const item = document.createElement("li");
    item.textContent = `${name} - $${amount} (${type})`;
    list.appendChild(item);

    if (type === "income") income += amount;
    else expenses += amount;

    updateSummary();
    updateChart();

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
