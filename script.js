// ─── STATE ───────────────────────────────────────────────────────────────────
let transactions = [];
let filterType   = 'all';
let editingId    = null;
let deleteId     = null;
let monthlyChart, categoryChart, trendChart, expenseBreakdownChart;

// ─── INIT ────────────────────────────────────────────────────────────────────
function init() {
  loadData();
  setDefaultDate();
  populateYearDropdown();
  renderAll();
}

function loadData() {
  const saved = localStorage.getItem('ll_transactions');
  if (saved) transactions = JSON.parse(saved);
  const theme = localStorage.getItem('ll_theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeUI(theme);
  const bizName = localStorage.getItem('ll_bizname') || 'My Business';
  document.getElementById('businessNameDisplay').textContent = bizName;
}

function save() {
  localStorage.setItem('ll_transactions', JSON.stringify(transactions));
}

function setDefaultDate() {
  document.getElementById('txDate').value = today();
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function renderAll() {
  renderKPIs();
  renderRecentTransactions();
  renderTransactions();
  renderMonthlyChart();
  renderCategoryChart();
  renderAnalytics();
  renderInsights();
}

// ─── NAVIGATION ──────────────────────────────────────────────────────────────
function switchView(viewId, btn) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById('view-' + viewId).classList.add('active');
  if (btn) btn.classList.add('active');
  const titles = { dashboard: 'Dashboard', transactions: 'Transactions', analytics: 'Analytics', insights: 'Insights' };
  document.getElementById('topbarTitle').textContent = titles[viewId] || viewId;
  if (viewId === 'analytics') renderAnalytics();
  if (viewId === 'insights')  renderInsights();
  closeSidebarOnMobile();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

function closeSidebarOnMobile() {
  if (window.innerWidth <= 700) document.getElementById('sidebar').classList.remove('open');
}

// ─── KPIs ────────────────────────────────────────────────────────────────────
function renderKPIs() {
  const all = transactions;
  const totalIncome   = sum(all, 'income');
  const totalExpenses = sum(all, 'expense');
  const profit        = totalIncome - totalExpenses;
  const margin        = totalIncome > 0 ? ((profit / totalIncome) * 100).toFixed(1) : 0;

  const now   = new Date();
  const month = now.getMonth();
  const year  = now.getFullYear();
  const thisMonth = all.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });
  const mIncome   = sum(thisMonth, 'income');
  const mExpenses = sum(thisMonth, 'expense');

  document.getElementById('kpiIncome').textContent    = fmt(totalIncome);
  document.getElementById('kpiExpenses').textContent  = fmt(totalExpenses);
  document.getElementById('kpiProfit').textContent    = fmt(profit);
  document.getElementById('kpiTxCount').textContent   = all.length;
  document.getElementById('kpiIncomeSub').textContent   = `This month: ${fmt(mIncome)}`;
  document.getElementById('kpiExpensesSub').textContent = `This month: ${fmt(mExpenses)}`;
  document.getElementById('kpiMargin').textContent    = `Margin: ${margin}%`;
  document.getElementById('kpiTxSub').textContent     = `All time`;

  const profitEl = document.getElementById('kpiProfit');
  profitEl.style.color = profit >= 0 ? 'var(--income)' : 'var(--expense)';
}

// ─── RECENT TRANSACTIONS (Dashboard) ─────────────────────────────────────────
function renderRecentTransactions() {
  const list   = document.getElementById('recentList');
  const empty  = document.getElementById('recentEmpty');
  const recent = [...transactions].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  list.innerHTML = '';
  if (recent.length === 0) { empty.style.display = 'block'; return; }
  empty.style.display = 'none';
  recent.forEach(t => list.appendChild(buildTxItem(t)));
}

// ─── TRANSACTION LIST (Transactions view) ────────────────────────────────────
function setFilter(type, btn) {
  filterType = type;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderTransactions();
}

