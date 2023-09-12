import {Server} from "socket.io";
import {db} from "../db/database";
import axios from "axios";

interface Services {
  service_userId: string;
  connectedUsers: ConnectedUser[];
}

interface ConnectedUser {
  userId: string;
  socketId: string;
}

let activeUsers: Services[] = [];

const authMiddleware = (io: Server) =>
  io.use(async (socket, next) => {
    const token = socket.handshake.headers.token;
    const socketToken = socket.handshake.headers.sockettoken;

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

    // const {user_validate_api, service_userId, authToken} = socket.data;

    var response = await axios.post(user_validate_api,{}, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization":socket.data.authToken,
      },
    });

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
        connectedUsers: [{userId:user_id, socketId: socket.id}],
      });
    } else {
      const user = service.connectedUsers.find((user) => user.userId === user_id);

      if (!user) {
        service.connectedUsers.push({userId: user_id, socketId: socket.id});
      } else {
        user.socketId = socket.id;
      }
    }
   
    // console.log(activeUsers);
    // console.log(activeUsers[0]);

    next();
  });

export {authMiddleware, activeUsers};
