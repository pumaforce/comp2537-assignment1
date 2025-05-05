require('dotenv').config(); 
require('./utils.js'); 
const express = require('express');
const session = require("express-session");
const bcrypt = require("bcrypt");
const MongoStore = require("connect-mongo");
const saltRounds = 12;
// 1 hours
const expireTime = 1 * 60 * 60 * 1000; 

const PORT = process.env.PORT || 3000;
const app = express();

const node_session_secret = process.env.NODE_SESSION_SECRET;
const mongodb_session_secret = process.env.MONGODB_SECRET;
const mongodb_user = process.env.MONGODB_USER; 
const mongodb_password =  process.env.MONGODB_PASSWORD; 
const mongodb_host = process.env.MONGODB_HOST; 
const mongodb_database = process.env.MONGODB_DATABASE;

var {database} = include('databaseConnection');
const userCollection = database.db(mongodb_database).collection("users");

let users = [];



var mongoStore = MongoStore.create({
    mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
    crypto: {
        secret: mongodb_session_secret
    }
});

app.use(session({
    secret: node_session_secret,
    store: mongoStore,
    saveUninitialized: false,
    resave: true
}));

app.use(express.urlencoded({ extended: false }));   


app.get("/", function(req, res) {
    if (!req.session.authenticated) {
        let signUpHtml =`<a href="/signup"><button>Sign Up</button></a>`;
        let loginHtml =`<a href="/login"><button>Log in</button></a>`;
        res.send(signUpHtml + `<br /> ` + loginHtml); 
    } else {
        let html = `Hello ${req.session.name} <br /> <br />
            <a href="/members"><button>Go to Memebers Area</button></a><br />
            <a href="/logout"><button>Logout</button></a><br />`;
        res.send(html);
    } 
    
});

app.get("/logout", function(req, res) {
    if (req.session) {
        req.session.destroy();
        res.redirect("/");
    }
    
});

app.get("/signup", function (req, res) {
    const html = `<form action="/submitUser" method="POST">
    <input type="text" name="name" placeholder="Name"><br />
    <input type="text" name="username" placeholder="Username"><br />
    <input type="password" name="password" placeholder="Password"><br />
    <button type="submit">Submit</button>
    </form>`;
    res.send(html);
});

app.post("/submitUser", async (req, res) =>{
    let name = req.body.name;
    let username = req.body.username;
    let password = req.body.password;

    let errorHtml =`<a href="/signup">Try again</a>`;
    if (name === "") {
        res.send("Name is required  <br /><br />" + errorHtml);
        return;
    }
    if (username === "") {
        res.send("Username is required  <br /><br />" + errorHtml);
        return;
    } 
    if (password === "") {
        res.send("Password is required  <br /><br />" + errorHtml);
        return;
    }
 
    let hashedPassword = bcrypt.hashSync(password, saltRounds);
    users.push({
        name: name,
        username: username,
        password: hashedPassword
    });

    console.log(users);
    let usershtml = "";
    for (i = 0; i < users.length; i++) {
        usershtml += `<li>${users[i].username} : ${users[i].password}</li>`;
    }
    await userCollection.insertOne({username: username, password: hashedPassword, name: name});
    let html = `<ul>${usershtml}</ul>`;
    req.session.authenticated = true;
    req.session.username = username;
    req.session.name = name;
    req.session.cookie.maxAge = expireTime;
    // res.send(html);
    res.redirect("/");

});

// server side logging in check
app.post("/loggingin", async(req, res) =>{
    let username = req.body.username;
    let password = req.body.password;

    for (i = 0; i < users.length; i++) {
        console.log(`${users[i].username} : ${username}`) ;
        if (users[i].username === username) {
            console.log(`${users[i].password} : ${password}`) ;
            let result = await bcrypt.compare(password, users[i].password);
            console.log(`${result}`) ;
            if (result === true) {
                req.session.authenticated = true;
                req.session.username = username;
                req.session.name = users[i].name;
                req.session.cookie.maxAge = expireTime;
                res.redirect("/");
                return;
            } 
        }
    }
    // res.send("Invalid credentials");
    res.redirect("/login");
    return;
});

app.get("/members", function(req, res) {
    console.log(req.session.authenticated);
    if (!req.session.authenticated) {
        res.redirect("/login");
    } else {
        res.send(`Welcome ${req.session.username} - Members Only Area`);   
    }
});

app.get("/login", function(req, res) {
    
    const html = `<form action="/loggingin" method="POST">
    <input type="text" name="username" placeholder="Username" required><br />
    <input type="password" name="password" placeholder="Password" required><br />
    <button type="submit">Submit</button><br />
    <a href="/signup">Sign Up</a> <br />
    <a href="/">Home</a>
    </form>`;
    res.send(html);
    
});

app.get('*', (req, res) => {
    res.status(404).send('404 Not Found');
  });

app.listen(
    PORT, 
    () => { console.log(`Server is running on http://localhost:${PORT}`);
});
