import axios from "axios";
import {Server, Socket} from "socket.io";
import {ConnectedUser, activeUsers} from "../middlewares/auth_middleware";

interface Message {
  message: string;
  seller_id: string;
  customer_id: string;
  product_id?: string;
}

interface Typing {
  seller_id: string;
  customer_id: string;
}

const messageHandler = (io: Server, socket: Socket) => {
  const sendMessage = async (data: Message) => {
    try {
      //validate data
      const {message, seller_id, customer_id, product_id} = data;
      if (!message || !seller_id || !customer_id) {
        io.to(socket.id).emit(
          "message_error",
          "message, seller_id, customer_id is required"
        );
        return;
      }

      var response = await axios.post(
        socket.data.store_chat_api,
        {
          message,
          seller_id,
          customer_id,
          product_id,
        },
        {
          headers: {
            Authorization: socket.data.authToken,
          },
        }
      );

      if (response.status >= 300) {
        io.to(socket.id).emit("message_error", "Message sending failed");
      }

      const {id} = response.data.message;
      const {service_userId, user_id} = socket.data;
      const receiverId = user_id === seller_id ? customer_id : seller_id;

      const service = activeUsers.find(
        (service) => service.service_userId === service_userId
      );

      if (!service) {
        io.to(socket.id).emit("message_error", "Service not found");
        return;
      }

      const senderSockets: ConnectedUser[] = service.connectedUsers.filter(
        (user) => user.userId.toString() === user_id.toString()
      );

      if (senderSockets.length > 0) {
        senderSockets.forEach((senderSocket) => {
          io.to(senderSocket.socketId).emit("sent", response.data.data);
        });
      } else {
        io.to(socket.id).emit("message_error", "Sender not found ");
      }

      const receiverSockets: ConnectedUser[] = service.connectedUsers.filter(
        (user) => user.userId.toString() === receiverId.toString()
      );

      if (receiverSockets.length > 0) {
        receiverSockets.forEach((receiverSocket) => {
          io.to(receiverSocket.socketId).emit("message", response.data.data);
          io.to(receiverSocket.socketId).emit(
            "notification",
            response.data.data
          );
        });
      } else {
        io.to(socket.id).emit("message_error", "Receiver not found ");
      }
    } catch (error) {
      console.log(error);
      return socket.emit("message_error", error.message);
    }
  };

  const sendTypingStatus = (data: Typing) => {
    try {
      const {seller_id, customer_id} = data;

      if (!seller_id || !customer_id)
        return io
          .to(socket.id)
          .emit("message_error", "seller_id and customer_id is required");

      const {service_userId, user_id} = socket.data;
      const receiverId = user_id === seller_id ? customer_id : seller_id;

      const service = activeUsers.find(
        (service) => service.service_userId === service_userId
      );

      if (!service) {
        io.to(socket.id).emit("message_error", "Service not found");
        return;
      }

      const receiverSockets: ConnectedUser[] = service.connectedUsers.filter(
        (user) => user.userId.toString() === receiverId.toString()
      );

      if (receiverSockets.length === 0) {
        io.to(socket.id).emit("message_error", "Receiver not found ");
        return;
      }

      receiverSockets.forEach((receiverSocket) => {
        io.to(receiverSocket.socketId).emit("typing", data);
      });
    } catch (error) {
      return socket.emit("message_error", 'Error in "typing" event');
    }
  };

  socket.on("message", sendMessage);
  socket.on("typing", sendTypingStatus);
};

export {messageHandler};
