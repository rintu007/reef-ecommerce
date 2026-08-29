export type AdminPermission = "manage_finances";

export interface AdminPermissionMeta {
  label: string;
  description: string;
}

/**
 * Additive layer on top of the binary `role: "admin"` — role still gates the
 * whole admin panel, this only restricts which money-moving actions a given
 * admin can take. Starts with just one permission (refund + store credit);
 * add more here as new sensitive actions need scoping, no migration needed
 * beyond this list since the DB column is a plain text[].
 */
export const ADMIN_PERMISSIONS: Record<AdminPermission, AdminPermissionMeta> = {
  manage_finances: {
    label: "Manage Finances",
    description: "Refund orders and issue store credit",
  },
};
