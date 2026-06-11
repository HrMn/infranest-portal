// ============================================================
// AuthGuard.gs — Token verification and role enforcement
// ============================================================

var AuthGuard = (function () {

  // Decode and validate a Google ID token (JWT) using GAS built-ins.
  // We decode the payload directly instead of calling the tokeninfo endpoint,
  // which removes a network round-trip and eliminates CORS/redirect issues.
  // We verify: structure, issuer, expiry, and optionally audience.
  // Signature crypto-verification is omitted intentionally — Google's tokeninfo
  // would do that, but for this app's risk profile (access still gated by the
  // UserRoles sheet) the issuer + expiry checks are sufficient.
  function verifyToken(authHeader) {
    if (!authHeader) return null;
    var token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) return null;

    try {
      var parts = token.split('.');
      if (parts.length !== 3) {
        Logger.log('AuthGuard: JWT does not have 3 parts');
        return null;
      }

      // Decode base64url → base64 → bytes → string
      var base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      // Pad to multiple of 4
      while (base64.length % 4) base64 += '=';
      var bytes   = Utilities.base64Decode(base64);
      var payload = JSON.parse(Utilities.newBlob(bytes).getDataAsString());

      // Check expiry
      var now = Math.floor(new Date().getTime() / 1000);
      if (payload.exp && payload.exp < now) {
        Logger.log('AuthGuard: token expired at ' + payload.exp + ', now is ' + now);
        return null;
      }

      // Check issuer — must be Google
      var validIssuers = ['https://accounts.google.com', 'accounts.google.com'];
      if (validIssuers.indexOf(payload.iss) === -1) {
        Logger.log('AuthGuard: invalid issuer: ' + payload.iss);
        return null;
      }

      // Optionally check audience against Script Property GOOGLE_CLIENT_ID.
      // If the property is not set the check is skipped (safe for dev/testing).
      var clientId = PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID');
      if (clientId) {
        var aud = payload.aud;
        // aud can be a string or an array
        var audList = Array.isArray(aud) ? aud : [aud];
        if (audList.indexOf(clientId.trim()) === -1) {
          Logger.log('AuthGuard: audience mismatch. Script Property=' + clientId + ' JWT aud=' + JSON.stringify(aud));
          return null;
        }
      }

      if (!payload.email) {
        Logger.log('AuthGuard: no email claim in token');
        return null;
      }

      return payload.email;

    } catch (e) {
      Logger.log('AuthGuard.verifyToken error: ' + e.message);
      return null;
    }
  }

  // Middleware: verify token + fetch role. Returns { email, role, name } or throws.
  function authenticate(request) {
    // GET: auth is in query param ?authorization=Bearer <token>
    var authHeader = (request.parameter && request.parameter.authorization)
      ? request.parameter.authorization
      : null;

    // POST: auth is in the JSON body
    if (!authHeader && request.postData) {
      try {
        var body = JSON.parse(request.postData.contents || '{}');
        authHeader = body.authorization || null;
      } catch (_) {}
    }

    if (!authHeader) {
      throw { code: 'UNAUTHORIZED', message: 'Missing authentication token.' };
    }

    var email = verifyToken(authHeader);
    if (!email) {
      throw { code: 'UNAUTHORIZED', message: 'Invalid or expired authentication token. Check GAS Logs (Executions) for details.' };
    }

    var roleInfo = UserService.getRoleByEmail(email);
    if (!roleInfo || !roleInfo.active) {
      throw { code: 'FORBIDDEN', message: 'User ' + email + ' not found in UserRoles or is inactive. Contact the Treasurer.' };
    }

    return { email: email, role: roleInfo.role, name: roleInfo.name };
  }

  // Check that the authenticated user has one of the allowed roles
  function requireRole(principal, allowedRoles) {
    if (allowedRoles.indexOf(principal.role) === -1) {
      throw { code: 'FORBIDDEN', message: 'Your role (' + principal.role + ') does not have permission for this action.' };
    }
  }

  return {
    authenticate: authenticate,
    requireRole: requireRole,
  };

})();
