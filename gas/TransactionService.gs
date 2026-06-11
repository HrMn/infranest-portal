// ============================================================
// TransactionService.gs — Income_Expense sheet CRUD
// ============================================================

var TransactionService = (function () {

  function _getSheet(fy) {
    return Config.getFinancialsSheet(fy, Config.TABS.INCOME_EXPENSE);
  }

  function _rowToTransaction(row, rowIndex) {
    var C = Config.IE_COLS;
    var expenditure = Utils.parseNumber(row[C.EXPENDITURE]);
    var income      = Utils.parseNumber(row[C.INCOME]);
    var particulars = String(row[C.PARTICULARS] || '').trim();

    // Resolve category: use explicit column if it exists, else derive from particulars
    var category = String(row[C.CATEGORY] || '').trim();
    if (!category) {
      category = Utils.resolveCategory(particulars, income !== null && income > 0);
    }

    var rawDate = row[C.DATE];
    var dateStr = '';
    if (rawDate instanceof Date) {
      dateStr = Utils.formatDate(rawDate);
    } else if (rawDate) {
      dateStr = String(rawDate).trim();
    }

    return {
      rowIndex:    rowIndex,
      date:        dateStr,
      particulars: particulars,
      expenditure: expenditure,
      income:      income,
      paymentMode: String(row[C.PAYMENT_MODE] || '').trim(),
      paymentType: String(row[C.PAYMENT_TYPE] || '').trim(),
      apartment:   String(row[C.APARTMENT]    || '').trim(),
      receiptNo:   String(row[C.RECEIPT_NO]   || '').trim(),
      voucherNo:   String(row[C.VOUCHER_NO]   || '').trim(),
      remarks:     String(row[C.REMARKS]      || '').trim(),
      category:    category,
    };
  }

  function getAll(fy) {
    var sheet = _getSheet(fy);
    if (!sheet) return [];
    var data = sheet.getDataRange().getValues();
    var transactions = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      // Skip empty rows
      if (!row[Config.IE_COLS.DATE] && !row[Config.IE_COLS.PARTICULARS]) continue;
      transactions.push(_rowToTransaction(row, i + 1));
    }
    return transactions;
  }

  function getByMonth(fy, monthLabel) {
    // monthLabel: "Apr-2026"
    var all = getAll(fy);
    return all.filter(function (t) {
      if (!t.date) return false;
      var d = Utils.parseDate(t.date);
      return d && Utils.monthLabel(d) === monthLabel;
    });
  }

  function create(fy, payload) {
    var sheet = _getSheet(fy);
    if (!sheet) throw new Error('Income_Expense sheet not found for ' + fy);
    var C = Config.IE_COLS;
    var newRow = [];
    newRow[C.DATE]         = payload.date;
    newRow[C.PARTICULARS]  = payload.particulars;
    newRow[C.EXPENDITURE]  = payload.expenditure || '';
    newRow[C.INCOME]       = payload.income || '';
    newRow[C.PAYMENT_MODE] = payload.paymentMode || '';
    newRow[C.PAYMENT_TYPE] = payload.paymentType || '';
    newRow[C.APARTMENT]    = payload.apartment || '';
    newRow[C.RECEIPT_NO]   = payload.receiptNo || '';
    newRow[C.VOUCHER_NO]   = payload.voucherNo || '';
    newRow[C.REMARKS]      = payload.remarks || '';
    newRow[C.CATEGORY]     = payload.category || '';
    sheet.appendRow(newRow);
    return { rowIndex: sheet.getLastRow() };
  }

  function update(fy, rowIndex, payload) {
    var sheet = _getSheet(fy);
    if (!sheet) throw new Error('Income_Expense sheet not found for ' + fy);
    var C = Config.IE_COLS;
    var range = sheet.getRange(rowIndex, 1, 1, 11);
    var row = range.getValues()[0];
    row[C.DATE]         = payload.date         !== undefined ? payload.date         : row[C.DATE];
    row[C.PARTICULARS]  = payload.particulars  !== undefined ? payload.particulars  : row[C.PARTICULARS];
    row[C.EXPENDITURE]  = payload.expenditure  !== undefined ? payload.expenditure  : row[C.EXPENDITURE];
    row[C.INCOME]       = payload.income       !== undefined ? payload.income       : row[C.INCOME];
    row[C.PAYMENT_MODE] = payload.paymentMode  !== undefined ? payload.paymentMode  : row[C.PAYMENT_MODE];
    row[C.PAYMENT_TYPE] = payload.paymentType  !== undefined ? payload.paymentType  : row[C.PAYMENT_TYPE];
    row[C.APARTMENT]    = payload.apartment    !== undefined ? payload.apartment    : row[C.APARTMENT];
    row[C.RECEIPT_NO]   = payload.receiptNo    !== undefined ? payload.receiptNo    : row[C.RECEIPT_NO];
    row[C.VOUCHER_NO]   = payload.voucherNo    !== undefined ? payload.voucherNo    : row[C.VOUCHER_NO];
    row[C.REMARKS]      = payload.remarks      !== undefined ? payload.remarks      : row[C.REMARKS];
    row[C.CATEGORY]     = payload.category     !== undefined ? payload.category     : row[C.CATEGORY];
    range.setValues([row]);
  }

  function remove(fy, rowIndex) {
    var sheet = _getSheet(fy);
    if (!sheet) throw new Error('Income_Expense sheet not found for ' + fy);
    sheet.deleteRow(rowIndex);
  }

  return {
    getAll: getAll,
    getByMonth: getByMonth,
    create: create,
    update: update,
    remove: remove,
  };

})();
