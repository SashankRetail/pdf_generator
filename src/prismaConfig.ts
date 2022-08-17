import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
const changePath = async () => {
  await prisma.$queryRaw`SET search_path TO "$user", public;`;
};
changePath();
