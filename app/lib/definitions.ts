export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
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