// ============================================================
// ResidentService.gs — Flat Occupant Info sheet reads
// ============================================================

var ResidentService = (function () {

  function _rowToResident(row) {
    var C = Config.RESIDENT_COLS;

    // "Owner" (col B) and "Type" (col C) are two separate columns.
    // Combine them as "Owner | Type" for display, e.g. "Hari Menon | Resident"
    var owner = String(row[C.OWNER] || '').trim();
    var type  = String(row[C.TYPE]  || '').trim();
    var ownerType = owner && type ? owner + ' | ' + type : (owner || type);

    return {
      slNo:            Utils.parseNumber(row[C.SL_NO]) || 0,
      owner:           owner,
      type:            type,
      ownerType:       ownerType,
      apartment:       String(row[C.APARTMENT]         || '').trim(),
      mobile:          String(row[C.MOBILE]            || '').trim(),
      email:           String(row[C.EMAIL]             || '').trim(),
      occupied:        Utils.parseBool(row[C.OCCUPIED]),
      category:        String(row[C.CATEGORY]          || '').trim(),
      subcategory:     String(row[C.SUBCATEGORY]       || '').trim(),
      occupantDetails: String(row[C.OCCUPANT_DETAILS]  || '').trim(),
      adults:          Utils.parseNumber(row[C.ADULTS])  || 0,
      kids:            Utils.parseNumber(row[C.KIDS])    || 0,
      total:           Utils.parseNumber(row[C.TOTAL])   || 0,
    };
  }

  function getAll(fy, includePII) {
    var sheet = Config.getResidentsSheet(fy);
    if (!sheet) return [];
    var data = sheet.getDataRange().getValues();
    var residents = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[Config.RESIDENT_COLS.APARTMENT]) continue;
      var r = _rowToResident(row);
      if (!includePII) { r.mobile = undefined; r.email = undefined; }
      residents.push(r);
    }
    return residents;
  }

  return { getAll: getAll };

})();