function getFiltered() {
  const search   = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const catF     = document.getElementById('categoryFilter')?.value || 'all';
  const sort     = document.getElementById('sortSelect')?.value || 'date-desc';

  let list = transactions.filter(t => {
    const matchType   = filterType === 'all' || t.type === filterType;
    const matchSearch = !search || t.name.toLowerCase().includes(search) || t.category.toLowerCase().includes(search) || (t.notes||'').toLowerCase().includes(search);
    const matchCat    = catF === 'all' || t.category === catF;
    return matchType && matchSearch && matchCat;
  });

  list.sort((a, b) => {
    if (sort === 'date-desc')   return new Date(b.date) - new Date(a.date);
    if (sort === 'date-asc')    return new Date(a.date) - new Date(b.date);
    if (sort === 'amount-desc') return b.amount - a.amount;
    if (sort === 'amount-asc')  return a.amount - b.amount;
    return 0;
  });

  return list;
}

function renderTransactions() {
  const container = document.getElementById('txList');
  const empty     = document.getElementById('txEmpty');
  const summaryBar= document.getElementById('txSummaryBar');
  if (!container) return;

  const filtered = getFiltered();
  container.innerHTML = '';

  if (filtered.length === 0) {
    empty.style.display = 'block';
    summaryBar.innerHTML = '';
    return;
  }
  empty.style.display = 'none';
  filtered.forEach(t => container.appendChild(buildTxItem(t, true)));

  const inc = sum(filtered, 'income');
  const exp = sum(filtered, 'expense');
  summaryBar.innerHTML = `
    <span>Showing <strong>${filtered.length}</strong> transaction${filtered.length !== 1 ? 's' : ''}</span>
    <span>Income: <strong style="color:var(--income)">${fmt(inc)}</strong></span>
    <span>Expenses: <strong style="color:var(--expense)">${fmt(exp)}</strong></span>
    <span>Net: <strong style="color:${inc-exp>=0?'var(--income)':'var(--expense)'}">${fmt(inc-exp)}</strong></span>
  `;
}

function buildTxItem(t, showActions = false) {
  const div = document.createElement('div');
  div.className = 'tx-item';
  const sign = t.type === 'income' ? '+' : '-';
  div.innerHTML = `
    <div class="tx-type-dot ${t.type}"></div>
    <div class="tx-info">
      <div class="tx-name">${escHtml(t.name)}</div>
      <div class="tx-meta">${t.category} · ${fmtDate(t.date)}${t.notes ? ' · ' + escHtml(t.notes) : ''}</div>
    </div>
    <span class="tx-badge ${t.type}">${t.type === 'income' ? 'Income' : 'Expense'}</span>
    <span class="tx-amount ${t.type}">${sign}${fmt(t.amount)}</span>
    ${showActions ? `
    <div class="tx-actions">
      <button class="tx-action-btn" onclick="openEditModal(${t.id})">Edit</button>
      <button class="tx-action-btn delete" onclick="openDeleteModal(${t.id}, '${escHtml(t.name)}')">Delete</button>
    </div>` : ''}
  `;
  return div;
}

// ─── MODAL (Add / Edit) ───────────────────────────────────────────────────────
function openModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent    = 'Add Transaction';
  document.getElementById('modalSaveBtn').textContent  = 'Add Transaction';
  document.getElementById('txName').value     = '';
  document.getElementById('txAmount').value   = '';
  document.getElementById('txNotes').value    = '';
  document.getElementById('txType').value     = 'income';
  document.getElementById('txCategory').value = 'Food';
  setDefaultDate();
  clearErrors();
  document.getElementById('modalOverlay').classList.add('open');
  setTimeout(() => document.getElementById('txName').focus(), 100);
}

function openEditModal(id) {
  const t = transactions.find(x => x.id === id);
  if (!t) return;
  editingId = id;
  document.getElementById('modalTitle').textContent   = 'Edit Transaction';
  document.getElementById('modalSaveBtn').textContent = 'Save Changes';
  document.getElementById('txName').value     = t.name;
  document.getElementById('txAmount').value   = t.amount;
  document.getElementById('txDate').value     = t.date;
  document.getElementById('txType').value     = t.type;
  document.getElementById('txCategory').value = t.category;
  document.getElementById('txNotes').value    = t.notes || '';
  clearErrors();
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  editingId = null;
}

function closeModalOnOverlay(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
}

function clearErrors() {
  document.getElementById('nameError').textContent   = '';
  document.getElementById('amountError').textContent = '';
}

