import { FastifyReply, FastifyRequest } from "fastify";
import { UserModel } from "../types/DbTables";
import fs from "fs";
import { multipart_fields, multipart_files } from "../types/multipart";
import db from "../classes/Databases";
import crypto from "crypto";
import { RabbitMQRequest, RabbitMQUserManagerOp } from "../types/RabbitMQMessages";
import AuthProvider from "../classes/AuthProvider";
import rabbitmq from "../classes/RabbitMQ";

export const IsDisplayNameAvailable = async (request: FastifyRequest<{ Querystring: { username: string } }>, reply: FastifyReply) => {
    try {
        const { username } = request.query;
        if (username.length < 3)
            return reply.code(400).send();
        const query = db.persistent.prepare('SELECT username FROM users where username = ? ;');
        const res = query.get(username);
        if (res === undefined)
            return reply.code(200).send();
        return reply.code(406).send();
    } catch (error) {
        console.log(`ERROR: IsDisplayNameAvailable(): ${error}`);
        return reply.code(500).send("ERROR: internal error, try again later.");
    }
}

export const SignUpNewStandardUser = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.is_valid_multipart)
        return reply.code(400).send('bad request');
    const username: multipart_fields | undefined = request.fields.find((field: multipart_fields, i) => field.field_name === 'username');
    const psswd: multipart_fields | undefined = request.fields.find((field: multipart_fields, i) => field.field_name === 'password');
    const image: multipart_files | undefined = request.files_uploaded.find((file: multipart_files) => file.field_name === 'picture');
    if (!username || !psswd || username.field_value.length < 3 || psswd.field_value.length < 8)
        return reply.code(400).send('Provide a valid username and a password more than 7 chars');
    if (image && image.mime_type !== 'image/jpeg')
        return reply.code(400).send(`only image jpeg are allowed`);
    var NewUser: UserModel;
    try {
        const hasher = crypto.createHash('sha256');
        hasher.update(Buffer.from(psswd.field_value));
        NewUser = db.CreateNewStandardUser(username.field_value, hasher.digest().toString());
    } catch (error) {
        console.log(`ERROR: SignUpNewStandardUser(): ${error}`);
        return reply.code(400).send("username already taken try another one.");
    }
    var picture_url = `/static/profile/default.jpg`;
    if (image) {
        picture_url = `/static/profile/${NewUser.UID}.jpg`;
        fs.writeFileSync(picture_url, image.field_file.read());
    }
    try {
        reply.hijack();
        const jwt = AuthProvider.jwtFactory.CreateJWT(NewUser.UID, username.field_value, picture_url);
        const jwt_token = AuthProvider.jwtFactory.SignJWT(jwt);
        const RabbitMQReq: RabbitMQRequest = {
            op: RabbitMQUserManagerOp.CREATE_STANDARD,
            id: '',
            JWT: jwt
        };
        rabbitmq.sendToUserManagerQueue(RabbitMQReq, reply, jwt, jwt_token);
    } catch (error) {
        const query = db.persistent.prepare('DELETE FROM users WHERE UID = ? ;');
        query.run(NewUser.UID);
        if (image && fs.existsSync(picture_url))
            fs.unlinkSync(picture_url);
        console.log(`ERROR: SignUpNewStandardUser(): ${error}`);
        reply.raw.statusCode = 500;
        return reply.raw.end("ERROR: internal error, try again later.");
    }
}

export const SignInStandardUser = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.is_valid_multipart)
        return reply.code(400).send('bad request');
    const username: multipart_fields | undefined = request.fields.find((field: multipart_fields, i) => field.field_name === 'username');
    const psswd: multipart_fields | undefined = request.fields.find((field: multipart_fields, i) => field.field_name === 'password');
    if (!username || !psswd || username.field_value.length < 3 || psswd.field_value.length < 8)
        return reply.code(400).send('Provide a valid username and a password more than 7 chars');
    try {
        const hasher = crypto.createHash('sha256');
        hasher.update(Buffer.from(psswd.field_value));
        const query = db.persistent.prepare('SELECT * from users WHERE username = ? AND password_hash = ? ;');
        const res = query.get(username.field_value, hasher.digest().toString()) as UserModel;
        console.log(res);
        if (res) {
            const jwt = AuthProvider.jwtFactory.CreateJWT(res.UID, res.username);
            const jwt_token = AuthProvider.jwtFactory.SignJWT(jwt);
            const expiresDate = new Date(jwt.exp * 1000).toUTCString();
            reply.headers({ "set-cookie": `jwt=${jwt_token}; Path=/; Expires=${expiresDate}; Secure; HttpOnly` });
            reply.code(200);
            return reply.send({ decoded: jwt, token: jwt_token });
        }
        return reply.code(401).send('invalid credentials');
    } catch (error) {
        console.log(`ERROR: SignInStandardUser(): ${error}`);
        return reply.code(500).send("internal server error please try again.");
    }
}