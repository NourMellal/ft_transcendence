import fastify from 'fastify'
import cors from '@fastify/cors'
import OAuthRoute from './routes/OAuth'
import db from './classes/Databases';
import Auth from './classes/AuthProvider';

db.initDb();
Auth.init();
const port: number = parseInt(process.env.PORT || "3000");
const app = fastify({ logger: true });

// Register cors module to allow traffic from all hosts
app.register(cors, { origin: '*' });
// Register /OAuth routes
app.register(OAuthRoute);

app.listen({ port: port, host: '0.0.0.0' }, (err, addr) => {
    if (err) {
        app.log.error("fatal error: " + err);
        process.exit(1);
    }
    app.log.info("server now listen on: " + addr);
})