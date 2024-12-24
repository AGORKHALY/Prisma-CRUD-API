const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

exports.createUser = async (req, response) => {
    try {
        if (!req.body.name) {
            return response.status(422).json({ error: 'Name is required' })
        }
        if (req.body.userSalary === undefined || req.body.userSalary === null) {
            return response.status(422).json({ error: 'User salary is required' });
        }

        const newUser = await prisma.user.create({
            data: {
                name: req.body.name,
                salary: req.body.salary
            }
        })
        return response.status(201).json(newUser)
    }
    catch (error) {
        return response.status(500).json({ error: error.message })
    }
}