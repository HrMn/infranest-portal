// ============================================================
// Config.gs — Central configuration for all GAS services
// ============================================================

var Config = (function () {

  // ---------------------------------------------------------------------------
  // Sheet Registry: map FY → Spreadsheet IDs
  // Replace these with actual Google Sheets file IDs from your Drive
  // ---------------------------------------------------------------------------
  var SHEET_REGISTRY = {
    'FY26-27': {
      financialsId: 'REPLACE_WITH_FINANCIALS_FY26_27_SHEET_ID',
      residentsId:  'REPLACE_WITH_RESIDENTS_SHEET_ID',
    },
    'FY25-26': {
      financialsId: 'REPLACE_WITH_FINANCIALS_FY25_26_SHEET_ID',
      residentsId:  'REPLACE_WITH_RESIDENTS_SHEET_ID',
    },
  };

  var DEFAULT_FY = 'FY26-27';

  // Tab names
  var TABS = {
    INCOME_EXPENSE: 'Income_Expense',
    MMC:            'MMC',
    USER_ROLES:     'UserRoles',
  };

  // ---------------------------------------------------------------------------
  // Income_Expense column indices (0-based)
  // ---------------------------------------------------------------------------
  var IE_COLS = {
    DATE:         0,
    PARTICULARS:  1,
    EXPENDITURE:  2,
    INCOME:       3,
    PAYMENT_MODE: 4,
    PAYMENT_TYPE: 5,
    APARTMENT:    6,
    RECEIPT_NO:   7,
    VOUCHER_NO:   8,
    REMARKS:      9,
    CATEGORY:     10, // Added in Phase 1B — may not exist yet
  };

  // ---------------------------------------------------------------------------
  // MMC column indices (0-based)
  // ---------------------------------------------------------------------------
  var MMC_COLS = {
    SL_NO:       0,
    OWNER_TYPE:  1,
    APARTMENT:   2,
    OCCUPIED:    3,
    CATEGORY:    4,
    SUBCATEGORY: 5,
    MONTHS_START: 6, // Month columns start at index 6
  };

  // ---------------------------------------------------------------------------
  // Residents column indices (0-based)
  // ---------------------------------------------------------------------------
  var RESIDENT_COLS = {
    SL_NO:            0,
    OWNER_TYPE:       1,
    APARTMENT:        2,
    MOBILE:           3,
    EMAIL:            4,
    OCCUPIED:         5,
    CATEGORY:         6,
    SUBCATEGORY:      7,
    OCCUPANT_DETAILS: 8,
    ADULTS:           9,
    KIDS:             10,
    TOTAL:            11,
  };

  // ---------------------------------------------------------------------------
  // UserRoles column indices (0-based)
  // ---------------------------------------------------------------------------
  var USER_COLS = {
    EMAIL:      0,
    ROLE:       1,
    NAME:       2,
    ACTIVE:     3,
    LAST_LOGIN: 4,
  };

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  function getSheetIds(fy) {
    return SHEET_REGISTRY[fy || DEFAULT_FY] || SHEET_REGISTRY[DEFAULT_FY];
  }

  function getFinancialsSheet(fy, tabName) {
    var ids = getSheetIds(fy);
    var ss = SpreadsheetApp.openById(ids.financialsId);
    return ss.getSheetByName(tabName);
  }

  function getResidentsSheet(fy) {
    var ids = getSheetIds(fy);
    var ss = SpreadsheetApp.openById(ids.residentsId);
    // Residents sheet uses its first/only sheet
    return ss.getSheets()[0];
  }

  return {
    TABS: TABS,
    IE_COLS: IE_COLS,
    MMC_COLS: MMC_COLS,
    RESIDENT_COLS: RESIDENT_COLS,
    USER_COLS: USER_COLS,
    DEFAULT_FY: DEFAULT_FY,
    getSheetIds: getSheetIds,
    getFinancialsSheet: getFinancialsSheet,
    getResidentsSheet: getResidentsSheet,
  };

})();
