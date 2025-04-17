import fastify, { FastifyRequest, RawRequestDefaultExpression } from 'fastify'
import cors from '@fastify/cors'
import OAuthRoute from './routes/OAuth'
import db from './classes/Databases';
import AuthProvider from './classes/AuthProvider';
import rabbitmq from './classes/RabbitMQ';
import DiscoveryDocumentRoute from './routes/DiscoveryDocument';
import UserManagerRoutes from './routes/microservices/user_manager';
import Busboy, { BusboyHeaders } from '@fastify/busboy';
import ParseMultipart from './controllers/multipart';
import { multipart_fields, multipart_files } from './types/multipart';
import AuthenticatorRoutes from './routes/Authenticator';
import FriendsManagerRoutes from './routes/microservices/friends_manager';

db.init();
AuthProvider.init();
rabbitmq.init();
const port: number = (process.env.LISTEN_PORT || 3000) as number;
const app = fastify({ logger: true });

// Register cors module to allow traffic from all hosts:
app.register(cors, { origin: '*' });
// Register api_gateway routes:
app.addContentTypeParser('multipart/form-data', ParseMultipart);
app.register(DiscoveryDocumentRoute);
app.register(OAuthRoute);
app.register(AuthenticatorRoutes);
// Register micro_services routes:
app.register(UserManagerRoutes);
app.register(FriendsManagerRoutes);

app.listen({ port: port, host: '0.0.0.0' }, (err, addr) => {
    if (err) {
        app.log.error("fatal error: " + err);
        process.exit(1);
    }
    app.log.info("server now listen on: " + addr);
});