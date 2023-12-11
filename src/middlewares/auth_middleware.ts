import {Server} from "socket.io";
import {db} from "../db/database";
import axios from "axios";

interface Services {
  service_userId: string;
  connectedUsers: ConnectedUser[];
}

export interface ConnectedUser {
  userId: string;
  socketId: string;
}

let activeUsers: Services[] = [];

const authMiddleware = (io: Server) =>
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const socketToken = socket.handshake.auth.socketToken;

      if (!token || !socketToken) {
        return next(new Error("Token and socketToken is required"));
      }

      let result = await db
        .selectFrom("SocketToken")
        .innerJoin("User", "User.id", "SocketToken.userId")
        .where("token", "=", socketToken)
        .select(["User.id", "User.store_chat_api", "User.user_validate_api"])
        .executeTakeFirst();

      if (!result) {
        return next(new Error("SocketToken is invalid"));
      }

      const {id, store_chat_api, user_validate_api} = result;

      socket.data.service_userId = id;
      socket.data.store_chat_api = store_chat_api;
      socket.data.user_validate_api = user_validate_api;
      socket.data.authToken = token;

      var response = await axios.post(
        user_validate_api,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: socket.data.authToken,
          },
        }
      );

      if (response.status !== 200) {
        throw new Error("User validation failed");
      }

      const user_id = response.data.user.id;
      socket.data.user_id = user_id;

      const service = activeUsers.find(
        (service) => service.service_userId === socket.data.service_userId
      );

      if (!service) {
        activeUsers.push({
          service_userId: socket.data.service_userId,
          connectedUsers: [{userId: user_id, socketId: socket.id}],
        });
      } else {
        service.connectedUsers.push({userId: user_id, socketId: socket.id});
      }
      next();
    } catch (error) {
      console.log(error);

      console.log("there is error in auth middleware");
    }
  });

export {authMiddleware, activeUsers};
