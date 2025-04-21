export const notifications_table_name = 'notifications'; 

export enum NotificationType {
    FriendRequest = 1,
    GameInvite,
    Poke,
}

export type NotificationsModel = {
    UID: string,
    type: NotificationType,
    messageJson: string,
};
