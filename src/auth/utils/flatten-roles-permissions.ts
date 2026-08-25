type RolePermissionNode = {
  role: {
    name: string;
    rolePermissions: Array<{ permission: { code: string } }>;
  };
};

export function flattenRolesPermissions(userRoles: RolePermissionNode[]): {
  roles: string[];
  permissions: string[];
} {
  const roles: string[] = [];
  const permissions = new Set<string>();

  for (const userRole of userRoles) {
    roles.push(userRole.role.name);
    for (const rolePermission of userRole.role.rolePermissions) {
      permissions.add(rolePermission.permission.code);
    }
  }

  return { roles, permissions: Array.from(permissions) };
}