function saveTransaction() {
  const name     = document.getElementById('txName').value.trim();
  const amount   = parseFloat(document.getElementById('txAmount').value);
  const date     = document.getElementById('txDate').value || today();
  const type     = document.getElementById('txType').value;
  const category = document.getElementById('txCategory').value;
  const notes    = document.getElementById('txNotes').value.trim();

  clearErrors();
  let valid = true;
  if (!name) { document.getElementById('nameError').textContent = 'Description is required.'; valid = false; }
  if (isNaN(amount) || amount <= 0) { document.getElementById('amountError').textContent = 'Enter a valid amount greater than 0.'; valid = false; }
  if (!valid) return;

  if (editingId !== null) {
    const idx = transactions.findIndex(t => t.id === editingId);
    if (idx !== -1) transactions[idx] = { ...transactions[idx], name, amount, date, type, category, notes };
    showToast('Transaction updated ✓', 'success');
  } else {
    transactions.push({ id: Date.now(), name, amount, date, type, category, notes });
    showToast('Transaction added ✓', 'success');
  }

  save();
  closeModal();
  renderAll();
}

// ─── DELETE ──────────────────────────────────────────────────────────────────
function openDeleteModal(id, name) {
  deleteId = id;
  document.getElementById('deleteTxName').textContent = name;
  document.getElementById('deleteOverlay').classList.add('open');
}

function closeDeleteModal() {
  document.getElementById('deleteOverlay').classList.remove('open');
  deleteId = null;
}

function closeDeleteOnOverlay(e) {
  if (e.target === document.getElementById('deleteOverlay')) closeDeleteModal();
}

function confirmDelete() {
  if (deleteId === null) return;
  transactions = transactions.filter(t => t.id !== deleteId);
  save();
  closeDeleteModal();
  renderAll();
  showToast('Transaction deleted.', 'error');
}

// ─── CHARTS ──────────────────────────────────────────────────────────────────
function populateYearDropdown() {
  const sel = document.getElementById('monthlyChartYear');
  if (!sel) return;
  const years = [...new Set(transactions.map(t => new Date(t.date).getFullYear()))];
  const currentYear = new Date().getFullYear();
  if (!years.includes(currentYear)) years.push(currentYear);
  years.sort((a,b) => b - a);
  sel.innerHTML = years.map(y => `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`).join('');
}

function renderMonthlyChart() {
  const sel  = document.getElementById('monthlyChartYear');
  const year = sel ? parseInt(sel.value) : new Date().getFullYear();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const incomeData  = Array(12).fill(0);
  const expenseData = Array(12).fill(0);

  transactions.forEach(t => {
    const d = new Date(t.date);
    if (d.getFullYear() !== year) return;
    if (t.type === 'income')  incomeData[d.getMonth()]  += t.amount;
    if (t.type === 'expense') expenseData[d.getMonth()] += t.amount;
  });

  const ctx = document.getElementById('monthlyChart');
  if (!ctx) return;
  if (monthlyChart) monthlyChart.destroy();

  monthlyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        { label: 'Income',   data: incomeData,  backgroundColor: 'rgba(22,163,74,0.8)',  borderRadius: 5 },
        { label: 'Expenses', data: expenseData, backgroundColor: 'rgba(220,38,38,0.8)', borderRadius: 5 }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top', labels: { font: { family: 'Inter', size: 12 }, boxWidth: 10, padding: 12 } } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 } } },
        y: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { font: { family: 'Inter', size: 11 }, callback: v => '$' + v.toLocaleString() } }
      }
    }
  });
}

function renderCategoryChart() {
  const ctx = document.getElementById('categoryChart');
  if (!ctx) return;

  const catTotals = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
  });

  const labels = Object.keys(catTotals);
  const data   = Object.values(catTotals);
  const colors = ['#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6'];

  if (categoryChart) categoryChart.destroy();

  if (labels.length === 0) {
    categoryChart = new Chart(ctx, { type: 'doughnut', data: { labels: ['No data'], datasets: [{ data: [1], backgroundColor: ['#e2e8f0'] }] }, options: { plugins: { legend: { display: false } }, cutout: '65%' } });
    document.getElementById('categoryLegend').innerHTML = '';
    return;
  }

  categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors.slice(0, labels.length), borderWidth: 2 }] },
    options: { responsive: true, cutout: '65%', plugins: { legend: { display: false } } }
  });

  const legend = document.getElementById('categoryLegend');
  legend.innerHTML = labels.map((l, i) => `
    <div class="legend-item">
      <div class="legend-dot" style="background:${colors[i]}"></div>
      <span>${l}</span>
    </div>
  `).join('');
}

