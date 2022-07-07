const { dbConf, dbQuery } = require('../config/database')
const { hashPassword, createToken } = require('../config/encription')
const { transporter } = require("../config/nodemailer")
const { uploader } = require('../config/uploader')
const fs = require('fs')

module.exports = {
    getData: async (req, res, next) => {
        try {
            if (Object.keys(req.query).length == 0) {
                let result = await dbQuery('Select * from users;')
                return res.status(200).send(result)
            } else if (Object.keys(req.query).length > 0) {
                let filter = ''
                let filterKey = ['idUser', 'fullName', 'username', 'email', 'password']

                for (const key in req.query) {
                    filterKey.forEach((val, id) => {
                        if (key == val) {
                            if (key == 'idUser') {
                                if (filter) {
                                    filter += ` and ${key} = ${req.query[key]}`
                                } else {
                                    filter += `${key} = ${req.query[key]}`
                                }
                            } else if (key == 'fullName' || key == 'username' || key == 'email' || key == 'password') {
                                if (filter) {
                                    filter += ` and ${key} like '%${req.query[key]}%'`
                                } else {
                                    filter += `${key} like '%${req.query[key]}%'`
                                }
                            }
                        }
                    })
                }

                let resultFilter = await dbQuery(`select * from users where ${filter};`)

                return res.status(200).send(resultFilter);
            }
        } catch (error) {
            return next(error)
        }
    },
    register: async (req, res, next) => {
        try {
            const { email, password, username, fullName } = req.body;

            let insertData = await dbQuery(`Insert into users (fullName, username, email, password) values ('${fullName}', '${username}', '${email}', '${hashPassword(password)}');`)


            if (insertData.insertId) {
                let result = await dbQuery(`Select idUser, fullName, username, email, bio, profilePicture from users where idUser='${insertData.insertId}';`)

                let { idUser, fullName, username, email } = result[0]

                let token = createToken({ idUser, fullName, username, email })

                await dbQuery(`Update users set lastToken = '${token}' WHERE idUser=${insertData.insertId};`)

                let finalResult = dbQuery(`Select idUser, fullName, username, email, bio, profilePicture, lastToken from users where idUser=${insertData.insertId};`)


                // let verificationEmail = fs.readFileSync('./mail/verification.html').toString()

                // verificationEmail = verificationEmail.replace('#fullname', fullName)
                // verificationEmail = verificationEmail.replace('#token', `${process.env.FE_URL}/verification/${token}`)

                await transporter.sendMail({
                    from: "Social Media Admin",
                    to: email,
                    subject: "Email Verification",
                    // html: `${verificationEmail}`
                    html: `<div>
                    <h1>You're one step closer to get the full access!</h1>
                    <br/>
                    <h3>Verify your account now :</h3>
                    <a href="${process.env.FE_URL}/verification/${token}">Click here</a>
                    </div>`
                })

                return res.status(200).send({ ...finalResult[0], token })
            } else {
                return res.status(404).send({
                    success: false,
                    message: "User not found"
                });
            }

        } catch (error) {
            return next(error)
        }
    },
    login: async (req, res, next) => {
        try {
            const { email, username, password } = req.body

            if (email) {
                let result = await dbQuery(`Select idUser, fullName, username, email, bio, profilePicture, status from users where email='${email}' and password='${hashPassword(password)}';`)
                if (result.length == 1) {
                    let { idUser, fullName, username, email } = result[0]
                    let token = createToken({ idUser, fullName, username, email })
                    console.log(token)
                    return res.status(200).send({ ...result[0], token })
                } else {
                    return res.status(404).send({
                        success: false,
                        message: "User not found"
                    });
                }
            } else if (username) {
                let result = await dbQuery(`Select idUser, fullName, username, email, bio, profilePicture, status from users where username='${username}' and password='${hashPassword(password)}';`)
                if (result.length == 1) {
                    let { idUser, fullName, username, email } = result[0]
                    let token = createToken({ idUser, fullName, username, email })
                    return res.status(200).send({ ...result[0], token })
                } else {
                    return res.status(404).send({
                        success: false,
                        message: "User not found"
                    });
                }
            }

        } catch (error) {
            return next(error)
        }
    },
    keepLogin: async (req, res, next) => {
        try {
            // console.log(req.dataUser)
            if (req.dataUser.idUser) {
                let result = await dbQuery(`Select idUser, fullName, username, email, bio, profilePicture, status from users where idUser = '${req.dataUser.idUser}';`)

                let { idUser, fullName, username, email } = result[0]
                let token = createToken({ idUser, fullName, username, email })
                return res.status(200).send({ ...result[0], token })
            } else {
                return res.status(401).send({
                    success: false,
                    message: "Token expired"
                })
            }

        } catch (error) {
            return next(error)
        }
    },
    editData: async (req, res, next) => {
        try {
            await dbQuery(`UPDATE users SET fullName = '${req.body.fullName}', username = '${req.body.username}', bio = '${req.body.bio}' WHERE idUser = ${req.query.idUser}`)

            let resultUpdated = await dbQuery(`Select * from Users where idUser = ${req.query.idUser} `)

            res.status(200).send(resultUpdated)
        } catch (error) {
            return next(error)
        }
    },
    editPassword: async (req, res, next) => {
        try {
            let checkPassword = await dbQuery(`SELECT * FROM users WHERE idUser=${req.query.idUser} and password='${hashPassword(req.body.password)}'`)
            console.log(checkPassword)

            if (checkPassword) {
                let test = await dbQuery(`UPDATE users SET password = '${hashPassword(req.body.newPassword)}' WHERE idUser = ${req.query.idUser}`)
                console.log(test)
                res.status(200).send({
                    success: true,
                    message: `Password changed successfully`
                })
            } else {
                return res.status(404).send({
                    success: false,
                    message: `Password doesn't match`
                });
            }

        } catch (error) {
            return next(error)
        }
    },
    getDataVerification: async (req, res, next) => {
        try {
            if (req.dataUser.idUser) {
                let result = await dbQuery(`Select idUser, fullName, email, lastToken from users where idUser = '${req.dataUser.idUser}';`)
                return res.status(200).send(result[0])
            } else {
                return res.status(401).send({
                    success: false,
                    message: "Token expired"
                })
            }
        } catch (error) {
            return next(error)
        }
    },
    verifyAccount: async (req, res, next) => {
        try {
            // console.log(req.dataUser.idUser)
            if (req.dataUser.idUser) {
                let lastToken = await dbQuery(`select lastToken from users WHERE idUSer = ${req.dataUser.idUser}`)
                console.log("lastToken", lastToken[0].lastToken)
                console.log("req token", req.token)
                if (req.token == lastToken[0].lastToken) {
                    await dbQuery(`UPDATE users SET status = 'Verified' WHERE idUser = ${req.dataUser.idUser}`)
                    let result = await dbQuery(`Select idUser, fullName, username, email, bio, profilePicture from users where idUser = '${req.dataUser.idUser}';`)

                    let { idUser, fullName, username, email } = result[0]

                    let token = createToken({ idUser, fullName, username, email })
                    return res.status(200).send({ ...result[0], token })
                } else {
                    return res.status(404).send({
                        success: false,
                        message: "Token expired"
                    })
                }
            } else {
                return res.status(404).send({
                    success: false,
                    message: "User not found"
                })
            }
        } catch (error) {
            return next(error)
        }
    },
    resendVerification: async (req, res, next) => {
        try {
            if (req.dataUser.idUser) {
                let data = await dbQuery(`Select idUser, fullName, username, email, bio, profilePicture from users where idUser='${req.dataUser.idUser}';`)

                let { idUser, fullName, username, email } = data[0]
                let token = createToken({ idUser, fullName, username, email })

                await dbQuery(`Update users set lastToken = '${token}' WHERE idUser=${req.dataUser.idUser};`)

                let finalResult = dbQuery(`Select idUser, fullName, username, email, bio, profilePicture, lastToken from users where idUser=${req.dataUser.idUser};`)


                await transporter.sendMail({
                    from: "Social Media Admin",
                    to: email,
                    subject: "Email Verification",
                    html: `<div>
                    <h1>You're one step closer to get the full access!</h1>
                    <br/>
                    <h3>Verify your account now :</h3>
                    <a href="${process.env.FE_URL}/verification/${token}">Click here</a>
                    </div>`
                })
                return res.status(200).send({ ...finalResult[0], token })
            } else {
                return res.status(401).send({
                    success: false,
                    message: "Token expired"
                })
            }
        } catch (error) {
            return next(error)
        }
    },
    sendResetLink: async (req, res, next) => {
        try {
            let data = await dbQuery(`Select idUser, fullName, username, email from users where email='${req.body.email}';`)

            let { idUser, fullName, username, email } = data[0]
            let token = createToken({ idUser, fullName, username, email })

            await dbQuery(`Update users set lastToken = '${token}' WHERE email='${req.body.email}';`)
            let finalResult = dbQuery(`Select idUser, fullName, username, email, bio, profilePicture, lastToken from users where email='${req.body.email}';`)


            await transporter.sendMail({
                from: "Social Media Admin",
                to: email,
                subject: "Reset Password",
                html: `<div>
                    <h1>A little bit more and you'll gain access back!</h1>
                    <br/>
                    <h3>Reset your password here :</h3>
                    <a href="${process.env.FE_URL}/reset/${token}">Click here</a>
                    </div>`
            })
            return res.status(200).send({ ...finalResult[0], token })
        } catch (error) {
            return next(error)
        }
    },
    resetPassword: async (req, res, next) => {
        try {
            if (req.dataUser.idUser) {
                await dbQuery(`Update users set password='${hashPassword(req.body.password)}' WHERE idUser=${req.dataUser.idUser}`)

                return res.status(200).send({
                    success: true,
                    message: "Password reset success"
                })
            } else {
                return res.status(401).send({
                    success: false,
                    message: "Token expired"
                })
            }
        } catch (error) {
            return next(error)
        }
    },
    editProfilePicture: async (req, res, next) => {
        console.log(req.dataUser)
        const uploadFile = uploader('/profile', 'IMGPRO').array('image', 1);
        uploadFile(req, res, async (error) => {
            try {

                // console.log("idUser :", req.dataUser.idUser)
                // console.log("file :", req.files[0].filename)
                let updatePicture = await dbQuery(`update users set profilePicture = '/profile/${req.files[0].filename}' WHERE idUser = ${req.dataUser.idUser}`)

                if (updatePicture) {
                    let result = await dbQuery(`Select idUser, fullName, username, email, bio, profilePicture, status from users where idUser = '${req.dataUser.idUser}';`)
                    res.status(200).send(result[0])
                } else {
                    res.status(400).send({
                        success: false,
                        message: 'Account not found'
                    })
                }
            } catch (error) {
                return next(error)
            }
        })
    }
}