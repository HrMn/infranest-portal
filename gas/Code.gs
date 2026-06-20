// ============================================================
// Code.gs — Entry point: doGet, doPost, and action router
// ============================================================
//
// SETUP INSTRUCTIONS:
// 1. Copy all .gs files into a new Google Apps Script project.
// 2. In Script Properties (Project Settings → Script Properties), add:
//      GOOGLE_CLIENT_ID = <your OAuth 2.0 Client ID>
// 3. In Config.gs, set the actual Google Sheet IDs for each FY.
// 4. Deploy as a Web App:
//      Execute as: Me (your Google account)
//      Who has access: Anyone
// 5. Copy the Web App URL into the React app's .env file as VITE_GAS_URL.
// ============================================================

function doGet(e) {
  return _handle(e);
}

function doPost(e) {
  return _handle(e);
}

function _handle(e) {
  try {
    // Parse the action
    var action = (e.parameter && e.parameter.action) || '';
    if (!action && e.postData) {
      try {
        var body = JSON.parse(e.postData.contents || '{}');
        action = body.action || '';
      } catch (_) {}
    }

    if (!action) {
      return ResponseHelper.error('BAD_REQUEST', 'Missing required parameter: action');
    }

    // Public actions — no auth required
    if (action === 'ping') {
      return ResponseHelper.success({ status: 'ok', version: '1.0' });
    }

    // Debug: decode the token without verifying role — remove after setup is confirmed
    if (action === 'debugToken') {
      var rawAuth = (e.parameter && e.parameter.authorization) ? e.parameter.authorization : 'NOT_RECEIVED';
      var result = { received: rawAuth !== 'NOT_RECEIVED', length: rawAuth.length, claims: null, error: null };
      try {
        var jwt = rawAuth.replace(/^Bearer\s+/i, '').trim();
        var parts = jwt.split('.');
        if (parts.length === 3) {
          var base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          while (base64.length % 4) base64 += '=';
          result.claims = JSON.parse(Utilities.newBlob(Utilities.base64Decode(base64)).getDataAsString());
        } else {
          result.error = 'JWT does not have 3 parts';
        }
      } catch (ex) {
        result.error = ex.message;
      }
      var clientId = PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID');
      result.scriptPropertyClientId = clientId || 'NOT_SET';
      return ResponseHelper.success(result);
    }

    // Authenticated actions
    var principal = AuthGuard.authenticate(e);

    // Update last login timestamp (fire-and-forget)
    try { UserService.updateLastLogin(principal.email); } catch (_) {}

    return _route(action, e, principal);

  } catch (err) {
    if (err.code) {
      return ResponseHelper.error(err.code, err.message);
    }
    Logger.log('Unhandled error in _handle: ' + err.message + '\n' + err.stack);
    return ResponseHelper.error('INTERNAL_ERROR', 'An unexpected error occurred.');
  }
}

