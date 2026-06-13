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
    MAPPING_DATA:   'Mapping_Data',
    CATEGORY_DATA:  'Category_Data',
  };

  // Category_Data column indices (0-based)
  // A: Config_Type  B: Key  C: Status
  var CONFIG_COLS = {
    CONFIG_TYPE: 0,
    KEY:         1,
    STATUS:      2,
  };

  // Mapping_Data column indices (0-based)
  // A: Apt_Key (comma-separated keywords)  B: Apartment code (e.g. "1C")
  var MAPPING_COLS = {
    APT_KEY:   0,
    APARTMENT: 1,
  };

  // ---------------------------------------------------------------------------
  // Income_Expense column indices (0-based)
  // Actual sheet: Date | Particulars | Expenditure | Income | Payment Mode |
  //               Payment Type | Apartment | Receipt No | Voucher No | Remarks | Status |
  //               Transaction_ID | Source | Imported_By | Imported_On
  // ---------------------------------------------------------------------------
  var IE_COLS = {
    DATE:           0,   // A
    PARTICULARS:    1,   // B
    EXPENDITURE:    2,   // C
    INCOME:         3,   // D
    PAYMENT_MODE:   4,   // E
    PAYMENT_TYPE:   5,   // F
    APARTMENT:      6,   // G
    RECEIPT_NO:     7,   // H
    VOUCHER_NO:     8,   // I
    REMARKS:        9,   // J
    STATUS:         10,  // K — transaction status (e.g. Done, Pending, Cleared)
    TRANSACTION_ID: 11,  // L — UUID generated at create/import time
    SOURCE:         12,  // M — 'Manual' or 'Statement Import'
    IMPORTED_BY:    13,  // N — email of importer (blank for manual)
    IMPORTED_ON:    14,  // O — timestamp of import (blank for manual)
  };

  // Payment mode classification
  var PAYMENT_MODES = {
    CASH: 'Cash',
    ONLINE: 'Online',
    UPI: 'UPI',
    NEFT: 'NEFT',
    RTGS: 'RTGS',
    CHEQUE: 'Cheque',
  };

  // Source identifiers written to col M
  var TXN_SOURCE = {
    MANUAL: 'Manual',
    IMPORT: 'Statement Import',
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
  // Sheet layout: A:EMAIL | B:DISPLAY_ROLE | C:PRIVILEGE | D:NAME | E:ACTIVE | F:LAST_LOGIN
  // ---------------------------------------------------------------------------
  var USER_COLS = {
    EMAIL:        0,
    DISPLAY_ROLE: 1,
    PRIVILEGE:    2,
    NAME:         3,
    ACTIVE:       4,
    LAST_LOGIN:   5,
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
    MAPPING_COLS: MAPPING_COLS,
    CONFIG_COLS:  CONFIG_COLS,
    RESIDENT_COLS: RESIDENT_COLS,
    USER_COLS: USER_COLS,
    PAYMENT_MODES: PAYMENT_MODES,
    TXN_SOURCE: TXN_SOURCE,
    DEFAULT_FY: DEFAULT_FY,
    getSheetIds: getSheetIds,
    getFinancialsSheet: getFinancialsSheet,
    getResidentsSheet: getResidentsSheet,
  };

})();
