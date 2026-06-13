// ============================================================
// TransactionService.gs — Income_Expense sheet CRUD + analytics
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

    // Category is always derived from Particulars text (no category column in sheet)
    var category = Utils.resolveCategory(particulars, income !== null && income > 0);

    var rawDate = row[C.DATE];
    var dateStr = '';
    if (rawDate instanceof Date) {
      dateStr = Utils.formatDate(rawDate);
    } else if (rawDate) {
      dateStr = String(rawDate).trim();
    }

    var importedOnRaw = row[C.IMPORTED_ON];
    var importedOn = '';
    if (importedOnRaw instanceof Date) {
      importedOn = Utils.formatDate(importedOnRaw);
    } else if (importedOnRaw) {
      importedOn = String(importedOnRaw).trim();
    }

    return {
      rowIndex:       rowIndex,
      date:           dateStr,
      particulars:    particulars,
      expenditure:    expenditure,
      income:         income,
      paymentMode:    String(row[C.PAYMENT_MODE]    || '').trim(),
      paymentType:    String(row[C.PAYMENT_TYPE]    || '').trim(),
      apartment:      String(row[C.APARTMENT]       || '').trim(),
      receiptNo:      String(row[C.RECEIPT_NO]      || '').trim(),
      voucherNo:      String(row[C.VOUCHER_NO]      || '').trim(),
      remarks:        String(row[C.REMARKS]         || '').trim(),
      status:         String(row[C.STATUS]          || 'Pending Verification').trim() || 'Pending Verification',
      transactionId:  String(row[C.TRANSACTION_ID] || '').trim(),
      source:         String(row[C.SOURCE]          || '').trim(),
      importedBy:     String(row[C.IMPORTED_BY]     || '').trim(),
      importedOn:     importedOn,
      category:       category,
    };
  }

  // ---------------------------------------------------------------------------
  // Reads
  // ---------------------------------------------------------------------------

  function getAll(fy) {
    var sheet = _getSheet(fy);
    if (!sheet) return [];
    var data = sheet.getDataRange().getValues();
    var transactions = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[Config.IE_COLS.DATE] && !row[Config.IE_COLS.PARTICULARS]) continue;
      transactions.push(_rowToTransaction(row, i + 1));
    }
    return transactions;
  }

  function getByMonth(fy, monthLabel) {
    var all = getAll(fy);
    return all.filter(function (t) {
      if (!t.date) return false;
      var d = Utils.parseDate(t.date);
      return d && Utils.monthLabel(d) === monthLabel;
    });
  }

  // ---------------------------------------------------------------------------
  // Summary helpers — used by GAS-side report actions
  // ---------------------------------------------------------------------------

  function _buildSummary(transactions) {
    var totalIncome = 0, totalExpense = 0;
    var incomeByCategory = {}, expenseByCategory = {};

    transactions.forEach(function (t) {
      if (t.income) {
        totalIncome += t.income;
        incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.income;
      }
      if (t.expenditure) {
        totalExpense += t.expenditure;
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.expenditure;
      }
    });

    function toCategoryArray(map) {
      return Object.keys(map).map(function (cat) {
        return { category: cat, amount: Math.round(map[cat] * 100) / 100 };
      }).sort(function (a, b) { return b.amount - a.amount; });
    }

    return {
      totalIncome:        Math.round(totalIncome  * 100) / 100,
      totalExpense:       Math.round(totalExpense * 100) / 100,
      netBalance:         Math.round((totalIncome - totalExpense) * 100) / 100,
      count:              transactions.length,
      incomeByCategory:   toCategoryArray(incomeByCategory),
      expenseByCategory:  toCategoryArray(expenseByCategory),
    };
  }

  function getSummary(fy, month) {
    var txns = month ? getByMonth(fy, month) : getAll(fy);
    return _buildSummary(txns);
  }

  function getBankSummary(fy, month) {
    var txns = month ? getByMonth(fy, month) : getAll(fy);
    var bank = txns.filter(function (t) {
      return t.paymentMode !== Config.PAYMENT_MODES.CASH;
    });
    return _buildSummary(bank);
  }

  function getCashSummary(fy, month) {
    var txns = month ? getByMonth(fy, month) : getAll(fy);
    var cash = txns.filter(function (t) {
      return t.paymentMode === Config.PAYMENT_MODES.CASH;
    });
    return _buildSummary(cash);
  }

  // ---------------------------------------------------------------------------
  // Writes
  // ---------------------------------------------------------------------------

  function _generateTxnId() {
    return Utilities.getUuid();
  }

  function _buildRow(C, payload, txnId, source, email) {
    var row = new Array(15).fill('');
    row[C.DATE]           = Utils.parseDate(payload.date) || payload.date || '';
    row[C.PARTICULARS]    = payload.particulars || '';
    row[C.EXPENDITURE]    = payload.expenditure || '';
    row[C.INCOME]         = payload.income || '';
    row[C.PAYMENT_MODE]   = payload.paymentMode || '';
    row[C.PAYMENT_TYPE]   = payload.paymentType || '';
    row[C.APARTMENT]      = payload.apartment || '';
    row[C.RECEIPT_NO]     = payload.receiptNo || '';
    row[C.VOUCHER_NO]     = payload.voucherNo || '';
    row[C.REMARKS]        = payload.remarks || '';
    row[C.STATUS]         = payload.status || 'Pending Verification';
    row[C.TRANSACTION_ID] = txnId;
    row[C.SOURCE]         = source;
    row[C.IMPORTED_BY]    = email || '';
    row[C.IMPORTED_ON]    = source === Config.TXN_SOURCE.IMPORT ? new Date() : '';
    return row;
  }

  function create(fy, payload, email) {
    var sheet = _getSheet(fy);
    if (!sheet) throw new Error('Income_Expense sheet not found for ' + fy);
    var C   = Config.IE_COLS;
    var row = _buildRow(C, payload, _generateTxnId(), Config.TXN_SOURCE.MANUAL, email || '');

    // Insert in ascending date order instead of always appending
    var newDate  = Utils.parseDate(payload.date);
    var lastRow  = sheet.getLastRow();
    var insertAt = -1; // -1 = append

    if (newDate && lastRow > 1) {
      var dateVals = sheet.getRange(2, C.DATE + 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < dateVals.length; i++) {
        var existing = Utils.parseDate(dateVals[i][0]);
        if (existing && existing > newDate) {
          insertAt = i + 2; // 1-based + 1 for header
          break;
        }
      }
    }

    if (insertAt === -1) {
      sheet.appendRow(row);
      return { rowIndex: sheet.getLastRow() };
    }
    sheet.insertRowBefore(insertAt);
    sheet.getRange(insertAt, 1, 1, row.length).setValues([row]);
    return { rowIndex: insertAt };
  }

  function update(fy, rowIndex, payload) {
    var sheet = _getSheet(fy);
    if (!sheet) throw new Error('Income_Expense sheet not found for ' + fy);
    var C = Config.IE_COLS;
    // Read all 15 columns so we don't overwrite L-O metadata
    var range = sheet.getRange(rowIndex, 1, 1, 15);
    var row = range.getValues()[0];
    if (payload.date         !== undefined) row[C.DATE]         = Utils.parseDate(payload.date) || payload.date;
    if (payload.particulars  !== undefined) row[C.PARTICULARS]  = payload.particulars;
    if (payload.expenditure  !== undefined) row[C.EXPENDITURE]  = payload.expenditure;
    if (payload.income       !== undefined) row[C.INCOME]       = payload.income;
    if (payload.paymentMode  !== undefined) row[C.PAYMENT_MODE] = payload.paymentMode;
    if (payload.paymentType  !== undefined) row[C.PAYMENT_TYPE] = payload.paymentType;
    if (payload.apartment    !== undefined) row[C.APARTMENT]    = payload.apartment;
    if (payload.receiptNo    !== undefined) row[C.RECEIPT_NO]   = payload.receiptNo;
    if (payload.voucherNo    !== undefined) row[C.VOUCHER_NO]   = payload.voucherNo;
    if (payload.remarks      !== undefined) row[C.REMARKS]      = payload.remarks;
    if (payload.status       !== undefined) row[C.STATUS]       = payload.status;
    // L-O (cols 11-14) are never overwritten during an edit
    range.setValues([row]);
  }

  function remove(fy, rowIndex) {
    var sheet = _getSheet(fy);
    if (!sheet) throw new Error('Income_Expense sheet not found for ' + fy);
    sheet.deleteRow(rowIndex);
  }

  // Bulk import — called by importTransactions action.
  // rows: array of payload objects (same shape as create payload).
  // Returns { imported: N }.
  function bulkCreate(fy, rows, email) {
    var sheet = _getSheet(fy);
    if (!sheet) throw new Error('Income_Expense sheet not found for ' + fy);
    var C = Config.IE_COLS;
    var imported = 0;
    for (var i = 0; i < rows.length; i++) {
      var row = _buildRow(C, rows[i], _generateTxnId(), Config.TXN_SOURCE.IMPORT, email);
      sheet.appendRow(row);
      imported++;
    }
    return { imported: imported };
  }

  return {
    getAll:          getAll,
    getByMonth:      getByMonth,
    getSummary:      getSummary,
    getBankSummary:  getBankSummary,
    getCashSummary:  getCashSummary,
    create:          create,
    update:          update,
    remove:          remove,
    bulkCreate:      bulkCreate,
  };

})();
