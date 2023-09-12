import axios from "axios";
import { json } from "body-parser";
import {Server, Socket} from "socket.io";

interface Services {
  service_userId: string;
  connectedUsers: ConnectedUser[];
}

interface ConnectedUser {
  userId: string;
  socketId: string;
}

let activeUsers: Services[] = [];

const joinHandler = (io: Server, socket: Socket) => {
  const joinUser = async (data: string) => {
    try {
      const {user_validate_api, service_userId, authToken} = socket.data;

      var response = await axios.post(user_validate_api,{}, {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization":authToken,
        },
      });

      if (response.status !== 200) {
        throw new Error("User validation failed");
      }

      const {id} = response.data.user;
      socket.data.userId = id;

      const service = activeUsers.find(
        (service) => service.service_userId === service_userId
      );

      if (!service) {
        activeUsers.push({
          service_userId,
          connectedUsers: [{userId: id, socketId: socket.id}],
        });
      } else {
        const user = service.connectedUsers.find((user) => user.userId === id);

        if (!user) {
          service.connectedUsers.push({userId: id, socketId: socket.id});
        } else {
          user.socketId = socket.id;
        }
      }
      console.log(activeUsers.map((service) => service.connectedUsers));

    } catch (error) {
      
      console.log(error.response.data);
      return socket.emit("join_error", error.message);
    }
  };

  socket.on("join", joinUser);
};

export {joinHandler,activeUsers};
