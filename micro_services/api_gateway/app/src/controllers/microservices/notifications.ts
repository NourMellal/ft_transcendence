import AuthProvider from "../../classes/AuthProvider";
import WebSocket from "ws";

const PushNotificationSocketsMap = new Map<string, WebSocket[]>();

const removeSocket = function (socket: WebSocket, uid: string) {
    const sockets = PushNotificationSocketsMap.get(uid);
    if (sockets) {
        const index = sockets.indexOf(socket);
        if (index !== -1) {
            sockets.splice(index, 1);
        }
        if (sockets.length === 0) {
            PushNotificationSocketsMap.delete(uid);
        }
    }
}

export const pingUser = function (uid: string) {
    const sockets = PushNotificationSocketsMap.get(uid);
    if (sockets) {
        for (let i = 0; i < sockets.length; i++) {
            try {
                sockets[i].ping();
            } catch (error) {
                console.log(`error pinging user uid=${uid}: ${error}`);
            }
        }
    }
}

export const PushNotificationHandler = function (socket: WebSocket) {
    let jwt;
    try {
        jwt = AuthProvider.ValidateJWT_Token(socket.protocol);
    } catch (error) {
        console.log(`PushNotificationHandler(): ${error}`);
        socket.close(undefined, 'request unauthorized');
        return;
    }
    const sockets = PushNotificationSocketsMap.get(jwt.sub);
    if (sockets)
        sockets.push(socket);
    else
        PushNotificationSocketsMap.set(jwt.sub, [socket])
    socket.on('close', () => removeSocket(socket, jwt.sub));
    socket.on('error', (ws: WebSocket, error: Error) => {
        removeSocket(socket, jwt.sub);
        console.log(`PushNotificationHandler(): socket error ${error}`);
        ws.close();
    });
}