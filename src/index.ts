import express from "express";
import bodyParser from "body-parser";
import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import {Server, Socket} from "socket.io";
import {instrument} from "@socket.io/admin-ui";

import {onUserJoin} from "./controllers/socket_controller";
import {joinHandler} from "./handlers/join_handler";
import {authMiddleware} from "./middlewares/auth_middleware";
import {messageHandler} from "./handlers/message_handler";

const app = express();
dotenv.config();
app.use(cors());

app.use(compression());
app.use(bodyParser.json());

const server = http.createServer(app);
const port = process.env.PORT || 5001;

export const io = new Server(server, {
  cors: {
    origin: ["*", "https://admin.socket.io"],
    credentials: true,
  },
});

instrument(io, {
  auth: false,

  mode: "development",
});

authMiddleware(io);

const onConnection = (socket: Socket) => {
  // joinHandler(io, socket);
  messageHandler(io, socket);
};

io.on("connection", onConnection);

server.listen(port, () => {
  console.log(`Server listening on port http://localhost:${port}`);
  app.get("/", (req, res) => {
    res.send("<h1>Welcome to the thrift-socket api v3</h1>");
  });
});
