const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./user');

const PORT = 3000;
app.listen(PORT, (error) => {
        if (!error) {
            console.log("Server is Successfully Running and App is listening on port " + PORT)

        } else {
            console.log("Error occurred, server can't start", error);

        }
    }

);
//MongoDB connection 
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/test', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection
    .once("open", () => {
        console.log("Database connected !")
    })
    .on("error", error => {
        console.log("error :", error);
    })

//region Security configuration
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, Accept, Content-Type, X-Requested-with, Authorization"
    );
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, DELETE, OPTIONS, PATCH, PUT"
    );
    next();
});
// Security configuration


// create express application
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
//create express application
app.get('/', (req, res) => {
    res.status(200);
    res.send("Welcome to root URL of Server");
});

app.post('/signup', (req, res) => {
    console.log('REQ body', req.body);

    bcrypt.hash(req.body.password, 10).then(
        hash => {
            const user = new User({
                username: req.body.username,
                email: req.body.email,
                password: hash,

            });
            user.save()
                .then(
                    result => {
                        res.status(201).json({
                            message: "User added successfully",
                            result: result
                        });
                    })
                .catch(err => {
                    res.status(500).json({
                        eror: err
                    })
                });
        }
    );

});

app.post("/login", (req, res) => {
    let gettedUser;
    console.log('REQ body', req.body);

    User.findOne({ email: req.body.email })
        .then(user => {
            console.log("USER", user);

            if (!user) {
                // 401 : authentification failed
                // 404 : not found
                return res.status(401).json({
                    message: "Auth failed"
                })
            };
            gettedUser = user;
            console.log("Getted user", gettedUser);

            return bcrypt.compare(req.body.password, user.password)
        })
        .then(result => {
            if (!result) {
                return res.status(401).json({
                    message: 'Auth failed'
                })
            }
            // Create new token
            // secret_key: sera enregistré que sur le serveur et utilisé pour valider les requests
            const token = jwt.sign({ email: gettedUser.email, userId: gettedUser._id },
                'secret_key', { expiresIn: '1h' });
            console.log("Token, ", token);
            res.status(200).json({
                message: "OK",
                token: token,
                expiresIn: 3600
            })
        })
        .catch(err => {
            console.log("Erroe", err);

            return res.status(401).json({
                message: 'Auth failed'
            })
        })
})