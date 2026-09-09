import { Server as SocketIOServer } from 'socket.io';
let io = null;
export function initSockets(server) {
    io = new SocketIOServer(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
        },
    });
    io.on('connection', (socket) => {
        console.log(`[Socket.IO] Client connected: ${socket.id}`);
        // Join organization room
        socket.on('join:organization', (orgId) => {
            if (orgId) {
                socket.join(`organization:${orgId}`);
                console.log(`[Socket.IO] Socket ${socket.id} joined organization:${orgId}`);
            }
        });
        // Join personal staff room
        socket.on('join:staff', (staffId) => {
            if (staffId) {
                socket.join(`staff:${staffId}`);
                console.log(`[Socket.IO] Socket ${socket.id} joined staff:${staffId}`);
            }
        });
        socket.on('disconnect', () => {
            console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
        });
    });
    return io;
}
export function getIO() {
    return io;
}
export function emitToOrg(orgId, event, data) {
    if (!io)
        return;
    if (orgId) {
        io.to(`organization:${orgId}`).emit(event, data);
    }
    io.emit(event, data);
}
export function emitToStaff(staffId, event, data) {
    if (!io)
        return;
    io.to(`staff:${staffId}`).emit(event, data);
}
