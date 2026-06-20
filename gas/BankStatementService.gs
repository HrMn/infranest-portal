// ============================================================
// BankStatementService.gs — Reads bank statement Google Sheets
//   via file IDs configured in Config.BANK_STATEMENT_FILES.
//
// The sheet format expected is SBI account statement:
//   Header row contains "Txn Date", "Description", "Balance"
//   Data rows follow below the header row.
// ============================================================

var BankStatementService = (function () {

  var MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun',
                    'Jul','Aug','Sep','Oct','Nov','Dec'];

  // ── Helpers ───────────────────────────────────────────────

  function _findCol(headers, patterns) {
    for (var i = 0; i < headers.length; i++) {
      for (var p = 0; p < patterns.length; p++) {
        if (patterns[p].test(headers[i])) return i;
      }
    }
    return -1;
  }

  function _formatDate(d) {
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
  }

  function _pad2(n) { return String(n).length < 2 ? '0' + n : String(n); }

  function _monthKey(ddMmYyyy) {
    var m = ddMmYyyy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return m ? m[2] + '/' + m[3] : null;
  }

  function _monthLabel(key) {
    var p = key.split('/');
    return MONTH_ABBR[parseInt(p[0]) - 1] + '-' + p[1];
  }

  function _keyToSortNum(key) {
    var p = key.split('/');
    return parseInt(p[1]) * 100 + parseInt(p[0]);
  }

  function _dateToSortNum(ddMmYyyy) {
    var p = ddMmYyyy.split('/');
    return parseInt(p[2]) * 10000 + parseInt(p[1]) * 100 + parseInt(p[0]);
  }

  function _displayDate(ddMmYyyy) {
    var p = ddMmYyyy.split('/');
    return p[0] + ' ' + MONTH_ABBR[parseInt(p[1]) - 1];
  }

  // ── Sheet parsing ─────────────────────────────────────────
  // Returns { openingBalance: number|null, txns: [{date, description, debit, credit, balance}] }

  function _parseSheet(sheet) {
    try {
      if (!sheet) return { openingBalance: null, txns: [] };
      var data = sheet.getDataRange().getValues();

      // Extract FY opening balance from SBI metadata row
      var openingBalance = null;
      for (var i = 0; i < data.length; i++) {
        var cell = String(data[i][0] || '');
        if (/opening balance/i.test(cell)) {
          var metaParts = cell.split('\t');
          var val = Utils.parseNumber(metaParts[metaParts.length - 1]);
          if (val !== null) { openingBalance = val; break; }
        }
      }

      // Find header row containing "Txn Date"
      var headerIdx = -1;
      for (var i = 0; i < data.length; i++) {
        if (/txn.?date/i.test(String(data[i][0] || ''))) { headerIdx = i; break; }
        for (var j = 1; j < data[i].length; j++) {
          if (/txn.?date/i.test(String(data[i][j] || ''))) { headerIdx = i; break; }
        }
        if (headerIdx >= 0) break;
      }
      if (headerIdx === -1) return { openingBalance: openingBalance, txns: [] };

      var txns = [];
      var tabSeparated = String(data[headerIdx][0]).indexOf('\t') !== -1;

      if (tabSeparated) {
        // SBI export: all columns packed into col A as tab-separated.
        // Column order: Txn Date | Value Date | Description | Ref No. | Branch Code | Debit | Credit | Balance
        // Date is always index 0 (from left); Debit/Credit/Balance are always the last 3 (from right).
        // Description is always index 2. This stays correct even if Ref No. contains embedded tabs.
        for (var r = headerIdx + 1; r < data.length; r++) {
          var parts = String(data[r][0] || '').split('\t');
          var n = parts.length;
          if (n < 5) continue;

          var rawDt = parts[0].trim();
          var dm = rawDt.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
          if (!dm) continue;

          var rawBal    = (parts[n - 1] || '').trim();
          var rawCredit = (parts[n - 2] || '').trim();
          var rawDebit  = (parts[n - 3] || '').trim();
          var desc      = (parts[2]     || '').trim();

          var bal = Utils.parseNumber(rawBal);
          if (bal === null) continue;

          txns.push({
            date:        _pad2(dm[1]) + '/' + _pad2(dm[2]) + '/' + dm[3],
            description: desc,
            debit:       Utils.parseNumber(rawDebit),
            credit:      Utils.parseNumber(rawCredit),
            balance:     bal,
          });
        }
      } else {
        // Standard multi-column format
        var headers   = data[headerIdx].map(function (h) { return String(h || '').trim(); });
        var dateCol   = _findCol(headers, [/txn.?date/i, /^date$/i, /trans.*date/i]);
        var descCol   = _findCol(headers, [/description/i, /particulars/i, /narration/i]);
        var debitCol  = _findCol(headers, [/debit/i, /^dr$/i, /withdrawal/i]);
        var creditCol = _findCol(headers, [/credit/i, /^cr$/i, /deposit/i]);
        var balCol    = _findCol(headers, [/^balance$/i, /closing/i]);
        if (dateCol === -1 || balCol === -1) return { openingBalance: openingBalance, txns: [] };

        for (var r = headerIdx + 1; r < data.length; r++) {
          var rawDt  = data[r][dateCol];
          var rawBal = data[r][balCol];
          var dateStr = '';
          if (rawDt instanceof Date) {
            dateStr = _formatDate(rawDt);
          } else if (rawDt) {
            var s = String(rawDt).trim();
            var dm = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
            if (dm) dateStr = _pad2(dm[1]) + '/' + _pad2(dm[2]) + '/' + dm[3];
          }
          if (!dateStr) continue;
          var bal = Utils.parseNumber(rawBal);
          if (bal === null) continue;
          var desc   = descCol  >= 0 ? String(data[r][descCol]  || '').trim() : '';
          var debit  = debitCol >= 0 ? Utils.parseNumber(data[r][debitCol])   : null;
          var credit = creditCol >= 0 ? Utils.parseNumber(data[r][creditCol]) : null;
          // Skip rows with no transaction content — balance-only formula rows that carry
          // forward the last balance into unfilled rows below the actual data.
          if (!desc && debit === null && credit === null) continue;
          txns.push({
            date:        dateStr,
            description: desc,
            debit:       debit,
            credit:      credit,
            balance:     bal,
          });
        }
      }

      return { openingBalance: openingBalance, txns: txns };

    } catch (e) {
      Logger.log('BankStatementService: error parsing sheet: ' + e.message);
      return { openingBalance: null, txns: [] };
    }
  }

  // ── Public API ────────────────────────────────────────────

  function getYearlySummary() {
    var fyCodes = Config.getBankStatementFYCodes();
    var result  = [];

    fyCodes.forEach(function (fyCode) {
      var parsed = _parseSheet(Config.getBankStatementSheet(fyCode));
      if (parsed.txns.length === 0) return;
      var lastTxn = parsed.txns[parsed.txns.length - 1];
      var lp = lastTxn.date.split('/');
      result.push({
        fy:             fyCode,
        openingBalance: parsed.openingBalance,
        closingBalance: lastTxn.balance,
        lastTxnDate:    lp[0] + ' ' + MONTH_ABBR[parseInt(lp[1]) - 1] + ' ' + lp[2],
        txnCount:       parsed.txns.length,
      });
    });

    result.sort(function (a, b) { return a.fy < b.fy ? -1 : 1; });
    return { years: result };
  }

  function getFYMonthly(fyCode) {
    var parsed = _parseSheet(Config.getBankStatementSheet(fyCode));
    var txns   = parsed.txns;
    if (txns.length === 0) return { openingBalance: parsed.openingBalance, months: [] };

    var monthClosing = {};
    txns.forEach(function (t) {
      var key = _monthKey(t.date);
      if (key) monthClosing[key] = t.balance;
    });

    var sortedKeys = Object.keys(monthClosing).sort(function (a, b) {
      return _keyToSortNum(a) - _keyToSortNum(b);
    });

    var months = sortedKeys.map(function (key, idx) {
      return {
        month:          _monthLabel(key),
        monthKey:       key,
        openingBalance: idx === 0 ? parsed.openingBalance : monthClosing[sortedKeys[idx - 1]],
        closingBalance: monthClosing[key],
      };
    });

    return { openingBalance: parsed.openingBalance, months: months };
  }

  // All transactions for a given month — used for the transaction detail table
  function getFYDailyDetail(fyCode, monthKey) {
    var parsed = _parseSheet(Config.getBankStatementSheet(fyCode));

    var transactions = parsed.txns
      .filter(function (t) { return _monthKey(t.date) === monthKey; })
      .sort(function (a, b) { return _dateToSortNum(a.date) - _dateToSortNum(b.date); })
      .map(function (t) {
        return {
          date:        _displayDate(t.date),
          description: t.description,
          debit:       t.debit,
          credit:      t.credit,
          balance:     t.balance,
        };
      });

    return { transactions: transactions };
  }

  return {
    getYearlySummary: getYearlySummary,
    getFYMonthly:     getFYMonthly,
    getFYDailyDetail: getFYDailyDetail,
  };

})();
