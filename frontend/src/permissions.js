// Single source of truth for role-based UI access, mirroring the
// Screen 8 (Settings & RBAC) permission matrix from the mockup.
//
// "full"  -> role can create/edit/delete on that page
// "view"  -> role can see the page, read-only
//
// Used by:
//   - App.js (route-level access: full + view roles may enter the route)
//   - Sidebar.js (only show nav links the current role can access)
//   - individual pages (to decide whether to show Add/Edit/Delete controls)

export const PERMISSIONS = {
  dashboard: {
    full: [],
    view: ["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"],
  },
  vehicles: {
    full: ["Fleet Manager"],
    view: ["Financial Analyst"],
  },
  drivers: {
    full: ["Safety Officer"],
    view: ["Fleet Manager", "Dispatcher"],
  },
  trips: {
    full: ["Dispatcher"],
    view: ["Fleet Manager"],
  },
  maintenance: {
    full: ["Fleet Manager"],
    view: [],
  },
  fuelExpenses: {
    full: ["Financial Analyst"],
    view: [],
  },
  analytics: {
    full: ["Financial Analyst"],
    view: ["Safety Officer"],
  },
  settings: {
    full: ["Fleet Manager"],
    view: [],
  },
};

// Roles allowed to enter a page at all (full or view).
export function rolesForPage(pageKey) {
  const perm = PERMISSIONS[pageKey];
  if (!perm) return [];
  return [...perm.full, ...perm.view];
}

// Whether a given role has write access on a page.
export function canManage(pageKey, role) {
  const perm = PERMISSIONS[pageKey];
  if (!perm) return false;
  return perm.full.includes(role);
}

// Whether a given role can see a page at all (full or view).
export function canAccess(pageKey, role) {
  return rolesForPage(pageKey).includes(role);
}
