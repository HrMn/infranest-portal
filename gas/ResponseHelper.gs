// ============================================================
// ResponseHelper.gs — Standardised JSON response builders
// ============================================================

var ResponseHelper = (function () {

  function _jsonOutput(payload) {
    return ContentService
      .createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);
  }

  function success(data) {
    return _jsonOutput({
      success: true,
      data: data,
      timestamp: new Date().toISOString(),
    });
  }

  function error(code, message) {
    return _jsonOutput({
      success: false,
      error: { code: code, message: message },
      timestamp: new Date().toISOString(),
    });
  }

  return { success: success, error: error };

})();
