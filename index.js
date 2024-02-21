const express = require('express');
const mysql = require('mysql');
const app = express();
const cors =require('cors');
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const setRounds=10;

app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended:true}));

app.use(
    session({
        key: "usermail",
        secret: "success",
        resave: false,
        saveUninitialized: false,
        cookie:{
            expires: 60 * 10,
        }
    })
)

const db = mysql.createConnection({
    user:'admin',
    password:'gokul311',
    host:'database-2.czigcg2qih89.eu-north-1.rds.amazonaws.com',
    database:'library',
    port:'3306'
})

const verifyJWT = (req, res, next) => {
    const token = req.headers["x-access-token"];
    if (!token) {
        res.send("We need token give it next time");
    } else {
        jwt.verify(token, "secret", (err, decoded) => {
            if (err) {
                res.json({ auth: false, message: "Failed to authenticate" });
            } else {
                req.usermail = decoded.id;
                next();
            }
        });
    }
};

app.post('/register', (req, res) => {
    const username = req.body?.username;
    const password = req.body?.password;
    const cpassword = req.body?.cpassword;

    console.log(req.body);

    if (password !== cpassword) {
        return res.status(400).json({ message: 'Password and Confirm Password do not match' });
    }

    bcryptjs.hash(password,setRounds,(err,hash)=>{
            if(err){
                console.log(err)
            }

        db.query(
            'INSERT INTO user(username,password, cpassword) VALUES (?,?,?)',
            [username, hash, hash],
            (err, result) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ error: 'Internal Server Error' });
                } else {
                    console.log(result);
                    return res.status(200).json({ message: 'Registration Successful' });
                }
            }
        );
    });
});

app.post('/registeradmin', (req, res) => {
    const adminname = req.body?.adminname;
    const password = req.body?.password;
    const cpassword = req.body?.cpassword;

    console.log(req.body);

    if (password !== cpassword) {
        return res.status(400).json({ message: 'Password and Confirm Password do not match' });
    }

    bcryptjs.hash(password,setRounds,(err,hash)=>{
            if(err){
                console.log(err)
            }

        db.query(
            'INSERT INTO admin(adminname, password, cpassword) VALUES (?,?,?)',
            [adminname, hash, hash],
            (err, result) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ error: 'Internal Server Error' });
                } else {
                    console.log(result);
                    return res.status(200).json({ message: 'Registration Successful' });
                }
            }
        );
    });
});

app.get('/isAuth',verifyJWT,(req,res)=>{
    res.send("Authenticeted Successfully");
})

app.post('/login', async (req, res) => {
    const username = req.body?.username;
    const password = req.body?.password;

    db.query(
        "SELECT * FROM user WHERE username=?",
        [username],
        (err, result) => {
            if (err) {
                console.log("Error:", err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            if (result.length > 0) {
                bcryptjs.compare(password, result[0].password, (err, response) => {
                    if (response) {
                        const id  = result[0].id;
                        const token = jwt.sign({ id }, "secret", { expiresIn: 300 });
                        res.json({ auth: true, token: token, result: result[0], message: 'Login Successful' });
                    } else {
                        res.status(401).json({ message: 'Invalid Credentials' });
                    }
                });
            } else {
                res.status(401).json({ message: 'Invalid Credentials' });
            }
        }
    );
});

const verJWT = (req, res, next) => {
    const token = req.headers["x-access-token"];
    if (!token) {
        res.send("We need token give it next time");
    } else {
        jwt.verify(token, "secret", (err, decoded) => {
            if (err) {
                res.json({ auth: false, message: "Failed to authenticate" });
            } else {
                req.usermail = decoded.id;
                next();
            }
        });
    }
};


app.get('/isAauth', verJWT, (req, res) => {
    const userDetails = {
        usermail: req.usermail,
    };

    res.json({ result: [userDetails] });
});

app.post('/alogin', async (req, res) => {
    const adminname = req.body?.adminname;
    const password = req.body?.password;

    db.query(
        "SELECT * FROM admin WHERE adminname=?",
        [adminname],
        (err, result) => {
            if (err) {
                console.log("Error:", err);
                res.status(500).json({ error: 'Internal Server Error' });
                return;
            }

            if (result.length > 0) {
                bcryptjs.compare(password, result[0].password, (err, response) => {
                    if (response) {
                        const id  = result[0].id;
                        const token = jwt.sign({ id }, "secret", { expiresIn: 300 });
                        res.json({ auth: true, token: token, message: 'Login Successful' });
                    } else {
                        res.status(401).json({ message: 'Invalid Credentials' });
                    }
                });
            } else {
                res.status(401).json({ message: 'Invalid Credentials' });
            }
        }
    );
});

app.post('/add', (req, res) => {
    const name = req.body?.name;
    const author = req.body?.author;
    const subject = req.body?.subject;
    const date = req.body?.date;

    if (!name || !author || !subject || !date) {
        return res.status(400).json({ error: 'Please fill in all details' });
    }

    console.log(req.body);

    db.query(
        'INSERT INTO books (name,author,subject,date) VALUES (?,?,?,?)',
        [name,author,subject,date],
        (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).json({ error: 'Internal Server Error' });
            } else {
                console.log(result);
                return res.status(200).json({ message: 'Registration Successful' });
            }
        }
    );
 });

 app.get('/book' , (req,res) => {
    db.query("SELECT * FROM books", 
    (err,result)=>{
        if(err)
        {
            console.log(err);
        }
        else{
            res.send(result);
        }
    }
    )
})

 app.listen(3080,()=>{
    console.log('Server started');
    });