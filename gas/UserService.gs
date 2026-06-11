// ============================================================
// UserService.gs — UserRoles sheet operations
// ============================================================

var UserService = (function () {

  function _getSheet(fy) {
    return Config.getFinancialsSheet(fy || Config.DEFAULT_FY, Config.TABS.USER_ROLES);
  }

  function _rowToUser(row) {
    var C = Config.USER_COLS;
    return {
      email:     String(row[C.EMAIL] || '').trim().toLowerCase(),
      role:      String(row[C.ROLE]  || '').trim().toUpperCase(),
      name:      String(row[C.NAME]  || '').trim(),
      active:    Utils.parseBool(row[C.ACTIVE]),
      lastLogin: row[C.LAST_LOGIN] ? Utils.formatDate(row[C.LAST_LOGIN]) : null,
    };
  }

  function getRoleByEmail(email) {
    var sheet = _getSheet();
    if (!sheet) return null;
    var data = sheet.getDataRange().getValues();
    var normalised = (email || '').trim().toLowerCase();
    for (var i = 1; i < data.length; i++) {
      var user = _rowToUser(data[i]);
      if (user.email === normalised) return user;
    }
    return null;
  }

  function getAllUsers() {
    var sheet = _getSheet();
    if (!sheet) return [];
    var data = sheet.getDataRange().getValues();
    var users = [];
    for (var i = 1; i < data.length; i++) {
      if (data[i][Config.USER_COLS.EMAIL]) users.push(_rowToUser(data[i]));
    }
    return users;
  }

  function upsertUser(email, role, name) {
    var sheet = _getSheet();
    if (!sheet) throw new Error('UserRoles sheet not found');
    var data = sheet.getDataRange().getValues();
    var normalised = (email || '').trim().toLowerCase();
    var C = Config.USER_COLS;

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][C.EMAIL]).trim().toLowerCase() === normalised) {
        sheet.getRange(i + 1, C.ROLE + 1).setValue(role);
        sheet.getRange(i + 1, C.NAME + 1).setValue(name || data[i][C.NAME]);
        sheet.getRange(i + 1, C.ACTIVE + 1).setValue(true);
        return;
      }
    }
    // New row
    sheet.appendRow([normalised, role.toUpperCase(), name || '', true, '']);
  }

  function updateLastLogin(email) {
    var sheet = _getSheet();
    if (!sheet) return;
    var data = sheet.getDataRange().getValues();
    var normalised = (email || '').trim().toLowerCase();
    var C = Config.USER_COLS;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][C.EMAIL]).trim().toLowerCase() === normalised) {
        sheet.getRange(i + 1, C.LAST_LOGIN + 1).setValue(new Date());
        return;
      }
    }
  }

  return {
    getRoleByEmail: getRoleByEmail,
    getAllUsers: getAllUsers,
    upsertUser: upsertUser,
    updateLastLogin: updateLastLogin,
  };

})();