// ─── ANALYTICS ───────────────────────────────────────────────────────────────
function renderAnalytics() {
  renderTrendChart();
  renderExpenseBreakdown();
  renderMonthTable();
  renderTopIncome();
}

function renderTrendChart() {
  const ctx = document.getElementById('trendChart');
  if (!ctx) return;

  const monthMap = {};
  transactions.forEach(t => {
    const key = t.date.slice(0,7);
    if (!monthMap[key]) monthMap[key] = { income: 0, expense: 0 };
    monthMap[key][t.type] += t.amount;
  });

  const keys   = Object.keys(monthMap).sort();
  const inc    = keys.map(k => monthMap[k].income);
  const exp    = keys.map(k => monthMap[k].expense);
  const labels = keys.map(k => {
    const [y,m] = k.split('-');
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m)-1] + ' ' + y.slice(2);
  });

  if (trendChart) trendChart.destroy();

  trendChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Income',   data: inc, borderColor: '#16a34a', backgroundColor: 'rgba(22,163,74,0.1)',  fill: true, tension: 0.3, pointRadius: 4 },
        { label: 'Expenses', data: exp, borderColor: '#dc2626', backgroundColor: 'rgba(220,38,38,0.1)',  fill: true, tension: 0.3, pointRadius: 4 }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top', labels: { font: { family: 'Inter', size: 12 }, boxWidth: 10 } } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 } } },
        y: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { font: { family: 'Inter', size: 11 }, callback: v => '$' + v.toLocaleString() } }
      }
    }
  });
}

function renderExpenseBreakdown() {
  const ctx = document.getElementById('expenseBreakdownChart');
  if (!ctx) return;

  const catTotals = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
  });

  const labels = Object.keys(catTotals).sort((a,b) => catTotals[b] - catTotals[a]);
  const data   = labels.map(l => catTotals[l]);
  const colors = ['#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6'];

  if (expenseBreakdownChart) expenseBreakdownChart.destroy();

  expenseBreakdownChart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ data, backgroundColor: colors.slice(0, labels.length), borderRadius: 6 }] },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { font: { family: 'Inter', size: 11 }, callback: v => '$' + v.toLocaleString() } },
        y: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 } } }
      }
    }
  });

  const legend = document.getElementById('expenseLegend');
  if (legend) legend.innerHTML = '';
}

function renderMonthTable() {
  const el = document.getElementById('monthTable');
  if (!el) return;

  const monthMap = {};
  transactions.forEach(t => {
    const key = t.date.slice(0,7);
    if (!monthMap[key]) monthMap[key] = { income: 0, expense: 0 };
    monthMap[key][t.type] += t.amount;
  });

  const keys = Object.keys(monthMap).sort().reverse().slice(0,12);
  if (keys.length === 0) { el.innerHTML = '<p style="color:var(--text-muted);font-size:13px">No data yet.</p>'; return; }

  el.innerHTML = `
    <div class="month-row header"><span>Month</span><span>Income</span><span>Expenses</span><span>Profit</span></div>
    ${keys.map(k => {
      const inc = monthMap[k].income;
      const exp = monthMap[k].expense;
      const pft = inc - exp;
      const [y,m] = k.split('-');
      const label = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m)-1] + ' ' + y;
      return `<div class="month-row">
        <span>${label}</span>
        <span style="color:var(--income)">${fmt(inc)}</span>
        <span style="color:var(--expense)">${fmt(exp)}</span>
        <span class="profit-cell ${pft >= 0 ? 'pos' : 'neg'}">${fmt(pft)}</span>
      </div>`;
    }).join('')}
  `;
}

