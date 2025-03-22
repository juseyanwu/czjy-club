export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string; // 'admin' 或 'user'
};

export type EventsTable = {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  image_url?: string; // 活动图片URL
  organizer_name: string; // 组织者名称
  created_at: string;
};

// 活动表单类型
export type EventForm = {
  id?: string;
  title: string;
  date: string;
  location: string;
  description: string;
  image_url?: string; // 活动图片URL
  organizer_id: string;
};

// 任务状态类型
export enum TaskStatus {
  NOT_STARTED = 'NOT_STARTED', // 未开始
  IN_PROGRESS = 'IN_PROGRESS', // 进行中
  COMPLETED = 'COMPLETED'      // 已完成
}

// 任务类型
export type Task = {
  id: string;
  title: string;
  description?: string;
  location?: string;
  due_date?: string;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
  creator_id: string;
  creator_name: string;
  assignee_id?: string;
  assignee_name?: string;
  comments?: TaskComment[]; // 任务评论
  logs?: TaskLog[];         // 任务日志
};

// 任务表单类型
export type TaskForm = {
  id?: string;
  title: string;
  description?: string;
  location?: string;
  due_date?: string;
  assignee_id?: string;
  status?: TaskStatus;
};

// 任务评论类型
export type TaskComment = {
  id: string;
  task_id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
};

// 任务日志类型
export type TaskLog = {
  id: string;
  task_id: string;
  user_id: string;
  user_name: string;
  old_status?: TaskStatus;
  new_status: TaskStatus;
  message?: string;
  created_at: string;
};