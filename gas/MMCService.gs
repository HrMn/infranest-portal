// ============================================================
// MMCService.gs — MMC sheet reads and collection aggregation
// ============================================================

var MMCService = (function () {

  // Parse "Apr-2026" → Date(2026, 3, 1) for calendar comparisons
  var _MONTH_ABBR = { Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11 };
  function _parseMonthLabel(label) {
    var parts = String(label).split('-');
    if (parts.length !== 2) return null;
    var mi = _MONTH_ABBR[parts[0]];
    var yr = parseInt(parts[1]);
    if (mi === undefined || isNaN(yr)) return null;
    return new Date(yr, mi, 1);
  }

  function _getSheet(fy) {
    return Config.getFinancialsSheet(fy, Config.TABS.MMC);
  }

  // Compute the 0-based column index where monthly payments start.
  // Sheet layout: ... | Total Due(E=4) | Due FY16-17(F=5) | … | Due FY{X}-{X+1} | Apr … Mar |
  // For FY26-27: fyStartYear=26, currentFYDueCol = 5+(26-16)=15, monthsStart=16
  function _getMonthsStartCol(fy) {
    var C = Config.MMC_COLS;
    var fyStartYear = parseInt(String(fy).replace('FY', '').split('-')[0]);
    var currentFYDueCol = C.FY_DUE_BASE + (fyStartYear - C.FY_BASE_YEAR);
    return currentFYDueCol + 1;
  }

  function getStatus(fy) {
    var sheet = _getSheet(fy);
    if (!sheet) return { months: [], apartments: [], summary: {} };

    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return { months: [], apartments: [], summary: {} };

    var headerRow = data[0];
    var C = Config.MMC_COLS;
    var monthsStart = _getMonthsStartCol(fy);

    // Read exactly 12 month headers (Apr–Mar); stops before any trailing columns (e.g. Remarks).
    var months = [];
    for (var col = monthsStart; col < headerRow.length && months.length < 12; col++) {
      var h = headerRow[col];
      if (h instanceof Date) {
        h = Utils.monthLabel(h);
      } else {
        h = String(h || '').trim();
      }
      if (h) months.push(h);
    }

    var apartments = [];
    var totalOutstanding = 0;
    var totalRows = 0;

    // Rows 2-62 are apartment data (61 flats). Stop at row 62 (index 61).
    var DATA_LAST_IDX = 61;
    for (var i = 1; i < data.length && i <= DATA_LAST_IDX; i++) {
      var row = data[i];
      if (!row[C.APARTMENT]) continue;

      totalRows++;

      var owner    = String(row[C.OWNER]    || '').trim();
      var type     = String(row[C.TYPE]     || '').trim();
      var totalDue = Utils.parseNumber(row[C.TOTAL_DUE]);
      var ownerType = owner && type ? owner + ' | ' + type : (owner || type);

      totalOutstanding += totalDue;

      var collections = {};
      for (var m = 0; m < months.length; m++) {
        var colIdx = monthsStart + m;
        var val = Utils.parseNumber(row[colIdx]);
        collections[months[m]] = val;
      }

      apartments.push({
        slNo:        Utils.parseNumber(row[C.SL_NO]) || i,
        owner:       owner,
        type:        type,
        ownerType:   ownerType,
        apartment:   String(row[C.APARTMENT] || '').trim(),
        occupied:    true,
        totalDue:    totalDue,
        collections: collections,
      });
    }

    // dueThisFY: sum outstanding dues only for months that have already started.
    // Excludes future months whose formula cells may be pre-populated with expected amounts.
    var now = new Date();
    var thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    var dueThisFY = 0;
    for (var ai = 0; ai < apartments.length; ai++) {
      for (var mi2 = 0; mi2 < months.length; mi2++) {
        var md = _parseMonthLabel(months[mi2]);
        if (md && md <= thisMonthStart) {
          var v = apartments[ai].collections[months[mi2]];
          if (v > 0) dueThisFY += v;
        }
      }
    }

    // Current month = latest month where at least one apartment still has a due amount.
    // Pending MMC stores outstanding dues; amount > 0 means unpaid/partially paid.
    var currentMonth = months[months.length - 1] || '';
    for (var mi = months.length - 1; mi >= 0; mi--) {
      var hasDue = apartments.some(function (a) {
        return a.collections[months[mi]] > 0;
      });
      if (hasDue) { currentMonth = months[mi]; break; }
    }

    // Cleared = apartment's due for current month is exactly 0 (formula resolved to zero).
    // null = future month not yet billed; > 0 = still outstanding.
    var clearedThisMonth = apartments.filter(function (a) {
      return a.collections[currentMonth] === 0;
    }).length;

    var collectionRate = totalRows > 0
      ? Math.round((clearedThisMonth / totalRows) * 100)
      : 0;

    return {
      months: months,
      apartments: apartments,
      summary: {
        totalApartments:         totalRows,
        occupiedApartments:      totalRows,
        totalOutstanding:        totalOutstanding,
        dueThisFY:               dueThisFY,
        clearedThisMonth:        clearedThisMonth,
        pendingThisMonth:        totalRows - clearedThisMonth,
        collectionRateThisMonth: collectionRate,
        currentMonth:            currentMonth,
      },
    };
  }

  // Read the raw MMC payment tab ("MMC") and return what has actually been paid.
  // Returns null for empty cells (nothing recorded), positive number for payments.
  function getPaid(fy) {
    var sheet = Config.getFinancialsSheet(fy, Config.TABS.MMC_WRITE);
    if (!sheet) return { months: [], apartments: [], summary: {} };

    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return { months: [], apartments: [], summary: {} };

    var headerRow = data[0];
    var C = Config.MMC_WRITE_COLS;

    // Read month headers starting at H (index 7), cap at 12
    var months = [];
    for (var col = C.MONTHS_START; col < headerRow.length && months.length < 12; col++) {
      var h = headerRow[col];
      if (h instanceof Date) {
        h = Utils.monthLabel(h);
      } else {
        h = String(h || '').trim();
      }
      if (h) months.push(h);
    }

    var apartments = [];
    var totalCollected = 0;
    var totalRows = 0;
    var DATA_LAST_IDX = 61;

    for (var i = 1; i < data.length && i <= DATA_LAST_IDX; i++) {
      var row = data[i];
      if (!row[C.APARTMENT]) continue;

      totalRows++;
      var owner = String(row[C.OWNER]     || '').trim();
      var type  = String(row[C.TYPE]      || '').trim();
      var apt   = String(row[C.APARTMENT] || '').trim();

      var payments = {};
      var totalPaid = 0;
      for (var m = 0; m < months.length; m++) {
        var colIdx = C.MONTHS_START + m;
        var val = Utils.parseNumber(row[colIdx]);
        // null (empty cell) or 0 → not paid; >0 → actual payment
        var paid = (val !== null && val > 0) ? val : null;
        payments[months[m]] = paid;
        if (paid) totalPaid += paid;
      }

      totalCollected += totalPaid;
      apartments.push({
        slNo:      Utils.parseNumber(row[C.SL_NO]) || i,
        owner:     owner,
        type:      type,
        apartment: apt,
        totalPaid: totalPaid,
        payments:  payments,
      });
    }

    // collectedThisFY: payments for months up to and including the current calendar month
    var now = new Date();
    var thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    var collectedThisFY = 0;
    for (var ai = 0; ai < apartments.length; ai++) {
      for (var mi2 = 0; mi2 < months.length; mi2++) {
        var md = _parseMonthLabel(months[mi2]);
        if (md && md <= thisMonthStart) {
          var v = apartments[ai].payments[months[mi2]];
          if (v && v > 0) collectedThisFY += v;
        }
      }
    }

    // currentMonth: latest month where at least one apartment has a payment recorded
    var currentMonth = months[months.length - 1] || '';
    for (var mi = months.length - 1; mi >= 0; mi--) {
      var hasPaid = apartments.some(function (a) {
        return a.payments[months[mi]] !== null && a.payments[months[mi]] > 0;
      });
      if (hasPaid) { currentMonth = months[mi]; break; }
    }

    var paidThisMonth = apartments.filter(function (a) {
      return a.payments[currentMonth] !== null && a.payments[currentMonth] > 0;
    }).length;

    return {
      months:     months,
      apartments: apartments,
      summary: {
        totalApartments:  totalRows,
        totalCollected:   totalCollected,
        collectedThisFY:  collectedThisFY,
        paidThisMonth:    paidThisMonth,
        currentMonth:     currentMonth,
      },
    };
  }

  // Record a monthly payment for a given apartment.
  // Writes to the "MMC" payment tab (NOT Pending MMC which is formula-driven).
  // amount=0 clears the cell; positive value writes the payment.
  function recordPayment(fy, apartment, month, amount) {
    var sheet = Config.getFinancialsSheet(fy, Config.TABS.MMC_WRITE);
    if (!sheet) throw { code: 'NOT_FOUND', message: 'MMC payment sheet not found for ' + fy };

    var data = sheet.getDataRange().getValues();
    var headerRow = data[0];
    var C = Config.MMC_WRITE_COLS;

    // Locate the column for this month by scanning the header
    var monthColIdx = -1;
    for (var c = C.MONTHS_START; c < headerRow.length; c++) {
      var h = headerRow[c];
      if (h instanceof Date) h = Utils.monthLabel(h);
      else h = String(h || '').trim();
      if (h === month) { monthColIdx = c; break; }
    }
    if (monthColIdx === -1) throw { code: 'NOT_FOUND', message: 'Month column not found: ' + month };

    // Locate the row by apartment (column D)
    var aptRowIdx = -1;
    for (var i = 1; i < data.length; i++) {
      var apt = String(data[i][C.APARTMENT] || '').trim();
      if (apt === apartment) { aptRowIdx = i; break; }
    }
    if (aptRowIdx === -1) throw { code: 'NOT_FOUND', message: 'Apartment not found: ' + apartment };

    // Write value (sheet uses 1-based indices)
    var cellValue = (amount > 0) ? amount : '';
    sheet.getRange(aptRowIdx + 1, monthColIdx + 1).setValue(cellValue);
  }

  return {
    getStatus:     getStatus,
    getPaid:       getPaid,
    recordPayment: recordPayment,
  };

})();
