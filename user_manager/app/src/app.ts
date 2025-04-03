import fastify from 'fastify'
import cors from '@fastify/cors'
import signinRoute from './routes/signin'
import OAuthCodeRoute from './routes/OAuthCode'
import sqlite from 'node:sqlite';

const database = new sqlite.DatabaseSync(process.env.SQLITE_PATH || ':memory:');
try {
    database.exec("create table IF NOT EXISTS `signin_states` ( `state` TEXT NOT NULL PRIMARY KEY )");
}
catch (err) {
    console.log("fatal error: " + err);
    process.exit(1);
}

const port: number = parseInt(process.env.PORT || "3000");
const app = fastify({ logger: true });

app.register(cors, { origin: '*' });
app.register(signinRoute, database);
app.register(OAuthCodeRoute, database);

app.listen({ port: port, host: '0.0.0.0' }, (err, addr) => {
    if (err) {
        app.log.error("fatal error: " + err);
        process.exit(1);
    }
    app.log.info("server now listen on: " + addr);
})