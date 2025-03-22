// 为@prisma/client添加声明
declare module '@prisma/client' {
  export class PrismaClient {
    constructor(options?: any);
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    tasks: any;
    users: any;
    task_comments: any;
    task_logs: any;
    events: any;
    event_registrations: any;
  }
  
  export namespace Prisma {
    type EnumTaskStatusFilter = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
    type tasksWhereInput = Record<string, any>;
  }
} 