function renderTopIncome() {
  const el = document.getElementById('topIncomeList');
  if (!el) return;

  const nameMap = {};
  transactions.filter(t => t.type === 'income').forEach(t => {
    nameMap[t.name] = (nameMap[t.name] || 0) + t.amount;
  });

  const sorted = Object.entries(nameMap).sort((a,b) => b[1]-a[1]).slice(0,8);
  if (sorted.length === 0) { el.innerHTML = '<p style="color:var(--text-muted);font-size:13px">No income recorded yet.</p>'; return; }

  const max = sorted[0][1];
  el.innerHTML = sorted.map(([name, amount], i) => `
    <div class="ranked-item">
      <div class="rank-num">${i+1}</div>
      <div class="rank-label">${escHtml(name)}</div>
      <div class="rank-bar-wrap"><div class="rank-bar" style="width:${(amount/max*100).toFixed(0)}%"></div></div>
      <div class="rank-amount">${fmt(amount)}</div>
    </div>
  `).join('');
}

// ─── INSIGHTS ────────────────────────────────────────────────────────────────
function renderInsights() {
  const el    = document.getElementById('insightsList');
  const empty = document.getElementById('insightsEmpty');
  if (!el) return;

  const insights = generateInsights();
  if (insights.length === 0) {
    el.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  el.innerHTML = insights.map(ins => `
    <div class="insight-card ${ins.type}">
      <div class="insight-icon">${ins.icon}</div>
      <div class="insight-title">${ins.title}</div>
      <div class="insight-body">${ins.body}</div>
    </div>
  `).join('');
}

function generateInsights() {
  if (transactions.length < 2) return [];
  const insights = [];

  const totalIncome   = sum(transactions, 'income');
  const totalExpenses = sum(transactions, 'expense');
  const profit        = totalIncome - totalExpenses;
  const margin        = totalIncome > 0 ? (profit / totalIncome * 100) : 0;

  // Profit margin
  if (totalIncome > 0) {
    const type = margin >= 20 ? 'good' : 'warning';
    const icon = margin >= 20 ? '🏆' : margin >= 0 ? '⚠️' : '🚨';
    insights.push({ type, icon, title: `Profit margin: ${margin.toFixed(1)}%`, body: margin >= 20 ? `Strong margins! For every dollar of income, you keep ${margin.toFixed(0)} cents after expenses.` : margin >= 0 ? `Margins are slim. Consider reducing your biggest expense categories to improve profitability.` : `You're spending more than you earn. Review expenses urgently.` });
  }

  // Month over month
  const now   = new Date();
  const thisM = monthlyData(now.getFullYear(), now.getMonth());
  const lastDate = new Date(now.getFullYear(), now.getMonth() - 1);
  const lastM = monthlyData(lastDate.getFullYear(), lastDate.getMonth());

  if (lastM.income > 0 || lastM.expense > 0) {
    const incGrowth = lastM.income > 0 ? ((thisM.income - lastM.income) / lastM.income * 100) : 0;
    if (Math.abs(incGrowth) > 5) {
      insights.push({
        type: incGrowth > 0 ? 'good' : 'warning',
        icon: incGrowth > 0 ? '📈' : '📉',
        title: `Income ${incGrowth > 0 ? 'up' : 'down'} ${Math.abs(incGrowth).toFixed(0)}% vs last month`,
        body: incGrowth > 0 ? `Great momentum! Your income grew from ${fmt(lastM.income)} to ${fmt(thisM.income)} this month.` : `Income dipped compared to last month (${fmt(lastM.income)} → ${fmt(thisM.income)}). Investigate what changed.`
      });
    }
    const expGrowth = lastM.expense > 0 ? ((thisM.expense - lastM.expense) / lastM.expense * 100) : 0;
    if (Math.abs(expGrowth) > 10) {
      insights.push({
        type: expGrowth > 10 ? 'warning' : 'good',
        icon: expGrowth > 10 ? '💸' : '✂️',
        title: `Expenses ${expGrowth > 0 ? 'rose' : 'fell'} ${Math.abs(expGrowth).toFixed(0)}% vs last month`,
        body: expGrowth > 0 ? `Expenses jumped from ${fmt(lastM.expense)} to ${fmt(thisM.expense)}. Check which categories drove the increase.` : `You cut costs this month — from ${fmt(lastM.expense)} to ${fmt(thisM.expense)}. Great discipline!`
      });
    }
  }

  // Biggest expense category
  const catTotals = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
  });
  const biggestCat = Object.entries(catTotals).sort((a,b) => b[1]-a[1])[0];
  if (biggestCat) {
    const pct = totalExpenses > 0 ? (biggestCat[1] / totalExpenses * 100).toFixed(0) : 0;
    insights.push({ type: 'info', icon: '🔍', title: `${biggestCat[0]} is your biggest cost (${pct}%)`, body: `You've spent ${fmt(biggestCat[1])} on ${biggestCat[0]}, which is ${pct}% of total expenses. ${pct > 40 ? 'This is quite concentrated — consider whether there are savings to find here.' : 'A well-distributed expense profile.'}` });
  }

  // Transaction frequency
  const avgPerMonth = transactions.length / Math.max(uniqueMonths().length, 1);
  insights.push({ type: 'neutral', icon: '📋', title: `${avgPerMonth.toFixed(0)} transactions per month on average`, body: `You log ${avgPerMonth.toFixed(1)} entries per month. Consistent logging helps you catch trends early and gives you better data for decisions.` });

  // Best month
  const monthMap = {};
  transactions.forEach(t => {
    const key = t.date.slice(0,7);
    if (!monthMap[key]) monthMap[key] = { income: 0, expense: 0 };
    monthMap[key][t.type] += t.amount;
  });
  const bestMonth = Object.entries(monthMap).map(([k,v]) => ({ month: k, profit: v.income - v.expense })).sort((a,b) => b.profit - a.profit)[0];
  if (bestMonth && bestMonth.profit > 0) {
    const [y,m] = bestMonth.month.split('-');
    const label = ['January','February','March','April','May','June','July','August','September','October','November','December'][parseInt(m)-1] + ' ' + y;
    insights.push({ type: 'good', icon: '🌟', title: `Best month: ${label}`, body: `Your most profitable month generated a net profit of ${fmt(bestMonth.profit)}. Use it as a benchmark to aim for.` });
  }

  // Cash flow warning
  if (profit < 0 && transactions.length > 5) {
    insights.push({ type: 'warning', icon: '⚠️', title: `Negative overall cash flow`, body: `Total expenses exceed total income by ${fmt(Math.abs(profit))}. If this continues, it may strain your operations. Focus on either growing income or cutting costs.` });
  }

  return insights;
}

