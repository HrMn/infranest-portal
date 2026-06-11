// ============================================================
// Utils.gs — Date helpers, formatters, category resolver
// ============================================================

var Utils = (function () {

  // Parse a date cell value (Date object or DD/MM/YYYY string) → JS Date
  function parseDate(val) {
    if (!val) return null;
    if (val instanceof Date) return val;
    var str = String(val).trim();
    // DD/MM/YYYY
    var m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]));
    var d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  // Format a JS Date → "DD/MM/YYYY"
  function formatDate(d) {
    if (!d) return '';
    var day   = String(d.getDate()).padStart(2, '0');
    var month = String(d.getMonth() + 1).padStart(2, '0');
    var year  = d.getFullYear();
    return day + '/' + month + '/' + year;
  }

  // Return "Mmm-YYYY" label for a date
  function monthLabel(d) {
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[d.getMonth()] + '-' + d.getFullYear();
  }

  // Parse a number cell value safely
  function parseNumber(val) {
    if (val === null || val === undefined || val === '') return null;
    var n = parseFloat(String(val).replace(/,/g, ''));
    return isNaN(n) ? null : n;
  }

  // Parse boolean from "Yes"/"No"/TRUE/FALSE
  function parseBool(val) {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') return val.trim().toLowerCase() === 'yes' || val.trim().toLowerCase() === 'true';
    return false;
  }

  // Category resolver — maps Particulars text to a display category
  // Used for Phase 1A before the Category column is added in Phase 1B
  var INCOME_PATTERNS = [
    [/mmc|maintenance charge/i,          'MMC Collection'],
    [/fd interest|fixed deposit interest/i, 'FD Interest'],
    [/water recovery|water charge/i,     'Water Recovery'],
    [/gas recovery|gas charge/i,         'Gas Recovery'],
    [/donation/i,                        'Donations'],
  ];

  var EXPENSE_PATTERNS = [
    [/electricity|eb |power bill/i,      'Electricity'],
    [/gas cylinder|lpg/i,                'Gas Cylinder'],
    [/water tanker|tanker/i,             'Water Tanker'],
    [/stp operation/i,                   'STP Operations'],
    [/lift amc|elevator/i,               'Lift AMC'],
    [/fire amc|fire safety/i,            'Fire AMC'],
    [/stp amc/i,                         'STP AMC'],
    [/security/i,                        'Security Charges'],
    [/caretaker/i,                       'Caretaker Charges'],
    [/clean/i,                           'Cleaning Charges'],
    [/sewage/i,                          'Sewage Collection'],
    [/plumb/i,                           'Plumbing'],
    [/electrical repair/i,               'Electrical Repairs'],
    [/building maint/i,                  'Building Maintenance'],
  ];

  function resolveCategory(particulars, isIncome) {
    var patterns = isIncome ? INCOME_PATTERNS : EXPENSE_PATTERNS;
    for (var i = 0; i < patterns.length; i++) {
      if (patterns[i][0].test(particulars)) return patterns[i][1];
    }
    return isIncome ? 'Other Income' : 'Miscellaneous';
  }

  // Build a groupBy map from an array using a key function
  function groupBy(arr, keyFn) {
    return arr.reduce(function (acc, item) {
      var key = keyFn(item);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }

  // Sum an array of numbers (nulls ignored)
  function sum(arr) {
    return arr.reduce(function (acc, v) { return acc + (v || 0); }, 0);
  }

  return {
    parseDate: parseDate,
    formatDate: formatDate,
    monthLabel: monthLabel,
    parseNumber: parseNumber,
    parseBool: parseBool,
    resolveCategory: resolveCategory,
    groupBy: groupBy,
    sum: sum,
  };

})();
