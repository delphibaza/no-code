import prisma from '@repo/db/client';
import { clerkClient, getAuth } from '@clerk/express';
import { Request, Response, NextFunction } from 'express';

export async function ensureUserExists(req: Request, res: Response, next: NextFunction) {
    const { userId } = getAuth(req);

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // Check if user exists in your DB
        let user = await prisma.user.findUnique({
            where: { id: userId }
        });

        // If user doesn't exist, get user data from Clerk and create in your DB
        if (!user) {
            // You can get user info from Clerk using their SDK
            const clerkUser = await clerkClient.users.getUser(userId);

            user = await prisma.user.create({
                data: {
                    id: userId,
                    email: clerkUser.emailAddresses[0].emailAddress,
                    username: clerkUser.username || clerkUser.emailAddresses[0].emailAddress.split('@')[0],
                    profilePicture: clerkUser.imageUrl
                }
            });
        }

        // Add user to the request object
        req.user = user;
        next();
    } catch (error) {
        console.error('Error ensuring user exists:', error);
        return res.status(500).json({ error: 'Server error' });
    }
}