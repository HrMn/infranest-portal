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

    // Dynamically read month column headers starting at MONTHS_START
    var months = [];
    for (var col = C.MONTHS_START; col < headerRow.length; col++) {
      var h = String(headerRow[col] || '').trim();
      if (h) months.push(h);
    }

    var apartments = [];
    var totalOccupied = 0;

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[C.APARTMENT]) continue;

      var occupied = Utils.parseBool(row[C.OCCUPIED]);
      if (occupied) totalOccupied++;

      var collections = {};
      for (var m = 0; m < months.length; m++) {
        var colIdx = C.MONTHS_START + m;
        var val = Utils.parseNumber(row[colIdx]);
        collections[months[m]] = val;
      }

      apartments.push({
        slNo:        Utils.parseNumber(row[C.SL_NO]) || i,
        ownerType:   String(row[C.OWNER_TYPE]  || '').trim(),
        apartment:   String(row[C.APARTMENT]   || '').trim(),
        occupied:    occupied,
        category:    String(row[C.CATEGORY]    || '').trim(),
        subcategory: String(row[C.SUBCATEGORY] || '').trim(),
        collections: collections,
      });
    }

    // Current month summary (last month in the list that has any data)
    var currentMonth = months[months.length - 1];
    // Find the latest month with at least one payment
    for (var mi = months.length - 1; mi >= 0; mi--) {
      var hasData = apartments.some(function (a) { return a.collections[months[mi]] !== null; });
      if (hasData) { currentMonth = months[mi]; break; }
    }

    var collectedThisMonth = apartments.filter(function (a) {
      return a.occupied && a.collections[currentMonth] !== null;
    }).length;

    var outstandingThisMonth = apartments.filter(function (a) {
      return a.occupied && (a.collections[currentMonth] === null);
    }).length;

    var collectionRate = totalOccupied > 0
      ? Math.round((collectedThisMonth / totalOccupied) * 100)
      : 0;

    return {
      months: months,
      apartments: apartments,
      summary: {
        totalApartments:       apartments.length,
        occupiedApartments:    totalOccupied,
        collectedThisMonth:    collectedThisMonth,
        outstandingThisMonth:  outstandingThisMonth,
        collectionRateThisMonth: collectionRate,
        currentMonth:          currentMonth,
      },
    };
  }

  return { getStatus: getStatus };

})();
