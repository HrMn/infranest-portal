// ============================================================
// MMCService.gs — MMC sheet reads and collection aggregation
// ============================================================

var MMCService = (function () {

  function _getSheet(fy) {
    return Config.getFinancialsSheet(fy, Config.TABS.MMC);
  }

  function getStatus(fy) {
    var sheet = _getSheet(fy);
    if (!sheet) return { months: [], apartments: [], summary: {} };

    var data = sheet.getDataRange().getValues();
    if (data.length < 2) return { months: [], apartments: [], summary: {} };

    var headerRow = data[0];
    var C = Config.MMC_COLS;

    // Read month headers dynamically starting at MONTHS_START (col H, index 7).
    // Sheet stores month cells as Date objects formatted "Apr-2026" — use monthLabel().
    // Columns E, F, G (indices 4-6) are skipped.
    var months = [];
    for (var col = C.MONTHS_START; col < headerRow.length; col++) {
      var h = headerRow[col];
      if (h instanceof Date) {
        h = Utils.monthLabel(h);
      } else {
        h = String(h || '').trim();
      }
      if (h) months.push(h);
    }

    var apartments = [];
    var totalRows = 0;

    // Rows 2-62 are apartment data (61 flats). Row 63+ are summary rows — stop there.
    var DATA_LAST_IDX = 61; // array index (sheet row 62 = index 61 since header is index 0)
    for (var i = 1; i < data.length && i <= DATA_LAST_IDX; i++) {
      var row = data[i];
      if (!row[C.APARTMENT]) continue;

      totalRows++;

      var owner = String(row[C.OWNER] || '').trim();
      var type  = String(row[C.TYPE]  || '').trim();
      var ownerType = owner && type ? owner + ' | ' + type : (owner || type);

      // No explicit Occupied? column in this sheet — treat all rows as occupied
      var occupied = true;

      var collections = {};
      for (var m = 0; m < months.length; m++) {
        var colIdx = C.MONTHS_START + m;
        var val = Utils.parseNumber(row[colIdx]);
        collections[months[m]] = val;
      }

      apartments.push({
        slNo:        Utils.parseNumber(row[C.SL_NO]) || i,
        owner:       owner,
        type:        type,
        ownerType:   ownerType,
        apartment:   String(row[C.APARTMENT] || '').trim(),
        occupied:    occupied,
        collections: collections,
      });
    }

    // Determine current month: last month that has at least one payment entry
    var currentMonth = months[months.length - 1] || '';
    for (var mi = months.length - 1; mi >= 0; mi--) {
      var hasData = apartments.some(function (a) {
        return a.collections[months[mi]] !== null && a.collections[months[mi]] !== undefined;
      });
      if (hasData) { currentMonth = months[mi]; break; }
    }

    var collectedThisMonth = apartments.filter(function (a) {
      return a.collections[currentMonth] !== null && a.collections[currentMonth] !== undefined;
    }).length;

    var outstandingThisMonth = totalRows - collectedThisMonth;

    var collectionRate = totalRows > 0
      ? Math.round((collectedThisMonth / totalRows) * 100)
      : 0;

    return {
      months: months,
      apartments: apartments,
      summary: {
        totalApartments:         totalRows,
        occupiedApartments:      totalRows,
        collectedThisMonth:      collectedThisMonth,
        outstandingThisMonth:    outstandingThisMonth,
        collectionRateThisMonth: collectionRate,
        currentMonth:            currentMonth,
      },
    };
  }

  return { getStatus: getStatus };

})();
