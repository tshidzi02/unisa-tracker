// ============================================================
// UNISA Study Tracker — app-init.js
// Bootstrap: runs once after all other scripts have loaded.
// Must be the LAST script tag (before app-resources.js).
// ============================================================

loadModuleOverridesFromStorage();
updateModuleFilter();
renderDashboard();
renderModules();
renderCalendar();
