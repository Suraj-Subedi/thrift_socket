import express from "express";
import {getUserValidator} from "../helpers/validator";
import {getUser} from "../controllers/user_controller";

export default (router: express.Router) => {
  router.get("/user", getUserValidator, getUser);
};
