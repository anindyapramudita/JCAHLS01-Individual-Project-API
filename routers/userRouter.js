const router = require('express').Router();
const { userController } = require('../controllers')
const { readToken } = require('../config/encription')

router.get('/', userController.getData);
router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/keep', readToken, userController.keepLogin);
router.patch('/edit', userController.editData);
router.patch('/editPassword', userController.editPassword);
router.get('/verificationData', readToken, userController.getDataVerification);
router.patch('/verification', readToken, userController.verifyAccount);
router.get('/resend', readToken, userController.resendVerification);
router.patch('/resetLink', userController.sendResetLink);
router.patch('/resetPassword', readToken, userController.resetPassword);
router.patch('/editPicture', readToken, userController.editProfilePicture);

module.exports = router;