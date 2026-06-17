// ============================================================
// UserService.gs — UserRoles sheet operations
// ============================================================

var UserService = (function () {

  // Fixed mapping from display role to privilege (not user-overridable)
  var DISPLAY_ROLE_TO_PRIVILEGE = {
    'Treasurer':        'SuperAdmin',
    'President':        'Admin',
    'Secretary':        'Admin',
    'Committee Member': 'Admin',
    'Care Taker':       'CT',
    'Owner':            'User',
    'Tenant':           'Guest',
  };

  function _derivePrivilege(displayRole) {
    return DISPLAY_ROLE_TO_PRIVILEGE[displayRole] || 'Guest';
  }

  function _getSheet() {
    return Config.getStakeholdersSheet(Config.TABS.USER_ROLES);
  }

  function _rowToUser(row) {
    var C           = Config.USER_COLS;
    var displayRole = String(row[C.DISPLAY_ROLE] || '').trim();
    var privilege   = String(row[C.PRIVILEGE]    || '').trim();

    // Derive privilege if not stored (backward compat with old ROLE column values)
    if (!privilege) {
      privilege = _derivePrivilege(displayRole);
    }

    var lastLoginRaw = row[C.LAST_LOGIN];
    var lastLogin = null;
    if (lastLoginRaw instanceof Date) {
      lastLogin = Utils.formatDate(lastLoginRaw);
    } else if (lastLoginRaw) {
      lastLogin = String(lastLoginRaw).trim();
    }

    return {
      email:       String(row[C.EMAIL] || '').trim().toLowerCase(),
      displayRole: displayRole,
      privilege:   privilege,
      name:        String(row[C.NAME]  || '').trim(),
      active:      Utils.parseBool(row[C.ACTIVE]),
      lastLogin:   lastLogin,
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

  // displayRole is the association title (e.g. 'Treasurer').
  // privilege may be explicitly provided; falls back to auto-derived value.
  function upsertUser(email, displayRole, name, privilege) {
    var sheet = _getSheet();
    if (!sheet) throw new Error('UserRoles sheet not found');
    var data       = sheet.getDataRange().getValues();
    var normalised = (email || '').trim().toLowerCase();
    var resolvedPrivilege = (privilege && privilege.trim()) ? privilege.trim() : _derivePrivilege(displayRole);
    var C          = Config.USER_COLS;

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][C.EMAIL]).trim().toLowerCase() === normalised) {
        sheet.getRange(i + 1, C.DISPLAY_ROLE + 1).setValue(displayRole);
        sheet.getRange(i + 1, C.PRIVILEGE    + 1).setValue(resolvedPrivilege);
        sheet.getRange(i + 1, C.NAME         + 1).setValue(name || data[i][C.NAME]);
        sheet.getRange(i + 1, C.ACTIVE       + 1).setValue(true);
        return;
      }
    }
    // New row: EMAIL | DISPLAY_ROLE | PRIVILEGE | NAME | ACTIVE | LAST_LOGIN
    sheet.appendRow([normalised, displayRole, resolvedPrivilege, name || '', true, '']);
  }

  function updateLastLogin(email) {
    var sheet = _getSheet();
    if (!sheet) return;
    var data       = sheet.getDataRange().getValues();
    var normalised = (email || '').trim().toLowerCase();
    var C          = Config.USER_COLS;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][C.EMAIL]).trim().toLowerCase() === normalised) {
        sheet.getRange(i + 1, C.LAST_LOGIN + 1).setValue(new Date());
        return;
      }
    }
  }

  return {
    getRoleByEmail:  getRoleByEmail,
    getAllUsers:      getAllUsers,
    upsertUser:      upsertUser,
    updateLastLogin: updateLastLogin,
  };

})();