function monthlyData(year, month) {
  const filtered = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  return { income: sum(filtered, 'income'), expense: sum(filtered, 'expense') };
}

function uniqueMonths() {
  return [...new Set(transactions.map(t => t.date.slice(0,7)))];
}

// ─── EXPORT CSV ──────────────────────────────────────────────────────────────
function exportCSV() {
  if (transactions.length === 0) { showToast('No transactions to export.', 'error'); return; }
  const headers = ['Date', 'Description', 'Type', 'Category', 'Amount', 'Notes'];
  const rows = transactions
    .sort((a,b) => new Date(a.date) - new Date(b.date))
    .map(t => [t.date, `"${t.name.replace(/"/g,'""')}"`, t.type, t.category, t.amount.toFixed(2), `"${(t.notes||'').replace(/"/g,'""')}"`]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `localledger-${today()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV exported ✓', 'success');
}

// ─── THEME ───────────────────────────────────────────────────────────────────
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next    = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('ll_theme', next);
  updateThemeUI(next);
}

function updateThemeUI(theme) {
  const icon  = document.getElementById('themeIcon');
  const label = document.getElementById('themeLabel');
  if (icon)  icon.textContent  = theme === 'dark' ? '☀️' : '🌙';
  if (label) label.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
}

// ─── TOAST ───────────────────────────────────────────────────────────────────
function showToast(msg, type = '') {
  const container = document.getElementById('toastContainer');
  const toast     = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function sum(arr, type) {
  return arr.filter(t => t.type === type).reduce((acc, t) => acc + t.amount, 0);
}

function fmt(n) {
  return '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── KEYBOARD SHORTCUTS ───────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closeDeleteModal(); }
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    if (document.getElementById('modalOverlay').classList.contains('open')) saveTransaction();
  }
});

// ─── START ───────────────────────────────────────────────────────────────────
init();

function resetData() {
  if (confirm('Delete ALL transactions and start fresh? This cannot be undone.')) {
    transactions = [];
    save();
    renderAll();
    populateYearDropdown();
    showToast('All data cleared.', 'error');
  }
}
