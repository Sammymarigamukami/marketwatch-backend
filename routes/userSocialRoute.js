import express from 'express';
import { authGithub, authGoogle, githubCallback, googleCallback } from '../controllers/socialLogins.js';

const socialRouter = express.Router();

socialRouter.get('/github', authGithub);
socialRouter.get('/github/callback', githubCallback);
socialRouter.get('/google', authGoogle);
socialRouter.get('/google/callback', googleCallback);

export default socialRouter;