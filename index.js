const express = require('express');
const bearerToken = require('express-bearer-token')
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
app.use(cors());

// const PORT = 5100;
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(bearerToken());
app.use(express.static('public'))

const { dbConf } = require('./config/database')

dbConf.getConnection((error, connection) => {
    if (error) {
        console.log("Error MySQL Connection", error.message, error.sqlMessage);
    } else {
        console.log(`Connected to MySQL Server: ${connection.threadId}`)
    }
})

const { userRouter, postRouter } = require('./routers');
app.use('/user', userRouter)
app.use('/posting', postRouter)

app.get('/', (req, res) => {
    res.status(200).send("<h1>JCAHLS Social Media API</h1>")
})

app.listen(PORT, () => console.log(`Running at: http://localhost:${PORT}`));