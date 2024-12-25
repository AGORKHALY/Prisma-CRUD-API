const router = require('express').Router();
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

router.get('/users', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({})
    res.json(users)
  } catch (error) {
    next(error)
  }
});

router.get('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const user = await prisma.user.findUnique({
      where: {
        id: Number(id)
      }
    })
    res.json(user)
  } catch (error) {
    next(error)
  }
});

router.post('/users', async (req, res, next) => {
  try {
    const data = req.body
    const user = await prisma.user.create({
      data: req.body
    })
    res.json(user)
  } catch (error) {
    next(error)
  }
});

router.delete('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const deletedUser = await prisma.user.delete({
      where: {
        id: Number(id)
      }
    })
    res.json(deletedUser)
  } catch (error) {
    next(error)
  }
});

router.patch('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const user = await prisma.user.update({
      where: {
        id: Number(id)
      },
      data: req.body
    })
    res.json(user)
  } catch (error) {
    next(error)
  }
});

module.exports = router;
