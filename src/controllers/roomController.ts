import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { validateRequest, roomCreationSchema, joinRoomSchema } from '../utils/validation';
import { v4 as uuidv4 } from 'uuid';

export const createRoom = async (req: Request, res: Response) => {
  try {
    const validatedData = validateRequest(roomCreationSchema, req.body);
    const { name, description, isPrivate } = validatedData;
    const userId = (req as any).user.id;

    // Generate invite code for private rooms
    const inviteCode = isPrivate ? uuidv4().substring(0, 8) : null;

    // Create room
    const room = await prisma.room.create({
      data: {
        name,
        description,
        isPrivate,
        inviteCode,
        createdBy: userId
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    // Add creator as admin member
    await prisma.roomMember.create({
      data: {
        userId,
        roomId: room.id,
        isAdmin: true
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: { room }
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create room'
    });
  }
};

export const getRooms = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get rooms where user is a member
    const rooms = await prisma.room.findMany({
      where: {
        members: {
          some: {
            userId
          }
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
                isOnline: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: true,
            members: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      skip,
      take: limit
    });

    const total = await prisma.room.count({
      where: {
        members: {
          some: {
            userId
          }
        }
      }
    });

    return res.json({
      success: true,
      data: {
        rooms,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get rooms'
    });
  }
};

export const getPublicRooms = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const rooms = await prisma.room.findMany({
      where: {
        isPrivate: false
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        _count: {
          select: {
            messages: true,
            members: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    const total = await prisma.room.count({
      where: {
        isPrivate: false
      }
    });

    return res.json({
      success: true,
      data: {
        rooms,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get public rooms'
    });
  }
};

export const joinRoom = async (req: Request, res: Response) => {
  try {
    const validatedData = validateRequest(joinRoomSchema, req.body);
    const { roomId, inviteCode } = validatedData;
    const userId = (req as any).user.id;

    let room;

    if (roomId) {
      room = await prisma.room.findUnique({
        where: { id: roomId }
      });
    } else if (inviteCode) {
      room = await prisma.room.findUnique({
        where: { inviteCode }
      });
    }

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if user is already a member
    const existingMembership = await prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId: room.id
        }
      }
    });

    if (existingMembership) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this room'
      });
    }

    // Check if room is private and user has invite code
    if (room.isPrivate && !inviteCode) {
      return res.status(403).json({
        success: false,
        message: 'Invite code required for private rooms'
      });
    }

    // Add user to room
    await prisma.roomMember.create({
      data: {
        userId,
        roomId: room.id
      }
    });

    return res.json({
      success: true,
      message: 'Successfully joined room',
      data: { roomId: room.id }
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to join room'
    });
  }
};

export const getRoomDetails = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
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

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
                isOnline: true,
                lastSeen: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: true,
            members: true
          }
        }
      }
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    return res.json({
      success: true,
      data: { room }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get room details'
    });
  }
};
