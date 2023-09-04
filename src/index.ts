import express from "express";
import bodyParser from "body-parser";
import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import {Server} from "socket.io";
import {instrument} from "@socket.io/admin-ui";

const app = express();
dotenv.config();
app.use(cors());

app.use(compression());
app.use(bodyParser.json());

const server = http.createServer(app);
const port = process.env.PORT || 5001;

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://admin.socket.io",
    ],
    credentials: true,
  },
});

instrument(io, {
  auth: false,
  mode: "development",
});

interface ConnectedUser {
  userId: string;
  socketId: string;
}

let activeUsers: ConnectedUser[] = [];

io.on("connection", (socket) => {
  //no need to join as when connection is established it is joined to a room with its socket id
  //which is unique and can be used to send messages to that particular socket
  // this can be useful for private messaging

  //no we have to keep track of the user and it's socket id
  //so that we can send messages to that particular user when that
  // user receives any messages

  socket.on("join", (userId) => {
    // console.log(socket.id);
    // console.log(userId);
    const user: ConnectedUser = {
      userId: userId,
      socketId: socket.id,
    };
    activeUsers.push(user);
    console.log(activeUsers);
  });

  socket.on("disconnecting", async () => {
    activeUsers.forEach((user) => {
      if (user.socketId === socket.id) {
        activeUsers = activeUsers.filter((u) => u.socketId !== socket.id);
      }
    });
    // console.log("disconnecting");
    // console.log(activeUsers);
  });

  socket.on("message", (msg) => {
    var data = JSON.parse(msg);

    const index = activeUsers.findIndex(
      (user) => user.userId === data["messaged_to"]
    );

    io.in(activeUsers[index].socketId).emit("message", msg);
  });
});

server.listen(port, () => {
  console.log(`Server listening on port http://localhost:${port}`);
});
