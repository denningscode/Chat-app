import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { validateRequest, messageSchema } from '../utils/validation';

export const getMessages = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const userId = (req as any).user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Check if user is member of the room
    const membership = await prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId
        }
      }
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this room'
      });
    }

    // Get messages with pagination
    const messages = await prisma.message.findMany({
      where: {
        roomId
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    const total = await prisma.message.count({
      where: {
        roomId
      }
    });

    // Reverse messages to get chronological order
    const reversedMessages = messages.reverse();

    res.json({
      success: true,
      data: {
        messages: reversedMessages,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get messages'
    });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const validatedData = validateRequest(messageSchema, req.body);
    const { content, roomId } = validatedData;
    const userId = (req as any).user.id;

    // Check if user is member of the room
    const membership = await prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId
        }
      }
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this room'
      });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        roomId,
        senderId: userId
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

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to send message'
    });
  }
};

export const editMessage = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = (req as any).user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Find message and check ownership
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        room: {
          include: {
            members: {
              where: {
                userId
              }
            }
          }
        }
      }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own messages'
      });
    }

    // Check if user is still a member of the room
    if (message.room.members.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this room'
      });
    }

    // Update message
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: content.trim(),
        isEdited: true
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

    res.json({
      success: true,
      message: 'Message updated successfully',
      data: { message: updatedMessage }
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to edit message'
    });
  }
};

export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const userId = (req as any).user.id;

    // Find message and check ownership
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        room: {
          include: {
            members: {
              where: {
                userId,
                isAdmin: true
              }
            }
          }
        }
      }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Check if user is sender or admin
    const isAdmin = message.room.members.length > 0;
    if (message.senderId !== userId && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages or must be an admin'
      });
    }

    // Delete message
    await prisma.message.delete({
      where: { id: messageId }
    });

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete message'
    });
  }
};
