import {check} from "express-validator";

const storeChatValidator = [
  //message, seller_id, customer_id,product_id
  check("message").notEmpty().withMessage("message is required"),
  check("seller_id").notEmpty().withMessage("seller_id is required"),
  check("customer_id").notEmpty().withMessage("customer_id is required"),
  check("product_id").optional(),
];

const getUserValidator = [
  //auth_token,socket_token
  check("auth_token").notEmpty().withMessage("auth_token is required"),
  // check("socket_token").notEmpty().withMessage("socket_token is required"),
];

export {storeChatValidator, getUserValidator};
