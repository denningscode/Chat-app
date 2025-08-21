import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from '../utils/jwt';
import { prisma } from './database';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

export const configureSocket = (server: HTTPServer) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "POST"]
    }
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = verifyToken(token) as { userId: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, username: true, email: true, avatar: true }
      });

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', async (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.user?.username} connected`);

    // Update user online status
    if (socket.userId) {
      await prisma.user.update({
        where: { id: socket.userId },
        data: { isOnline: true, lastSeen: new Date() }
      });

      // Emit user status to all connected clients
      socket.broadcast.emit('user_status', {
        userId: socket.userId,
        isOnline: true,
        username: socket.user?.username
      });
    }

    // Join room
    socket.on('join_room', async (data: { roomId: string }) => {
      try {
        const { roomId } = data;
        
        // Check if user is member of the room
        const membership = await prisma.roomMember.findUnique({
          where: {
            userId_roomId: {
              userId: socket.userId!,
              roomId
            }
          }
        });

        if (!membership) {
          socket.emit('error', { message: 'You are not a member of this room' });
          return;
        }

        socket.join(roomId);
        socket.emit('joined_room', { roomId });
        
        // Notify other users in the room
        socket.to(roomId).emit('user_joined_room', {
          userId: socket.userId,
          username: socket.user?.username,
          roomId
        });

        console.log(`User ${socket.user?.username} joined room ${roomId}`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Send message
    socket.on('send_message', async (data: { roomId: string; content: string }) => {
      try {
        const { roomId, content } = data;

        if (!content.trim()) {
          socket.emit('error', { message: 'Message cannot be empty' });
          return;
        }

        // Check if user is member of the room
        const membership = await prisma.roomMember.findUnique({
          where: {
            userId_roomId: {
              userId: socket.userId!,
              roomId
            }
          }
        });

        if (!membership) {
          socket.emit('error', { message: 'You are not a member of this room' });
          return;
        }

        // Create message in database
        const message = await prisma.message.create({
          data: {
            content: content.trim(),
            roomId,
            senderId: socket.userId!
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          }
        });

        // Broadcast message to all users in the room
        io.to(roomId).emit('receive_message', {
          id: message.id,
          content: message.content,
          roomId: message.roomId,
          sender: message.sender,
          createdAt: message.createdAt
        });

        console.log(`Message sent in room ${roomId} by ${socket.user?.username}`);
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', async (data: { roomId: string; isTyping: boolean }) => {
      try {
        const { roomId, isTyping } = data;

        // Check if user is member of the room
        const membership = await prisma.roomMember.findUnique({
          where: {
            userId_roomId: {
              userId: socket.userId!,
              roomId
            }
          }
        });

        if (!membership) {
          return;
        }

        // Update typing status in database
        await prisma.typingStatus.upsert({
          where: {
            userId_roomId: {
              userId: socket.userId!,
              roomId
            }
          },
          update: {
            isTyping,
            startedAt: new Date()
          },
          create: {
            userId: socket.userId!,
            roomId,
            isTyping
          }
        });

        // Broadcast typing status to other users in the room
        socket.to(roomId).emit('typing', {
          userId: socket.userId,
          username: socket.user?.username,
          isTyping,
          roomId
        });
      } catch (error) {
        console.error('Error handling typing event:', error);
      }
    });

    // Disconnect handler
    socket.on('disconnect', async () => {
      console.log(`User ${socket.user?.username} disconnected`);

      if (socket.userId) {
        // Update user offline status
        await prisma.user.update({
          where: { id: socket.userId },
          data: { isOnline: false, lastSeen: new Date() }
        });

        // Emit user status to all connected clients
        socket.broadcast.emit('user_status', {
          userId: socket.userId,
          isOnline: false,
          username: socket.user?.username
        });
      }
    });
  });

  return io;
};
