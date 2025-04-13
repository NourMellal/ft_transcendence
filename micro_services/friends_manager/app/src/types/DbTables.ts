export const friends_table_name = 'friends';
export const requests_table_name = 'requests';

export type FriendsModel = {
    UID: string,
    friends?: string,
};

export type RequestsModel = {
    REQ_ID: string,
    from_uid: string,
    to_uid: string,
};


