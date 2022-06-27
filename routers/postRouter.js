const router = require('express').Router();
const { readToken } = require('../config/encription');
const { postController } = require('../controllers')

router.get('/', postController.getPost);
router.post('/like', postController.likePost);
router.patch('/unlike', postController.unlikePost);
router.patch('/editPost', postController.editPost);
router.post('/addComment', postController.addComment);
router.post('/addPost', postController.addPhoto, readToken);
router.delete('/delete', postController.deletePost, readToken);
router.get('/getComment', postController.getComment);

module.exports = router;