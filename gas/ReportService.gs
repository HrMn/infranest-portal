// ============================================================
// ReportService.gs — Dashboard summaries and report aggregations
// ============================================================

var ReportService = (function () {

  // Build a full monthly breakdown for a given FY
  function _getMonthlyBreakdown(fy) {
    var transactions = TransactionService.getAll(fy);
    var byMonth = {};

    transactions.forEach(function (t) {
      if (!t.date) return;
      var d = Utils.parseDate(t.date);
      if (!d) return;
      var label = Utils.monthLabel(d);
      if (!byMonth[label]) byMonth[label] = { income: 0, expense: 0 };
      byMonth[label].income  += t.income      || 0;
      byMonth[label].expense += t.expenditure || 0;
    });

    return byMonth;
  }

  // Aggregate transactions into category totals
  function _categoryBreakdown(transactions, isIncome) {
    var totals = {};
    var grandTotal = 0;

    transactions.forEach(function (t) {
      var amount = isIncome ? (t.income || 0) : (t.expenditure || 0);
      if (!amount) return;
      var cat = t.category || (isIncome ? 'Other Income' : 'Miscellaneous');
      totals[cat] = (totals[cat] || 0) + amount;
      grandTotal += amount;
    });

    return Object.keys(totals).map(function (cat) {
      return {
        category:   cat,
        amount:     Math.round(totals[cat] * 100) / 100,
        percentage: grandTotal ? Math.round((totals[cat] / grandTotal) * 1000) / 10 : 0,
      };
    }).sort(function (a, b) { return b.amount - a.amount; });
  }

  // ----------------------------------------------------------------
  // getDashboardSummary — main dashboard payload
  // ----------------------------------------------------------------
  function getDashboardSummary(fy, requestedMonth) {
    var transactions = TransactionService.getAll(fy);

    // Determine current month
    var currentMonth = requestedMonth;
    if (!currentMonth) {
      var now = new Date();
      currentMonth = Utils.monthLabel(now);
    }

    // Current month transactions
    var currentMonthTxns = transactions.filter(function (t) {
      if (!t.date) return false;
      var d = Utils.parseDate(t.date);
      return d && Utils.monthLabel(d) === currentMonth;
    });

    var currentIncome  = Utils.sum(currentMonthTxns.map(function (t) { return t.income || 0; }));
    var currentExpense = Utils.sum(currentMonthTxns.map(function (t) { return t.expenditure || 0; }));

    // Monthly trend — last 6 months
    var byMonth = _getMonthlyBreakdown(fy);
    var allMonths = Object.keys(byMonth).sort(function (a, b) {
      return new Date('01-' + a) - new Date('01-' + b);
    });
    var trendMonths = allMonths.slice(-6);
    var monthlyTrend = trendMonths.map(function (m) {
      var d = byMonth[m];
      return {
        month:   m,
        income:  Math.round(d.income * 100) / 100,
        expense: Math.round(d.expense * 100) / 100,
        surplus: Math.round((d.income - d.expense) * 100) / 100,
      };
    });

    // Category breakdowns (full FY)
    var incomeBreakdown  = _categoryBreakdown(transactions, true);
    var expenseBreakdown = _categoryBreakdown(transactions, false);

    // MMC collection
    var mmcStatus = MMCService.getStatus(fy);
    var mmcSummary = mmcStatus.summary || {};

    return {
      currentMonth: {
        label:   currentMonth,
        income:  Math.round(currentIncome * 100) / 100,
        expense: Math.round(currentExpense * 100) / 100,
        surplus: Math.round((currentIncome - currentExpense) * 100) / 100,
      },
      mmcCollection: {
        collected:  mmcSummary.collectedThisMonth || 0,
        total:      mmcSummary.occupiedApartments || 0,
        percentage: mmcSummary.collectionRateThisMonth || 0,
      },
      monthlyTrend:     monthlyTrend,
      incomeBreakdown:  incomeBreakdown,
      expenseBreakdown: expenseBreakdown,
    };
  }

  // ----------------------------------------------------------------
  // getMonthlyReport — full FY month-by-month ledger
  // ----------------------------------------------------------------
  function getMonthlyReport(fy) {
    var byMonth = _getMonthlyBreakdown(fy);
    var allMonths = Object.keys(byMonth).sort(function (a, b) {
      return new Date('01 ' + a) - new Date('01 ' + b);
    });

    var cumulative = 0;
    var totalIncome = 0, totalExpense = 0;

    var rows = allMonths.map(function (m) {
      var d = byMonth[m];
      var surplus = d.income - d.expense;
      cumulative += surplus;
      totalIncome  += d.income;
      totalExpense += d.expense;
      return {
        month:             m,
        income:            Math.round(d.income * 100) / 100,
        expense:           Math.round(d.expense * 100) / 100,
        surplus:           Math.round(surplus * 100) / 100,
        cumulativeBalance: Math.round(cumulative * 100) / 100,
      };
    });

    return {
      fy: fy,
      rows: rows,
      totals: {
        income:  Math.round(totalIncome * 100) / 100,
        expense: Math.round(totalExpense * 100) / 100,
        surplus: Math.round((totalIncome - totalExpense) * 100) / 100,
      },
    };
  }

  // ----------------------------------------------------------------
  // getIncomeBreakdown / getExpenseBreakdown — for report tabs
  // ----------------------------------------------------------------
  function getIncomeBreakdown(fy) {
    var transactions = TransactionService.getAll(fy);
    return _categoryBreakdown(transactions, true);
  }

  function getExpenseBreakdown(fy) {
    var transactions = TransactionService.getAll(fy);
    return _categoryBreakdown(transactions, false);
  }

  return {
    getDashboardSummary: getDashboardSummary,
    getMonthlyReport: getMonthlyReport,
    getIncomeBreakdown: getIncomeBreakdown,
    getExpenseBreakdown: getExpenseBreakdown,
  };

})();
