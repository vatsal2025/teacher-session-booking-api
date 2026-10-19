import { NextFunction, Request, Response } from 'express';
import { User } from '../models/User';
import { Session, SessionStatus } from '../models/Session';
import { ApiError } from '../middleware/errorHandler';
import { Types } from 'mongoose';

// POST /users
export async function createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { fullName, email, phone } = req.body;
    if (!fullName || !email || !phone) {
      throw new ApiError(400, 'fullName, email and phone are required');
    }

    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) {
      throw new ApiError(409, 'Email already exists');
    }

    const user = await User.create({ fullName, email, phone });
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

// GET /users/:id/sessions
// Returns the user's sessions split into upcoming and completed.
// Implemented with the MongoDB Aggregation Pipeline ($match + $facet).
export async function getUserSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      throw new ApiError(400, 'Invalid user id');
    }

    const user = await User.findById(id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const [result] = await Session.aggregate([
      { $match: { userId: new Types.ObjectId(id) } },
      {
        $facet: {
          upcoming: [
            { $match: { status: SessionStatus.BOOKED } },
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
          ],
          completed: [
            { $match: { status: SessionStatus.COMPLETED } },
            { $sort: { completedAt: -1 } },
            {
              $lookup: {
                from: 'teachers',
                localField: 'teacherId',
                foreignField: '_id',
                as: 'teacher',
              },
            },
            { $unwind: '$teacher' },
          ],
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        upcomingSessions: result?.upcoming ?? [],
        completedSessions: result?.completed ?? [],
      },
    });
  } catch (err) {
    next(err);
  }
}
