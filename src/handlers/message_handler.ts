import axios from "axios";
import {Server, Socket} from "socket.io";
import { activeUsers } from "../middlewares/auth_middleware";


interface Message {
  message: string;
  seller_id: string;
  customer_id: string;
  product_id?: string;
}

const messageHandler = (io: Server, socket: Socket) => {
  const sendMessage = async (data: Message) => {
    try {
      //validate data
      const {message, seller_id, customer_id, product_id} = data;
      if (!message || !seller_id || !customer_id) {
        io.to(socket.id).emit("message_error", "message, seller_id, customer_id is required");
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

      if (response.status >=300) {
        // throw new Error("Message sending failed");
        io.to(socket.id).emit("message_error", "Message sending failed");
      }

      const {id} = response.data.message;
      const {service_userId, user_id} = socket.data;

      // console.log(user_id, seller_id, customer_id);

      const receiverId = user_id === seller_id ? customer_id : seller_id;

;

      const service = activeUsers.find(
        (service) => service.service_userId === service_userId
      );

      if(!service){
        io.to(socket.id).emit("message_error", "Service not found");
        return;
      }


      const receiverSocket = service.connectedUsers.find(
        (user) => user.userId === receiverId
      );
      
      if (receiverSocket){
        io.to(receiverSocket.socketId).emit("message", {
          id,
          message,
          seller_id,
          customer_id,
          product_id,
        });
      }


      // io.to(socket.id).emit("message", {
      //   id,
      //   message,
      //   seller_id,
      //   customer_id,
      //   product_id,
      // });

      
    } catch (error) {
      console.log(error);
      return socket.emit("message_error", error.message);
    }
  };

  socket.on("message", sendMessage);
};

export {messageHandler};