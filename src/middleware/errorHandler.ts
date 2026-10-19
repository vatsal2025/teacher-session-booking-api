import { NextFunction, Request, Response } from 'express';

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Centralized error handler: every thrown/forwarded error lands here.
export function errorHandler(
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ success: false, message: err.message });
    return;
  }

  // Mongoose duplicate key (e.g. non-unique email)
  if ((err as any).code === 11000) {
    res.status(409).json({ success: false, message: 'Email already exists' });
    return;
  }

  // Mongoose invalid ObjectId
  if (err.name === 'CastError') {
    res.status(400).json({ success: false, message: 'Invalid id format' });
    return;
  }

  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error' });
}
