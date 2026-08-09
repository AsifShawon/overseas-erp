const { PrismaClient } = require('./generated/prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, email: true, roleId: true, isActive: true, isPlatformAdmin: true, mustChangePassword: true } });
    const memberships = await prisma.userMembership.findMany({ select: { id: true, userId: true, companyId: true, roleId: true, status: true, isOwner: true } });
    const companies = await prisma.company.findMany({ select: { id: true, name: true, status: true } });
    const roles = await prisma.role.findMany({ select: { id: true, name: true } });
    console.log(JSON.stringify({ users, memberships, companies, roles }, null, 2));
  } catch (error) {
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
