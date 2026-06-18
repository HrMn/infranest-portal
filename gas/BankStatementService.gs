// ============================================================
// BankStatementService.gs — Reads bank statement Excel files
//   from the "Bank Statements" Drive folder.
//
// Files must be named FY24-25.xlsx (or .xls) — the filename
// is used directly as the FY code.
//
// The Excel format expected is SBI account statement:
//   Header row contains "Txn Date", "Description", "Balance"
//   Data rows follow below the header row.
// ============================================================

var BankStatementService = (function () {

  var FOLDER_NAME = 'Bank Statements';

  var MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun',
                    'Jul','Aug','Sep','Oct','Nov','Dec'];

  // ── Drive helpers ────────────────────────────────────────

  function _getFiles() {
    var parentItr = DriveApp.getFoldersByName('Financial');
    if (!parentItr.hasNext()) return [];
    var parent = parentItr.next();
    var childItr = parent.getFoldersByName(FOLDER_NAME);
    if (!childItr.hasNext()) return [];
    var folder = childItr.next();
    var files = [];
    var fi = folder.getFiles();
    while (fi.hasNext()) files.push(fi.next());
    return files;
  }

  function _fyCodeFromName(name) {
    // "FY24-25.xlsx" → "FY24-25"
    return name.replace(/\.(xlsx?|xls)$/i, '').trim();
  }

  // ── Excel parsing ─────────────────────────────────────────

  function _findCol(headers, patterns) {
    for (var i = 0; i < headers.length; i++) {
      for (var p = 0; p < patterns.length; p++) {
        if (patterns[p].test(headers[i])) return i;
      }
    }
    return -1;
  }

  function _formatDate(d) {
    // Safely pads to 2 digits
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
  }

  function _pad2(n) { return String(n).length < 2 ? '0' + n : String(n); }

  function _parseTransactions(file) {
    try {
      var ss = SpreadsheetApp.open(file);
      var sheet = ss.getSheets()[0];
      if (!sheet) return [];
      var data = sheet.getDataRange().getValues();

      // Find header row containing "Txn Date"
      var headerIdx = -1;
      for (var i = 0; i < data.length; i++) {
        for (var j = 0; j < data[i].length; j++) {
          if (/txn.?date/i.test(String(data[i][j] || ''))) { headerIdx = i; break; }
        }
        if (headerIdx >= 0) break;
      }
      if (headerIdx === -1) return [];

      var headers = data[headerIdx].map(function (h) { return String(h || '').trim(); });
      var dateCol = _findCol(headers, [/txn.?date/i, /^date$/i, /trans.*date/i]);
      var balCol  = _findCol(headers, [/^balance$/i, /closing/i]);
      if (dateCol === -1 || balCol === -1) return [];

      var txns = [];
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

        txns.push({ date: dateStr, balance: bal });
      }
      return txns;

    } catch (e) {
      Logger.log('BankStatementService: error parsing ' + file.getName() + ': ' + e.message);
      return [];
    }
  }

  // ── Month key helpers ─────────────────────────────────────

  function _monthKey(ddMmYyyy) {
    var m = ddMmYyyy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return m ? m[2] + '/' + m[3] : null; // "04/2024"
  }

  function _monthLabel(key) {
    var p = key.split('/');
    return MONTH_ABBR[parseInt(p[0]) - 1] + '-' + p[1]; // "Apr-2024"
  }

  function _keyToSortNum(key) {
    var p = key.split('/');
    return parseInt(p[1]) * 100 + parseInt(p[0]); // YYYYMM
  }

  // ── Public API ────────────────────────────────────────────

  function getYearlySummary() {
    var files  = _getFiles();
    var result = [];

    files.forEach(function (file) {
      var fyCode = _fyCodeFromName(file.getName());
      if (!/^FY\d{2}-\d{2}$/i.test(fyCode)) return;

      var txns = _parseTransactions(file);
      if (txns.length === 0) return;

      result.push({
        fy:             fyCode,
        closingBalance: txns[txns.length - 1].balance,
        txnCount:       txns.length,
      });
    });

    result.sort(function (a, b) { return a.fy < b.fy ? -1 : 1; });
    return { years: result };
  }

  function getFYMonthly(fyCode) {
    var files      = _getFiles();
    var targetFile = null;

    files.forEach(function (file) {
      if (_fyCodeFromName(file.getName()).toUpperCase() === fyCode.toUpperCase()) {
        targetFile = file;
      }
    });

    if (!targetFile) return { months: [] };

    var txns = _parseTransactions(targetFile);
    if (txns.length === 0) return { months: [] };

    // Last balance per month
    var monthMap = {};
    txns.forEach(function (t) {
      var key = _monthKey(t.date);
      if (key) monthMap[key] = t.balance;
    });

    var months = Object.keys(monthMap)
      .sort(function (a, b) { return _keyToSortNum(a) - _keyToSortNum(b); })
      .map(function (key) {
        return { month: _monthLabel(key), balance: monthMap[key] };
      });

    return { months: months };
  }

  return {
    getYearlySummary: getYearlySummary,
    getFYMonthly:     getFYMonthly,
  };

})();
