// ============================================================
// FinancialSummaryService.gs — Financial_Summary sheet reads
// ============================================================
//
// Sheet layout (Financial_Summary):
//   "Overall Summary" tab:
//     B4:B* — FY label (YYYY-YYYY), rows continue until blank
//     C:E   — Opening Balance: Cash In Hand, Cash At Bank, Total
//     F:H   — Closing Balance: Cash In Hand, Cash At Bank, Total
//
//   Per-FY tabs named "FY YYYY-YYYY" (e.g. "FY 2024-2025"):
//     B4:B15  — Month name (April … March)
//     C:E     — Income: Cash In Hand, Cash At Bank, Total
//     F:H     — Expense: Cash In Hand, Cash At Bank, Total
//     Row 21  — Difference in Income/Expense (C:E)
//     Row 22  — Carry Forwarded              (C:E)
//     Row 23  — Closing Balance              (C:E)
// ============================================================

var FinancialSummaryService = (function () {

  function getOverallSummary() {
    var sheet = Config.getFinancialSummarySheet('Overall Summary');
    if (!sheet) return { rows: [] };
    var data = sheet.getDataRange().getValues();
    var rows = [];
    for (var i = 3; i < data.length; i++) {
      var fy = String(data[i][1] || '').trim();
      if (!fy) break;
      rows.push({
        fy:                fy,
        openingCashInHand: Utils.parseNumber(data[i][2]),
        openingBank:       Utils.parseNumber(data[i][3]),
        openingTotal:      Utils.parseNumber(data[i][4]),
        closingCashInHand: Utils.parseNumber(data[i][5]),
        closingBank:       Utils.parseNumber(data[i][6]),
        closingTotal:      Utils.parseNumber(data[i][7]),
      });
    }
    return { rows: rows };
  }

  function getFYDetail(fyLabel) {
    // fyLabel e.g. "2024-2025" → tab "FY 2024-2025"
    var sheet = Config.getFinancialSummarySheet('FY ' + fyLabel);
    if (!sheet) return { months: [], summary: null };
    var data = sheet.getDataRange().getValues();

    var months = [];
    for (var i = 3; i <= 14 && i < data.length; i++) {
      var month = String(data[i][1] || '').trim();
      if (!month) continue;
      months.push({
        month:             month,
        incomeCashInHand:  Utils.parseNumber(data[i][2]),
        incomeBank:        Utils.parseNumber(data[i][3]),
        incomeTotal:       Utils.parseNumber(data[i][4]),
        expenseCashInHand: Utils.parseNumber(data[i][5]),
        expenseBank:       Utils.parseNumber(data[i][6]),
        expenseTotal:      Utils.parseNumber(data[i][7]),
      });
    }

    var summary = null;
    if (data.length > 22) {
      var makeRow = function (ri) {
        return {
          cashInHand: Utils.parseNumber(data[ri][2]),
          bank:       Utils.parseNumber(data[ri][3]),
          total:      Utils.parseNumber(data[ri][4]),
        };
      };
      summary = {
        difference:     makeRow(20),
        carryForward:   makeRow(21),
        closingBalance: makeRow(22),
      };
    }

    return { months: months, summary: summary };
  }

  return {
    getOverallSummary: getOverallSummary,
    getFYDetail:       getFYDetail,
  };

})();
