/// <reference types="@clerk/express/env" />

declare namespace Express {
    interface Request {
        user?: {
            id: string;
            username: string;
            email: string;
            profilePicture: string | null;
            createdAt: Date;
        }
    }
}