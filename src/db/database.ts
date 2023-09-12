import {createPool} from "mysql2"; // do not use 'mysql2/promises'!
import {Kysely, MysqlDialect} from "kysely";
import {DB} from "../types/types";
import dotenv from "dotenv";

dotenv.config();

const dialect = new MysqlDialect({
  pool: createPool({
    uri: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  }),
});

export const db = new Kysely<DB>({
  dialect,
});
