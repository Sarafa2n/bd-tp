import express, { Express } from 'express';
import pg from 'pg-promise/typescript/pg-subset';
import bodyParser from "body-parser";
import pgPromise from 'pg-promise';

export const pgp = require('pg-promise')(/*options*/);

export class App {
    public server: Express;

    public db: pgPromise.IDatabase<{}, pg.IClient> & {};

    private port: number;

    private hostname: string;

    constructor(config: any, port: number, hostname: string) {
        this.hostname = hostname;
        this.port = port;
        this.server = express();
        this.db = pgp(config);
    }

    setup() {
        this.server.use(bodyParser.urlencoded({ extended: true }));
        this.server.use(bodyParser.json());
    }

    start() {
        this.server.listen(this.port, this.hostname, () => {
            return console.log(`server is listening on ${this.hostname}:${this.port}`);
        });
    }
}
