import { PrismaClient } from '.prisma/client';

// 将 PrismaClient 从 .prisma/client 重新导出到 @prisma/client 命名空间
declare module '@prisma/client' {
  export { PrismaClient };
  
  // 定义 Prisma 命名空间以包含所需类型
  export namespace Prisma {
    export type EnumTaskStatusFilter = {
      equals?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
      in?: ('NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED')[];
      notIn?: ('NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED')[];
      not?: EnumTaskStatusFilter;
    };
    
    export type tasksWhereInput = {
      AND?: tasksWhereInput[];
      OR?: tasksWhereInput[];
      NOT?: tasksWhereInput[];
      id?: string | StringFilter;
      title?: string | StringFilter;
      description?: string | StringFilter | null;
      status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | EnumTaskStatusFilter;
      assignee_id?: string | StringFilter | null;
      project_id?: string | StringFilter | null;
      creator_id?: string | StringFilter;
      created_at?: Date | DateTimeFilter;
      updated_at?: Date | DateTimeFilter;
      [key: string]: any;
    };
    
    // 添加基本的类型定义
    export type StringFilter = {
      equals?: string;
      in?: string[];
      notIn?: string[];
      contains?: string;
      startsWith?: string;
      endsWith?: string;
      not?: string | StringFilter;
      [key: string]: any;
    };
    
    export type DateTimeFilter = {
      equals?: Date;
      in?: Date[];
      notIn?: Date[];
      lt?: Date;
      lte?: Date;
      gt?: Date;
      gte?: Date;
      not?: Date | DateTimeFilter;
      [key: string]: any;
    };
  }
} 