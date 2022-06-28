const { dbConf, dbQuery } = require('../config/database')
const { uploader } = require('../config/uploader')
const fs = require('fs')

module.exports = {
    getPost: async (req, res, next) => {
        try {
            let resultLikes = await dbQuery(`SELECT idPost, idLiker, dateLiked FROM likes`)
            let resultComments = await dbQuery(`SELECT idComment, idPost, idCommenter as idUser, comment, dateCreated FROM comment order by dateCreated desc`)


            if (req.query.length == 0) {
                let resultPost = await dbQuery(`SELECT p.idPost, p.idUser, u.username, u.fullName, p.image, p.caption, p.dateCreated FROM posts p
                JOIN users u ON u.idUser = p.idUser;`)

                resultPost.forEach((val) => {
                    val.likes = [];
                    resultLikes.forEach((valLike) => {
                        if (val.idPost == valLike.idPost) {
                            val.likes.push(valLike.idLiker)
                        }
                    })
                })

                resultPost.forEach((val) => {
                    val.comment = [];
                    resultComments.forEach((valComment) => {
                        if (val.idPost == valComment.idPost) {
                            val.comment.push(valComment)
                        }
                    })
                })

                resultPost.forEach(val => {
                    let defaultMonth = ["January", "February", "March", "April", "June", "July", "August", "September", "October", "November", "December"]

                    let year = val.dateCreated.slice(0, 4)
                    let month = defaultMonth(parseInt(val.dateCreated.slice(5, 7)))
                    let date = val.dateCreated.slice(8, 10)
                    val.dateCreated = `${date} ${month} ${year}`
                })


                return res.status(200).send(resultPost)
            } else {
                let filterKey = ['idPost', 'idUser', 'order', 'username']
                let filter = ''

                for (const key in req.query) {
                    filterKey.forEach((val, id) => {
                        if (key == val) {
                            if (key == 'idPost' || key == 'idUser') {
                                if (filter) {
                                    filter += ` and p.${key} = ${req.query[key]}`
                                } else {
                                    filter += `where p.${key} = ${req.query[key]}`
                                }
                            } else if (key == 'username') {
                                if (filter) {
                                    filter += ` and u.${key} = '${req.query[key]}'`
                                } else {
                                    filter += `where u.${key} = '${req.query[key]}'`
                                }
                            } else if (key == 'order') {
                                if (filter) {
                                    filter += ` order by idPost ${req.query.order}`
                                } else {
                                    filter += `order by idPost ${req.query.order}`
                                }
                            }
                        }
                    })
                }

                let resultPost = await dbQuery(`SELECT p.idPost, p.idUser, u.username, u.fullName, p.image, p.caption, p.dateCreated FROM posts p
                JOIN users u ON u.idUser = p.idUser ${filter};`)

                resultPost.forEach((val) => {
                    val.likes = [];
                    resultLikes.forEach((valLike) => {
                        if (val.idPost == valLike.idPost) {
                            val.likes.push(valLike.idLiker)
                        }
                    })
                })

                resultPost.forEach((val) => {
                    val.comment = [];
                    resultComments.forEach((valComment) => {
                        if (val.idPost == valComment.idPost) {
                            val.comment.push(valComment)
                        }
                    })
                })

                resultPost.forEach(val => {
                    // val.dateCreated = val.dateCreated.toString().split("").slice(4, 15).join("")
                    val.dateCreated = val.dateCreated.toString().split("").slice(4, 10).join("")
                })

                if (req.query.likes) {
                    let filterLike = [];
                    for (let i = 0; i < resultPost.length; i++) {
                        for (let j = 0; j < resultPost[i].likes.length; j++) {
                            if (resultPost[i].likes[j] == req.query.likes) {
                                filterLike.push(resultPost[i])
                            }
                        }
                    }
                    return res.status(200).send(filterLike)
                } else {
                    return res.status(200).send(resultPost)
                }

            }

        } catch (error) {
            return next(error)
        }
    },
    likePost: async (req, res, next) => {
        try {
            await dbQuery(`insert into likes (idPost, idLiker) values (${req.body.idPost}, ${req.body.idLiker})`)

            let resultLikes = await dbQuery(`SELECT idPost, idLiker, dateLiked FROM likes where idPost = ${req.body.idPost}`)
            let resultComments = await dbQuery(`SELECT idPost, idCommenter as idUser, comment, dateCreated FROM comment where idPost = ${req.body.idPost}`)

            let resultPost = await dbQuery(`SELECT p.idPost, p.idUser, u.username, u.fullName, p.image, p.caption, p.dateCreated FROM posts p
                JOIN users u ON u.idUser = p.idUser where p.idPost = ${req.body.idPost};`)

            resultPost.forEach((val) => {
                val.likes = [];
                resultLikes.forEach((valLike) => {
                    if (val.idPost == valLike.idPost) {
                        val.likes.push(valLike.idLiker)
                    }
                })
            })

            resultPost.forEach((val) => {
                val.comment = [];
                resultComments.forEach((valComment) => {
                    if (val.idPost == valComment.idPost) {
                        val.comment.push(valComment)
                    }
                })
            })

            return res.status(200).send(resultPost)

        } catch (error) {
            return next(error)
        }
    },
    unlikePost: async (req, res, next) => {
        try {
            let allLike = await dbQuery(`select * from likes`)
            let indexLike = 0;
            for (let i = 0; i < allLike.length; i++) {
                if (allLike[i].idPost == req.body.idPost && allLike[i].idLiker == req.body.idLiker) {
                    indexLike = allLike[i].idLike
                }
            }

            await dbQuery(`delete from likes where idLike = ${indexLike}`)
            let result = await dbQuery(`select * from likes`)

            return res.status(200).send(result)
        } catch (error) {
            return next(error)
        }
    },
    editPost: async (req, res, next) => {
        try {
            await dbQuery(`update posts set caption = "${req.body.caption}" where idPost = ${req.query.idPost}`)

            res.status(200).send({
                success: true,
                message: `success in editing caption`
            })
        } catch (error) {
            return next(error)
        }
    },
    addComment: async (req, res, next) => {
        try {
            await dbQuery(`insert into comment (idPost, idCommenter, comment) value (${req.query.idPost}, ${req.body.idCommenter}, '${req.body.comment}');`)
            res.status(200).send({
                success: true,
                message: `success in editing caption`
            })
        } catch (error) {
            return next(error)
        }
    },
    addPhoto: async (req, res, next) => {
        const uploadFile = uploader('/postImage', 'IMGPRO').array('image', 1);

        uploadFile(req, res, async (error) => {
            try {
                // console.log(req.body.idUser)
                // console.log('Pengecekan file :', req.files)
                let { idUser, caption } = JSON.parse(req.body.data);
                // let { idUser, caption } = req.body;
                // console.log(req.files)
                // console.log(idUser)
                // console.log(caption)

                let addProduct = await dbQuery(`INSERT INTO posts (idUser, image, caption) VALUES (${idUser}, '/postImage/${req.files[0].filename}', '${caption}')`)
                res.status(200).send({
                    success: true,
                    message: 'Success in uploading a new post'
                })
            } catch (error) {
                req.files.forEach(val => fs.unlinkSync(`./public/postImage/${val.filename}`))
                return next(error)
            }
        })
    },
    deletePost: async (req, res, next) => {
        try {
            let result = await dbQuery(`select image from posts where idPost = ${req.query.idPost}`)
            let deletePost = await dbQuery(`delete from posts where idPost = ${req.query.idPost}`)

            if (deletePost) {
                fs.unlinkSync(`./public${result[0].image}`)
                res.status(200).send({
                    success: true,
                    message: "Delete post succeessful"
                })
            } else {
                res.status(400).send({
                    success: false,
                    message: "post not found"
                })

            }
        } catch (error) {
            return next(error)
        }
    },
    getComment: async (req, res, next) => {
        try {

            let filter = ``
            let filterMore = ``

            if (req.query.limit) {
                if (req.query.page) {
                    let startData = (req.query.page - 1) * req.query.limit

                    filter += `limit ${startData}, ${req.query.limit}`

                    filterMore += `limit ${req.query.page * req.query.limit}, ${req.query.limit}`

                    let comment = await dbQuery(`Select idComment, idPost, idCommenter as idUser, comment, dateCreated from comment where idPost = ${req.query.idPost} order by dateCreated desc ${filter};`)

                    let moreComment = await dbQuery(`Select idComment, idPost, idCommenter as idUser, comment, dateCreated from comment where idPost = ${req.query.idPost} order by dateCreated desc ${filterMore};`)


                    if (moreComment.length > 0) {
                        return res.status(200).send({ comment, nextData: true })
                    } else {
                        return res.status(200).send({ comment, nextData: false })

                    }

                } else {
                    filter += `limit ${req.query.limit}`
                    let comment = await dbQuery(`Select idComment, idPost, idCommenter as idUser, comment, dateCreated from comment where idPost = ${req.query.idPost} order by dateCreated desc ${filter};`)
                    comment[comment.length - 1].nextData = false
                    return res.status(200).send(comment)
                }
            }
        } catch (error) {
            return next(error)
        }
    },
    getPostCopy: async (req, res, next) => {
        try {
            let resultLikes = await dbQuery(`SELECT idPost, idLiker, dateLiked FROM likes`)
            let resultComments = await dbQuery(`SELECT idComment, idPost, idCommenter as idUser, comment, dateCreated FROM comment order by dateCreated desc`)


            if (req.query.length == 0) {
                let resultPost = await dbQuery(`SELECT p.idPost, p.idUser, u.username, u.fullName, p.image, p.caption, p.dateCreated FROM posts p
                JOIN users u ON u.idUser = p.idUser;`)

                resultPost.forEach((val) => {
                    val.likes = [];
                    resultLikes.forEach((valLike) => {
                        if (val.idPost == valLike.idPost) {
                            val.likes.push(valLike.idLiker)
                        }
                    })
                })

                resultPost.forEach((val) => {
                    val.comment = [];
                    resultComments.forEach((valComment) => {
                        if (val.idPost == valComment.idPost) {
                            val.comment.push(valComment)
                        }
                    })
                })

                resultPost.forEach(val => {
                    let defaultMonth = ["January", "February", "March", "April", "June", "July", "August", "September", "October", "November", "December"]

                    let year = val.dateCreated.slice(0, 4)
                    let month = defaultMonth(parseInt(val.dateCreated.slice(5, 7)))
                    let date = val.dateCreated.slice(8, 10)
                    val.dateCreated = `${date} ${month} ${year}`
                })


                return res.status(200).send(resultPost)
            } else {
                let filterKey = ['idPost', 'idUser', 'order', 'username']
                let filter = ''
                let limit = ''
                let hasMore = ''

                for (const key in req.query) {
                    filterKey.forEach((val, id) => {
                        if (key == val) {
                            if (key == 'idPost' || key == 'idUser') {
                                if (filter) {
                                    filter += ` and p.${key} = ${req.query[key]}`
                                } else {
                                    filter += `where p.${key} = ${req.query[key]}`
                                }
                            } else if (key == 'username') {
                                if (filter) {
                                    filter += ` and u.${key} = '${req.query[key]}'`
                                } else {
                                    filter += `where u.${key} = '${req.query[key]}'`
                                }
                            } else if (key == 'order') {
                                if (filter) {
                                    filter += ` order by idPost ${req.query.order}`
                                } else {
                                    filter += `order by idPost ${req.query.order}`
                                }
                            }
                        }
                    })
                }

                if (req.query.limit) {
                    let startData = (req.query.page - 1) * req.query.limit

                    limit += `limit ${startData}, ${req.query.limit}`

                    hasMore += `limit ${req.query.page * req.query.limit}, ${req.query.limit}`

                    let resultPost = await dbQuery(`SELECT p.idPost, p.idUser, u.username, u.fullName, p.image, p.caption, p.dateCreated FROM posts p
                    JOIN users u ON u.idUser = p.idUser ${filter} ${limit};`)

                    let moreData = await dbQuery(`SELECT p.idPost, p.idUser, u.username, u.fullName, p.image, p.caption, p.dateCreated FROM posts p
                    JOIN users u ON u.idUser = p.idUser ${filter} ${hasMore};`)

                    resultPost.forEach((val) => {
                        val.likes = [];
                        resultLikes.forEach((valLike) => {
                            if (val.idPost == valLike.idPost) {
                                val.likes.push(valLike.idLiker)
                            }
                        })
                    })

                    resultPost.forEach((val) => {
                        val.comment = [];
                        resultComments.forEach((valComment) => {
                            if (val.idPost == valComment.idPost) {
                                val.comment.push(valComment)
                            }
                        })
                    })

                    resultPost.forEach(val => {
                        // val.dateCreated = val.dateCreated.toString().split("").slice(4, 15).join("")
                        val.dateCreated = val.dateCreated.toString().split("").slice(4, 10).join("")
                    })

                    if (moreData.length > 0) {
                        let nextData = true

                        if (req.query.likes) {
                            let filterLike = [];
                            for (let i = 0; i < resultPost.length; i++) {
                                for (let j = 0; j < resultPost[i].likes.length; j++) {
                                    if (resultPost[i].likes[j] == req.query.likes) {
                                        filterLike.push(resultPost[i])
                                    }
                                }
                            }
                            return res.status(200).send({ post: filterLike, nextData })
                        } else {
                            return res.status(200).send({ post: resultPost, nextData })
                        }
                    } else {
                        let nextData = false
                        if (req.query.likes) {
                            let filterLike = [];
                            for (let i = 0; i < resultPost.length; i++) {
                                for (let j = 0; j < resultPost[i].likes.length; j++) {
                                    if (resultPost[i].likes[j] == req.query.likes) {
                                        filterLike.push(resultPost[i])
                                    }
                                }
                            }
                            return res.status(200).send({ post: filterLike, nextData })
                        } else {
                            return res.status(200).send({ post: resultPost, nextData })
                        }

                    }
                } else {

                    let resultPost = await dbQuery(`SELECT p.idPost, p.idUser, u.username, u.fullName, p.image, p.caption, p.dateCreated FROM posts p
                    JOIN users u ON u.idUser = p.idUser ${filter} ${limit};`)

                    resultPost.forEach((val) => {
                        val.likes = [];
                        resultLikes.forEach((valLike) => {
                            if (val.idPost == valLike.idPost) {
                                val.likes.push(valLike.idLiker)
                            }
                        })
                    })

                    resultPost.forEach((val) => {
                        val.comment = [];
                        resultComments.forEach((valComment) => {
                            if (val.idPost == valComment.idPost) {
                                val.comment.push(valComment)
                            }
                        })
                    })

                    resultPost.forEach(val => {
                        // val.dateCreated = val.dateCreated.toString().split("").slice(4, 15).join("")
                        val.dateCreated = val.dateCreated.toString().split("").slice(4, 10).join("")
                    })

                    if (req.query.likes) {
                        let filterLike = [];
                        for (let i = 0; i < resultPost.length; i++) {
                            for (let j = 0; j < resultPost[i].likes.length; j++) {
                                if (resultPost[i].likes[j] == req.query.likes) {
                                    filterLike.push(resultPost[i])
                                }
                            }
                        }
                        return res.status(200).send(filterLike)
                    } else {
                        return res.status(200).send(resultPost)
                    }
                }


            }
        } catch (error) {
            return next(error)
        }
    },
}