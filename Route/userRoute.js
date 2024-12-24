const router = require('express').Router()
const userController = require('../Controller/UserController');

router.post('/', userController.createUser)

module.exports = router 