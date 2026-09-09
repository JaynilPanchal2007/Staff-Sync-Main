import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer | null = null;

export function initSockets(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join organization room
    socket.on('join:organization', (orgId: string) => {
      if (orgId) {
        socket.join(`organization:${orgId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined organization:${orgId}`);
      }
    });

    // Join personal staff room
    socket.on('join:staff', (staffId: string) => {
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

export function getIO(): SocketIOServer | null {
  return io;
}

export function emitToOrg(orgId: string | undefined, event: string, data: any) {
  if (!io) return;
  if (orgId) {
    io.to(`organization:${orgId}`).emit(event, data);
  }
  io.emit(event, data);
}

export function emitToStaff(staffId: string, event: string, data: any) {
  if (!io) return;
  io.to(`staff:${staffId}`).emit(event, data);
}
