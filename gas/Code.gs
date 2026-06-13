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

  var WRITE_ROLES = ['TREASURER'];
  var READ_ROLES  = ['TREASURER', 'COMMITTEE', 'CARETAKER'];

  switch (action) {

    // ---- User / Auth ----
    case 'getUserRole':
      return ResponseHelper.success({
        email: principal.email,
        role:  principal.role,
        name:  principal.name,
      });

    case 'getUsers':
      AuthGuard.requireRole(principal, ['TREASURER']);
      return ResponseHelper.success(UserService.getAllUsers());

    case 'upsertUser': {
      AuthGuard.requireRole(principal, ['TREASURER']);
      var body = JSON.parse(e.postData.contents || '{}');
      UserService.upsertUser(body.email, body.role, body.name);
      return ResponseHelper.success({ ok: true });
    }

    // ---- Dashboard ----
    case 'getDashboardSummary':
      AuthGuard.requireRole(principal, READ_ROLES);
      return ResponseHelper.success(
        ReportService.getDashboardSummary(fy, p.month || null)
      );

    // ---- MMC ----
    case 'getMMCStatus':
      AuthGuard.requireRole(principal, READ_ROLES);
      return ResponseHelper.success(MMCService.getStatus(fy));

    // ---- Residents ----
    case 'getResidents': {
      AuthGuard.requireRole(principal, READ_ROLES);
      var includePII = principal.role === 'TREASURER';
      return ResponseHelper.success(ResidentService.getAll(fy, includePII));
    }

    // ---- Reports ----
    case 'getMonthlyReport':
      AuthGuard.requireRole(principal, READ_ROLES);
      return ResponseHelper.success(ReportService.getMonthlyReport(fy));

    case 'getIncomeBreakdown':
      AuthGuard.requireRole(principal, READ_ROLES);
      return ResponseHelper.success(ReportService.getIncomeBreakdown(fy));

    case 'getExpenseBreakdown':
      AuthGuard.requireRole(principal, READ_ROLES);
      return ResponseHelper.success(ReportService.getExpenseBreakdown(fy));

    // ---- Transactions ----
    case 'getTransactions':
      AuthGuard.requireRole(principal, READ_ROLES);
      return ResponseHelper.success(TransactionService.getAll(fy));

    case 'getTransactionSummary':
      AuthGuard.requireRole(principal, READ_ROLES);
      return ResponseHelper.success(TransactionService.getSummary(fy, p.month || null));

    case 'getBankSummary':
      AuthGuard.requireRole(principal, READ_ROLES);
      return ResponseHelper.success(TransactionService.getBankSummary(fy, p.month || null));

    case 'getCashSummary':
      AuthGuard.requireRole(principal, READ_ROLES);
      return ResponseHelper.success(TransactionService.getCashSummary(fy, p.month || null));

    case 'createTransaction': {
      AuthGuard.requireRole(principal, WRITE_ROLES);
      var payload = JSON.parse(e.postData.contents || '{}');
      var result = TransactionService.create(fy, payload, principal.email);
      return ResponseHelper.success(result);
    }

    case 'updateTransaction': {
      AuthGuard.requireRole(principal, WRITE_ROLES);
      var payload = JSON.parse(e.postData.contents || '{}');
      TransactionService.update(fy, payload.rowIndex, payload);
      return ResponseHelper.success({ ok: true });
    }

    case 'deleteTransaction': {
      AuthGuard.requireRole(principal, WRITE_ROLES);
      var payload = JSON.parse(e.postData.contents || '{}');
      TransactionService.remove(fy, payload.rowIndex);
      return ResponseHelper.success({ ok: true });
    }

    case 'importTransactions': {
      AuthGuard.requireRole(principal, WRITE_ROLES);
      var payload = JSON.parse(e.postData.contents || '{}');
      var result = TransactionService.bulkCreate(fy, payload.rows || [], principal.email);
      return ResponseHelper.success(result);
    }

    case 'getAptMapping': {
      AuthGuard.requireRole(principal, READ_ROLES);
      var sheet = Config.getFinancialsSheet(fy, Config.TABS.MAPPING_DATA);
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
      AuthGuard.requireRole(principal, READ_ROLES);
      var sheet = Config.getFinancialsSheet(fy, Config.TABS.CATEGORY_DATA);
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
      AuthGuard.requireRole(principal, WRITE_ROLES);
      var payload = JSON.parse(e.postData.contents || '{}');
      var sheet = Config.getFinancialsSheet(fy, Config.TABS.CATEGORY_DATA);
      if (!sheet) return ResponseHelper.error('NOT_FOUND', 'Category_Data sheet not found');
      if (payload.rowIndex) {
        sheet.getRange(payload.rowIndex, 1, 1, 3).setValues([[payload.configType, payload.key, payload.status || 'Active']]);
      } else {
        sheet.appendRow([payload.configType, payload.key, payload.status || 'Active']);
      }
      return ResponseHelper.success({ ok: true });
    }

    case 'deleteConfigItem': {
      AuthGuard.requireRole(principal, WRITE_ROLES);
      var payload = JSON.parse(e.postData.contents || '{}');
      var sheet = Config.getFinancialsSheet(fy, Config.TABS.CATEGORY_DATA);
      if (!sheet) return ResponseHelper.error('NOT_FOUND', 'Category_Data sheet not found');
      sheet.deleteRow(payload.rowIndex);
      return ResponseHelper.success({ ok: true });
    }

    default:
      return ResponseHelper.error('NOT_FOUND', 'Unknown action: ' + action);
  }
}
