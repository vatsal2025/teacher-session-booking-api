import { NextFunction, Request, Response } from 'express';
import { Teacher } from '../models/Teacher';
import { User } from '../models/User';
import { Session, SessionStatus } from '../models/Session';
import { ApiError } from '../middleware/errorHandler';
import { Types } from 'mongoose';

// POST /sessions
export async function createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { teacherId, startTime, endTime } = req.body;
    if (!teacherId || !startTime || !endTime) {
      throw new ApiError(400, 'teacherId, startTime and endTime are required');
    }
    if (!Types.ObjectId.isValid(teacherId)) {
      throw new ApiError(400, 'Invalid teacher id');
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      throw new ApiError(404, 'Teacher not found');
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ApiError(400, 'startTime and endTime must be valid dates');
    }
    if (end <= start) {
      throw new ApiError(400, 'endTime must be greater than startTime');
    }

    const session = await Session.create({
      teacherId,
      startTime: start,
      endTime: end,
      status: SessionStatus.AVAILABLE,
    });
    res.status(201).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
}

// GET /sessions/available?dateTimestamp=<ms epoch>
// All AVAILABLE sessions on that calendar date.
// Implemented with the MongoDB Aggregation Pipeline.
export async function getAvailableSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { dateTimestamp } = req.query;
    if (!dateTimestamp) {
      throw new ApiError(400, 'dateTimestamp query parameter is required');
    }

    const ts = Number(dateTimestamp);
    if (isNaN(ts)) {
      throw new ApiError(400, 'dateTimestamp must be a numeric epoch timestamp');
    }

    const dayStart = new Date(ts);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(ts);
    dayEnd.setHours(23, 59, 59, 999);

    const sessions = await Session.aggregate([
      {
        $match: {
          status: SessionStatus.AVAILABLE,
          startTime: { $gte: dayStart, $lte: dayEnd },
        },
      },
      { $sort: { startTime: 1 } },
      {
        $lookup: {
          from: 'teachers',
          localField: 'teacherId',
          foreignField: '_id',
          as: 'teacher',
        },
      },
      { $unwind: '$teacher' },
    ]);

    res.status(200).json({ success: true, count: sessions.length, data: sessions });
  } catch (err) {
    next(err);
  }
}

// POST /sessions/:id/book
export async function bookSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    if (!userId) {
      throw new ApiError(400, 'userId is required');
    }
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(userId)) {
      throw new ApiError(400, 'Invalid session id or user id');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const session = await Session.findById(id);
    if (!session) {
      throw new ApiError(404, 'Session not found');
    }
    if (session.status !== SessionStatus.AVAILABLE) {
      throw new ApiError(409, 'Session is not available for booking');
    }

    session.status = SessionStatus.BOOKED;
    session.userId = new Types.ObjectId(userId);
    await session.save();

    res.status(200).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
}

// PATCH /sessions/:id/complete
export async function completeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(400, 'Invalid session id');
    }

    const session = await Session.findById(id);
    if (!session) {
      throw new ApiError(404, 'Session not found');
    }
    if (session.status !== SessionStatus.BOOKED) {
      throw new ApiError(409, 'Only booked sessions can be marked as completed');
    }

    session.status = SessionStatus.COMPLETED;
    session.completedAt = new Date();
    await session.save();

    res.status(200).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
}
