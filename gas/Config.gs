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
  // Actual sheet: Date | Particulars | Expenditure | Income | Payment Mode |
  //               Payment Type | Apartment | Receipt No | Voucher No | Remarks | Status
  // ---------------------------------------------------------------------------
  var IE_COLS = {
    DATE:         0,   // A
    PARTICULARS:  1,   // B
    EXPENDITURE:  2,   // C
    INCOME:       3,   // D
    PAYMENT_MODE: 4,   // E
    PAYMENT_TYPE: 5,   // F
    APARTMENT:    6,   // G
    RECEIPT_NO:   7,   // H
    VOUCHER_NO:   8,   // I
    REMARKS:      9,   // J
    STATUS:       10,  // K — transaction status (e.g. Done, Pending, Cleared)
  };

  // ---------------------------------------------------------------------------
  // MMC column indices (0-based)
  // Actual sheet: Sl.No | Owner | Type | Apartment | (E,F,G skipped) | Apr-2026 …
  // ---------------------------------------------------------------------------
  var MMC_COLS = {
    SL_NO:        0,  // A
    OWNER:        1,  // B
    TYPE:         2,  // C
    APARTMENT:    3,  // D
    // E(4), F(5), G(6) — skipped
    MONTHS_START: 7,  // H onwards — month columns (Apr-2026, May-2026 …)
  };

  // ---------------------------------------------------------------------------
  // Residents column indices (0-based)
  // Actual sheet: Sl.No | Owner | Type | Apartment | Mobile | MailID |
  //               Occupied? | Occupant Category | Occupant Subcategory |
  //               Occupant Details | Adults | Kids | Total
  // ---------------------------------------------------------------------------
  var RESIDENT_COLS = {
    SL_NO:            0,   // A - Sl. No.
    OWNER:            1,   // B - Owner
    TYPE:             2,   // C - Type
    APARTMENT:        3,   // D - Apartment
    MOBILE:           4,   // E - Mobile
    EMAIL:            5,   // F - MailID
    OCCUPIED:         6,   // G - Occupied?
    CATEGORY:         7,   // H - Occupant Category
    SUBCATEGORY:      8,   // I - Occupant Subcategory
    OCCUPANT_DETAILS: 9,   // J - Occupant Details
    ADULTS:           10,  // K - Adults
    KIDS:             11,  // L - Kids
    TOTAL:            12,  // M - Total
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
