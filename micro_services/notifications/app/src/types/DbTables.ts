export const notifications_table_name = "notifications";

export type NotificationsModel = {
  UID: string;
  user_uid: string;
  messageJson: string;
  is_read: number;
};
