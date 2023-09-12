import {Request, Response} from "express";
import {validationResult} from "express-validator";
import {db} from "../db/database";

const getUser = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({errors: errors.array()});
    }

  
    res.status(200).json({message: "User is authenticated"});
  } catch (error) {}
};

export {getUser};
