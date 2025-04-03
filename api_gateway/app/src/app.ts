import fastify from 'fastify'
import cors from '@fastify/cors'
import OAuthRoute from './routes/OAuth'
import db from './types/Databases';


try {
    db.transient.exec(`create table IF NOT EXISTS 'signin_states' ( 'state' TEXT NOT NULL PRIMARY KEY, 'created' INT NOT NULL)`);
    db.persistent.exec(`create table IF NOT EXISTS 'users'
                        ( 'UID' TEXT NOT NULL PRIMARY KEY, 'display_name' TEXT NOT NULL UNIQUE,
                          'picture_url' TEXT NOT NULL, 'access_token' TEXT, 'refresh_token' TEXT,
                          'ate' INT, 'rte' INT)`);
}
catch (err) {
    console.log("fatal error: " + err);
    process.exit(1);
}

const port: number = parseInt(process.env.PORT || "3000");
const app = fastify({ logger: true });

app.register(cors, { origin: '*' });

// Register /OAuth routes
app.register(OAuthRoute, db);

app.listen({ port: port, host: '0.0.0.0' }, (err, addr) => {
    if (err) {
        app.log.error("fatal error: " + err);
        process.exit(1);
    }
    app.log.info("server now listen on: " + addr);
})