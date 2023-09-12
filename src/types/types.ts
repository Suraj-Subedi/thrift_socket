import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type SocketToken = {
    id: Generated<number>;
    token: string;
    userId: number;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type User = {
    id: Generated<number>;
    email: string;
    password: string;
    name: string;
    user_validate_api: string;
    store_chat_api: string;
    emailVerified: Generated<number>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type DB = {
    SocketToken: SocketToken;
    User: User;
};