function _route(action, e, principal) {
  var p  = e.parameter  || {};
  var fy = p.fy || Config.DEFAULT_FY;

  // Privilege tiers (ordered by access level)
  var SUPER_ADMIN  = ['SuperAdmin'];
  var VERIFY_PRIVS = ['SuperAdmin', 'Admin'];          // can verify transactions
  var CREATE_PRIVS = ['SuperAdmin', 'CT'];              // can create/import transactions
  var READ_PRIVS   = ['SuperAdmin', 'Admin', 'CT'];    // can read financial data
  var MANAGE_PRIVS = ['SuperAdmin'];                    // manage users and config

  switch (action) {

    // ---- User / Auth ----
    case 'getUserRole':
      return ResponseHelper.success({
        email:       principal.email,
        displayRole: principal.displayRole,
        privilege:   principal.privilege,
        name:        principal.name,
      });

    case 'getUsers':
      AuthGuard.requirePrivilege(principal, MANAGE_PRIVS);
      return ResponseHelper.success(UserService.getAllUsers());

    case 'upsertUser': {
      AuthGuard.requirePrivilege(principal, MANAGE_PRIVS);
      var body = JSON.parse(e.postData.contents || '{}');
      UserService.upsertUser(body.email, body.displayRole, body.name, body.privilege);
      return ResponseHelper.success({ ok: true });
    }

    // ---- Dashboard ----
    case 'getDashboardSummary':
      AuthGuard.requirePrivilege(principal, READ_PRIVS);
      return ResponseHelper.success(
        ReportService.getDashboardSummary(fy, p.month || null)
      );

    // ---- MMC ----
    case 'getMMCStatus':
      AuthGuard.requirePrivilege(principal, READ_PRIVS);
      return ResponseHelper.success(MMCService.getStatus(fy));

    case 'getMMCPaid':
      AuthGuard.requirePrivilege(principal, READ_PRIVS);
      return ResponseHelper.success(MMCService.getPaid(fy));

    case 'getMMCRates':
      AuthGuard.requirePrivilege(principal, READ_PRIVS);
      return ResponseHelper.success(MMCService.getRates(fy));

    // ---- Bank Statements ----
    case 'getBankStatementSummary':
      AuthGuard.requirePrivilege(principal, READ_PRIVS);
      return ResponseHelper.success(BankStatementService.getYearlySummary());

    case 'getBankStatementMonthly':
      AuthGuard.requirePrivilege(principal, READ_PRIVS);
      return ResponseHelper.success(BankStatementService.getFYMonthly(p.fyCode || ''));

    case 'getBankStatementDaily':
      AuthGuard.requirePrivilege(principal, READ_PRIVS);
      return ResponseHelper.success(BankStatementService.getFYDailyDetail(p.fyCode || '', p.monthKey || ''));

    // ---- Financial Summary ----
    case 'getFinancialSummary':
      AuthGuard.requirePrivilege(principal, READ_PRIVS);
      return ResponseHelper.success(FinancialSummaryService.getOverallSummary());

    case 'getFinancialSummaryDetail':
      AuthGuard.requirePrivilege(principal, READ_PRIVS);
      return ResponseHelper.success(FinancialSummaryService.getFYDetail(p.fyLabel || ''));

    case 'updateMMCPayment': {
      AuthGuard.requirePrivilege(principal, VERIFY_PRIVS);
      var payload = JSON.parse(e.postData.contents || '{}');
      MMCService.recordPayment(fy, payload.apartment, payload.month, payload.amount);
      return ResponseHelper.success({ ok: true });
    }

    // ---- Residents ----
    case 'getResidents': {
      AuthGuard.requirePrivilege(principal, READ_PRIVS);
      var includePII = principal.privilege === 'SuperAdmin';
      return ResponseHelper.success(ResidentService.getAll(fy, includePII));
    }

    // ---- Reports ----
    case 'getMonthlyReport':
      AuthGuard.requirePrivilege(principal, VERIFY_PRIVS);
      return ResponseHelper.success(ReportService.getMonthlyReport(fy));

    case 'getIncomeBreakdown':
      AuthGuard.requirePrivilege(principal, VERIFY_PRIVS);
      return ResponseHelper.success(ReportService.getIncomeBreakdown(fy));

    case 'getExpenseBreakdown':
      AuthGuard.requirePrivilege(principal, VERIFY_PRIVS);
      return ResponseHelper.success(ReportService.getExpenseBreakdown(fy));

    // ---- Transactions ----
    case 'getTransactions':
      AuthGuard.requirePrivilege(principal, READ_PRIVS);
      return ResponseHelper.success(TransactionService.getAll(fy));

    case 'getTransactionSummary':
      AuthGuard.requirePrivilege(principal, READ_PRIVS);
      return ResponseHelper.success(TransactionService.getSummary(fy, p.month || null));

    case 'getBankSummary':
      AuthGuard.requirePrivilege(principal, READ_PRIVS);
      return ResponseHelper.success(TransactionService.getBankSummary(fy, p.month || null));

    case 'getCashSummary':
      AuthGuard.requirePrivilege(principal, READ_PRIVS);
      return ResponseHelper.success(TransactionService.getCashSummary(fy, p.month || null));

    case 'createTransaction': {
      AuthGuard.requirePrivilege(principal, CREATE_PRIVS);
      var payload = JSON.parse(e.postData.contents || '{}');
      var result = TransactionService.create(fy, payload, principal.email);
      return ResponseHelper.success(result);
    }

    case 'updateTransaction': {
      AuthGuard.requirePrivilege(principal, SUPER_ADMIN);
      var payload = JSON.parse(e.postData.contents || '{}');
      TransactionService.update(fy, payload.rowIndex, payload);
      return ResponseHelper.success({ ok: true });
    }

    case 'verifyTransaction': {
      AuthGuard.requirePrivilege(principal, VERIFY_PRIVS);
      var payload = JSON.parse(e.postData.contents || '{}');
      TransactionService.update(fy, payload.rowIndex, { status: payload.status });
      return ResponseHelper.success({ ok: true });
    }

    case 'deleteTransaction': {
      AuthGuard.requirePrivilege(principal, SUPER_ADMIN);
      var payload = JSON.parse(e.postData.contents || '{}');
      TransactionService.remove(fy, payload.rowIndex);
      return ResponseHelper.success({ ok: true });
    }

    case 'importTransactions': {
      AuthGuard.requirePrivilege(principal, SUPER_ADMIN);
      var payload = JSON.parse(e.postData.contents || '{}');
      var result = TransactionService.bulkCreate(fy, payload.rows || [], principal.email);
      return ResponseHelper.success(result);
    }

    case 'getAptMapping': {
      AuthGuard.requirePrivilege(principal, READ_PRIVS);
      var sheet = Config.getLookupSheet(Config.TABS.MAPPING_DATA);
      if (!sheet) return ResponseHelper.success({ mappings: [] });
      var data = sheet.getDataRange().getValues();
      var mappings = [];
      for (var i = 1; i < data.length; i++) {
        var aptKey    = String(data[i][Config.MAPPING_COLS.APT_KEY]   || '').trim();
        var apartment = String(data[i][Config.MAPPING_COLS.APARTMENT] || '').trim();
        if (aptKey && apartment) {
          mappings.push({ aptKey: aptKey, apartment: apartment });
        }
      }
      return ResponseHelper.success({ mappings: mappings });
    }

    // ---- Config / Master Data ----
    case 'getConfigData': {
      AuthGuard.requirePrivilege(principal, READ_PRIVS);
      var sheet = Config.getLookupSheet(Config.TABS.CATEGORY_DATA);
      if (!sheet) return ResponseHelper.success({ items: [] });
      var data = sheet.getDataRange().getValues();
      var filterType = p.configType || '';
      var items = [];
      for (var i = 1; i < data.length; i++) {
        var ct     = String(data[i][Config.CONFIG_COLS.CONFIG_TYPE] || '').trim();
        var key    = String(data[i][Config.CONFIG_COLS.KEY]         || '').trim();
        var status = String(data[i][Config.CONFIG_COLS.STATUS]      || 'Active').trim();
        if (!ct && !key) continue;
        if (filterType && ct !== filterType) continue;
        items.push({ configType: ct, key: key, status: status, rowIndex: i + 1 });
      }
      return ResponseHelper.success({ items: items });
    }

    case 'upsertConfigItem': {
      AuthGuard.requirePrivilege(principal, MANAGE_PRIVS);
      var payload = JSON.parse(e.postData.contents || '{}');
      var sheet = Config.getLookupSheet(Config.TABS.CATEGORY_DATA);
      if (!sheet) return ResponseHelper.error('NOT_FOUND', 'Category_Data sheet not found');
      if (payload.rowIndex) {
        sheet.getRange(payload.rowIndex, 1, 1, 3).setValues([[payload.configType, payload.key, payload.status || 'Active']]);
      } else {
        sheet.appendRow([payload.configType, payload.key, payload.status || 'Active']);
      }
      return ResponseHelper.success({ ok: true });
    }

    case 'deleteConfigItem': {
      AuthGuard.requirePrivilege(principal, MANAGE_PRIVS);
      var payload = JSON.parse(e.postData.contents || '{}');
      var sheet = Config.getLookupSheet(Config.TABS.CATEGORY_DATA);
      if (!sheet) return ResponseHelper.error('NOT_FOUND', 'Category_Data sheet not found');
      sheet.deleteRow(payload.rowIndex);
      return ResponseHelper.success({ ok: true });
    }

    default:
      return ResponseHelper.error('NOT_FOUND', 'Unknown action: ' + action);
  }
}
