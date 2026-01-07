import { Request } from 'express';

// Extend Express Request to include user info
export interface AuthenticatedRequest extends Request {
  user?: {
    cognitoId: string;
    email: string;
    name?: string;
  };
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        cognitoId: string;
        email: string;
        name?: string;
      };
    }
  }
}
