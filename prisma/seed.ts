import 'dotenv/config';
import { PrismaClient, EntityStatus } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { databaseUrl } from '@/prisma/database-url';

const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl()),
});

async function main() {
  // 1. Danh sách Permissions chuẩn theo Business Logic & RBAC
  const permissionsList = [
    // System & Company
    { code: 'SYSTEM_MANAGE', description: 'Toàn quyền quản trị hệ thống' },
    { code: 'COMPANY_VIEW', description: 'Xem thông tin doanh nghiệp' },
    {
      code: 'COMPANY_CREATE',
      description: 'Tạo và cấp tài khoản doanh nghiệp',
    },
    { code: 'COMPANY_UPDATE', description: 'Cập nhật thông tin doanh nghiệp' },
    {
      code: 'COMPANY_CREDIT_UPDATE',
      description: 'Cấp và điều chỉnh hạn mức công nợ',
    },

    // User Management
    { code: 'USER_VIEW', description: 'Xem danh sách người dùng' },
    { code: 'USER_CREATE', description: 'Tạo tài khoản người dùng' },
    { code: 'USER_UPDATE', description: 'Cập nhật tài khoản người dùng' },
    { code: 'USER_SUSPEND', description: 'Khóa tài khoản người dùng' },

    // Role & Permission
    { code: 'ROLE_MANAGE', description: 'Quản lý role và gán quyền' },
    { code: 'PERMISSION_MANAGE', description: 'Quản lý permission' },

    // Catalog & Pricing
    { code: 'PRODUCT_VIEW', description: 'Xem danh mục sản phẩm' },
    { code: 'PRODUCT_CREATE', description: 'Tạo sản phẩm và variant' },
    { code: 'PRODUCT_UPDATE', description: 'Cập nhật sản phẩm và variant' },
    { code: 'PRODUCT_DELETE', description: 'Xóa sản phẩm' },
    { code: 'CATEGORY_VIEW', description: 'Xem danh mục cha' },
    { code: 'CATEGORY_CREATE', description: 'Tạo danh mục cha' },
    { code: 'CATEGORY_UPDATE', description: 'Cập nhật danh mục cha' },
    { code: 'CATEGORY_DELETE', description: 'Xóa danh mục cha' },
    { code: 'PRICING_VIEW', description: 'Xem bảng giá và pricing tiers' },
    { code: 'PRICING_MANAGE', description: 'Cấu hình giá và pricing tiers' },

    // Order
    { code: 'ORDER_VIEW', description: 'Xem đơn hàng' },
    { code: 'ORDER_CREATE', description: 'Tạo đơn hàng B2B' },
    { code: 'ORDER_APPROVE', description: 'Duyệt đơn hàng' },
    { code: 'ORDER_CANCEL', description: 'Hủy đơn hàng' },

    // Payment & Finance
    { code: 'PAYMENT_VIEW', description: 'Xem danh sách thanh toán' },
    { code: 'PAYMENT_CREATE', description: 'Khai báo thanh toán chuyển khoản' },
    { code: 'PAYMENT_APPROVE', description: 'Duyệt khoản thanh toán' },
    { code: 'PAYMENT_REJECT', description: 'Từ chối khoản thanh toán' },
    {
      code: 'PAYMENT_ALLOCATE',
      description: 'Phân bổ thanh toán vào đơn hàng',
    },
    { code: 'CREDIT_VIEW', description: 'Xem hạn mức và lịch sử công nợ' },
    { code: 'CREDIT_UPDATE', description: 'Cập nhật công nợ' },
    { code: 'CREDIT_ADJUST', description: 'Điều chỉnh công nợ thủ công' },
    { code: 'WALLET_VIEW', description: 'Xem số dư và lịch sử ví' },
    { code: 'WALLET_ADJUST', description: 'Điều chỉnh số dư ví' },

    // Logistics & Carriers
    { code: 'LOGISTICS_VIEW', description: 'Xem danh sách vận chuyển' },
    { code: 'LOGISTICS_CREATE', description: 'Tạo chuyến vận chuyển' },
    { code: 'LOGISTICS_ASSIGN', description: 'Điều phối xe và tài xế' },
    { code: 'LOGISTICS_UPDATE', description: 'Cập nhật trạng thái chuyến' },
    {
      code: 'SHIPPING_CARRIER_MANAGE',
      description: 'Quản lý đối tác vận chuyển',
    },
    { code: 'TRUCK_TYPE_MANAGE', description: 'Quản lý loại xe vận chuyển' },

    // System Operations
    { code: 'NOTIFICATION_VIEW', description: 'Xem thông báo' },
    { code: 'WEBHOOK_VIEW', description: 'Xem log webhook' },
    { code: 'AUDIT_LOG_VIEW', description: 'Xem audit log hệ thống' },
    { code: 'SYSTEM_SETTINGS_MANAGE', description: 'Cấu hình hệ thống' },
  ];

  for (const p of permissionsList) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: { description: p.description },
      create: {
        code: p.code,
        description: p.description,
      },
    });
  }

  // 2. Tạo 4 Roles chính theo nghiệp vụ
  const rolesData = [
    {
      name: 'SUPER_ADMIN',
      description: 'Super Administrator toàn quyền hệ thống',
    },
    {
      name: 'ADMIN',
      description: 'Internal Staff quản lý nghiệp vụ và đơn hàng',
    },
    {
      name: 'ACCOUNTANT',
      description: 'Kế toán quản lý thanh toán, công nợ, ví',
    },
    {
      name: 'PURCHASER',
      description: 'Đại diện/Nhân viên doanh nghiệp mua hàng',
    },
  ];

  const createdRoles: Record<string, any> = {};
  for (const r of rolesData) {
    createdRoles[r.name] = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: {
        name: r.name,
        description: r.description,
      },
    });
  }

  // 3. Gán full permissions cho SUPER_ADMIN
  const allPermissions = await prisma.permission.findMany();
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: createdRoles.SUPER_ADMIN.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: createdRoles.SUPER_ADMIN.id,
        permissionId: perm.id,
      },
    });
  }

  // 4. Gán permissions cho PURCHASER (External Company User)
  const purchaserPermissions = [
    'PRODUCT_VIEW',
    'PRICING_VIEW',
    'ORDER_VIEW',
    'ORDER_CREATE',
    'ORDER_CANCEL',
    'PAYMENT_VIEW',
    'PAYMENT_CREATE',
    'CREDIT_VIEW',
    'WALLET_VIEW',
    'LOGISTICS_VIEW',
    'NOTIFICATION_VIEW',
    'USER_CREATE', // Doanh nghiệp tạo tài khoản con
  ];

  const purchaserPermRecords = await prisma.permission.findMany({
    where: { code: { in: purchaserPermissions } },
  });

  for (const perm of purchaserPermRecords) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: createdRoles.PURCHASER.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: createdRoles.PURCHASER.id,
        permissionId: perm.id,
      },
    });
  }

  // 5. Gán permissions cho ACCOUNTANT
  const accountantPermissions = [
    'PAYMENT_VIEW',
    'PAYMENT_APPROVE',
    'PAYMENT_REJECT',
    'PAYMENT_ALLOCATE',
    'CREDIT_VIEW',
    'CREDIT_UPDATE',
    'CREDIT_ADJUST',
    'WALLET_VIEW',
    'WALLET_ADJUST',
    'NOTIFICATION_VIEW',
  ];

  const accountantPermRecords = await prisma.permission.findMany({
    where: { code: { in: accountantPermissions } },
  });

  for (const perm of accountantPermRecords) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: createdRoles.ACCOUNTANT.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: createdRoles.ACCOUNTANT.id,
        permissionId: perm.id,
      },
    });
  }

  // 6. Tạo tài khoản Super Admin ban đầu
  const hashedPassword = await bcrypt.hash('admin123456', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@b2blogistics.local' },
    update: {},
    create: {
      email: 'admin@b2blogistics.local',
      password: hashedPassword,
      fullName: 'System Administrator',
      status: EntityStatus.active,
      companyId: null, // Internal Staff
    },
  });

  // Gán Role SUPER_ADMIN cho Super Admin User
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: createdRoles.SUPER_ADMIN.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: createdRoles.SUPER_ADMIN.id,
    },
  });

  console.log(
    '✅ Seed dữ liệu khởi tạo Roles, Permissions và Super Admin thành công!',
  );
}

main()
  .catch((e) => {
    console.error('❌ Seed thất bại:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
