export const conversations_table_name = "conversations_uids";
export const block_table_name = "block";

export type ConversationsUIDsModel = {
  UID: string;
  name:string;
  uid_1: string;
  uid_2: string;
  started:number
};

export type ConversationsModel = {
  message_uid: string;
  user_uid: string;
  message_text: string;
  time:number;
};

export type BlockModel = {
  UID: string;
  user_uid:string
  blocked_uid:string;
};
