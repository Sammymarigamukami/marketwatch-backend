import express from 'express';
import { login, logout, register } from '../controllers/userController.js';

const router = express.Router();

router.get('/', (req, res) => {
    res.send('User route is working');
    console.log('Cookies:', req.cookies);
});
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);


export default router;