// 为@prisma/client添加声明
declare module '@prisma/client' {
  export namespace Prisma {
    type EnumTaskStatusFilter = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    type tasksWhereInput = Record<string, any>;
  }
} 