let income = 0;
let expenses = 0;

function addTransaction() {
    const name = document.getElementById("name").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const type = document.getElementById("type").value;

    if (!name || isNaN(amount)) return;

    const list = document.getElementById("list");
    const item = document.createElement("li");
    item.textContent = `${name} - $${amount} (${type})`;
    list.appendChild(item);

    if (type === "income") {
        income += amount;
    } else {
        expenses += amount;
    }

    updateSummary();

    document.getElementById("name").value = "";
    document.getElementById("amount").value = "";
}

function updateSummary() {
    document.getElementById("income").textContent = income;
    document.getElementById("expenses").textContent = expenses;
    document.getElementById("profit").textContent = income - expenses;
}
