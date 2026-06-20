// ============================================================
// Config.gs — Central configuration for all GAS services
// ============================================================

var Config = (function () {

  // ---------------------------------------------------------------------------
  // Sheet Registry: map FY → Spreadsheet IDs
  // Replace placeholder values with the actual Google Sheets file IDs from Drive.
  //
  // Global tabs live in dedicated sheets outside the FY spreadsheets:
  //   UserRoles       → Association_Stakeholders (getStakeholdersSheet)
  //   Category_Data,
  //   Mapping_Data    → Financials_Lookup        (getLookupSheet)
  //
  // Residents data does not change per FY — getResidentsSheet() always reads
  // from the GLOBAL_RESIDENTS_ID defined below.
  // ---------------------------------------------------------------------------
  var SHEET_REGISTRY = {
    'FY26-27': { financialsId: 'REPLACE_WITH_FINANCIALS_FY26_27_SHEET_ID' },
    'FY25-26': { financialsId: 'REPLACE_WITH_FINANCIALS_FY25_26_SHEET_ID' },
    'FY24-25': { financialsId: 'REPLACE_WITH_FINANCIALS_FY24_25_SHEET_ID' },
    'FY23-24': { financialsId: 'REPLACE_WITH_FINANCIALS_FY23_24_SHEET_ID' },
    'FY22-23': { financialsId: 'REPLACE_WITH_FINANCIALS_FY22_23_SHEET_ID' },
    'FY21-22': { financialsId: 'REPLACE_WITH_FINANCIALS_FY21_22_SHEET_ID' },
    'FY20-21': { financialsId: 'REPLACE_WITH_FINANCIALS_FY20_21_SHEET_ID' },
    'FY19-20': { financialsId: 'REPLACE_WITH_FINANCIALS_FY19_20_SHEET_ID' },
    'FY18-19': { financialsId: 'REPLACE_WITH_FINANCIALS_FY18_19_SHEET_ID' },
    'FY17-18': { financialsId: 'REPLACE_WITH_FINANCIALS_FY17_18_SHEET_ID' },
  };

  // Residents sheet is shared across all FYs (owners/tenants don't change per FY).
  var GLOBAL_RESIDENTS_ID = 'REPLACE_WITH_RESIDENTS_SHEET_ID';

  // Association_Stakeholders sheet — holds UserRoles tab (shared across all FYs).
  var GLOBAL_STAKEHOLDERS_ID = 'REPLACE_WITH_STAKEHOLDERS_SHEET_ID';

  // Financial_Summary sheet — holds Overall Summary and per-FY cash flow tabs.
  var FINANCIAL_SUMMARY_ID = 'REPLACE_WITH_FINANCIAL_SUMMARY_SHEET_ID';

  // Financials_Lookup sheet — holds Category_Data and Mapping_Data tabs (shared across all FYs).
  var GLOBAL_LOOKUP_ID = 'REPLACE_WITH_LOOKUP_SHEET_ID';

  // Bank Statement Google Sheets — one file per FY stored in Drive.
  // Get the file ID from Drive: open the file → copy the ID from the URL
  //   https://docs.google.com/spreadsheets/d/<FILE_ID>/edit
  var BANK_STATEMENT_FILES = {
    'FY26-27': 'REPLACE_WITH_BANK_STMT_FY26_27_ID',
    'FY25-26': 'REPLACE_WITH_BANK_STMT_FY25_26_ID',
    'FY24-25': 'REPLACE_WITH_BANK_STMT_FY24_25_ID',
    'FY23-24': 'REPLACE_WITH_BANK_STMT_FY23_24_ID',
    'FY22-23': 'REPLACE_WITH_BANK_STMT_FY22_23_ID',
    'FY21-22': 'REPLACE_WITH_BANK_STMT_FY21_22_ID',
  };

  var DEFAULT_FY = 'FY26-27';

  // Tab names
  var TABS = {
    INCOME_EXPENSE: 'Income_Expense',
    MMC:            'Pending MMC',  // formula-driven display tab (read-only from app)
    MMC_WRITE:      'MMC',          // payment recording tab (app writes here)
    MMC_RATE:       'MMC Rate',     // rate card history tab (read-only)
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
  // Sheet: Sl.No(A) | Owner(B) | Type(C) | Apt(D) | Total Due(E) |
  //        Due FY16-17(F) … Due FYcurrent(dynamic) | Apr-YYYY … Mar-YYYY (12 monthly cols)
  // Monthly payment columns start right after the current-FY due column.
  // Use _getMonthsStartCol(fy) in MMCService to compute the offset dynamically.
  // ---------------------------------------------------------------------------
  var MMC_COLS = {
    SL_NO:        0,  // A
    OWNER:        1,  // B
    TYPE:         2,  // C
    APARTMENT:    3,  // D
    TOTAL_DUE:    4,  // E — cumulative total outstanding
    FY_DUE_BASE:  5,  // F — first "Due FY" column (Due FY16-17)
    FY_BASE_YEAR: 16, // the start-year of the first Due FY column (FY16-17 → 16)
  };

  // ---------------------------------------------------------------------------
  // MMC_WRITE column indices (0-based) — for the "MMC" payment-recording tab
  // Sheet: Sl.No(A) | Owner(B) | Type(C) | Apt(D) | skip(E,F,G) | Apr-YYYY(H) … Mar-YYYY(S)
  // ---------------------------------------------------------------------------
  var MMC_WRITE_COLS = {
    SL_NO:        0,  // A
    OWNER:        1,  // B
    TYPE:         2,  // C
    APARTMENT:    3,  // D
    // E(4), F(5), G(6) — skipped
    MONTHS_START: 7,  // H onwards — monthly payment columns
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
  function getFinancialsSheet(fy, tabName) {
    var entry = SHEET_REGISTRY[fy || DEFAULT_FY] || SHEET_REGISTRY[DEFAULT_FY];
    var ss = SpreadsheetApp.openById(entry.financialsId);
    return ss.getSheetByName(tabName);
  }

  // Always reads from the DEFAULT_FY (FY26-27) spreadsheet.
  // Use for global tabs: UserRoles, Mapping_Data, Category_Data.
  function getGlobalSheet(tabName) {
    return getFinancialsSheet(DEFAULT_FY, tabName);
  }

  function getResidentsSheet() {
    var ss = SpreadsheetApp.openById(GLOBAL_RESIDENTS_ID);
    return ss.getSheets()[0];
  }

  function getStakeholdersSheet(tabName) {
    var ss = SpreadsheetApp.openById(GLOBAL_STAKEHOLDERS_ID);
    return ss.getSheetByName(tabName);
  }

  function getLookupSheet(tabName) {
    var ss = SpreadsheetApp.openById(GLOBAL_LOOKUP_ID);
    return ss.getSheetByName(tabName);
  }

  function getFinancialSummarySheet(tabName) {
    var ss = SpreadsheetApp.openById(FINANCIAL_SUMMARY_ID);
    return ss.getSheetByName(tabName);
  }

  function getBankStatementSheet(fyCode) {
    var id = BANK_STATEMENT_FILES[fyCode];
    if (!id || id.indexOf('REPLACE') === 0) return null;
    var ss = SpreadsheetApp.openById(id);
    return ss.getSheets()[0];
  }

  function getBankStatementFYCodes() {
    return Object.keys(BANK_STATEMENT_FILES).filter(function (fy) {
      var id = BANK_STATEMENT_FILES[fy];
      return id && id.indexOf('REPLACE') !== 0;
    });
  }

  return {
    TABS: TABS,
    IE_COLS: IE_COLS,
    MMC_COLS: MMC_COLS,
    MMC_WRITE_COLS: MMC_WRITE_COLS,
    MAPPING_COLS: MAPPING_COLS,
    CONFIG_COLS:  CONFIG_COLS,
    RESIDENT_COLS: RESIDENT_COLS,
    USER_COLS: USER_COLS,
    PAYMENT_MODES: PAYMENT_MODES,
    TXN_SOURCE: TXN_SOURCE,
    DEFAULT_FY: DEFAULT_FY,
    getFinancialsSheet: getFinancialsSheet,
    getGlobalSheet: getGlobalSheet,
    getResidentsSheet: getResidentsSheet,
    getStakeholdersSheet: getStakeholdersSheet,
    getLookupSheet: getLookupSheet,
    getFinancialSummarySheet: getFinancialSummarySheet,
    getBankStatementSheet: getBankStatementSheet,
    getBankStatementFYCodes: getBankStatementFYCodes,
  };

})();
