'use strict';

require('dotenv').config();
const express = require('express');
const app = express();
let superagent = require('superagent')
let cookie = require('cookie');
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.cookie('isNewVisitor', false, { maxAge: 900000 });
    res.sendFile('./index.html', { root: './' });
})

app.get('/new', (req, res) => {
    let authToken = 'newUser=false';
    let newUser = !req.headers.cookie.includes(authToken);
    console.log('New User: ', newUser)
    if (newUser) {
        res.write('<h1>Welcome!</h1>');
        res.end();
    } else {
        res.write('<h1>Welcome Back!</h1>');
        res.end();
    }
});


app.get('/oauth-callback', (req, res) => {
    let { code, state } = req.query;
    if (!code) {
        res.write('<h1>Unauthorized</h1>');
        res.write('<p>You must be authorized to access this page.</p>');
        res.end();
    }

    let tokenUrl = 'https://github.com/login/oauth/access_token'
    superagent.post(tokenUrl)
        .send({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            code: code,
            state: state
        })
        .then(tokenResponse => {
            let token = tokenResponse.body.access_token;
            token = 'cheat' + token + 'cheat';
            res.cookie('oath-token', token, { maxAge: 100000 });
            res.write('<h1> Permission granted!</h1>');
            res.write('<a href="/profile">Profile Page</a>')
            res.end();
        });
});


app.get('/profile', (req, res) => {
    let authToken = 'oauth-token';
    let isLoggedIn = req.headers.cookie.includes(authToken);
    // if (!isLoggedIn) {
    //     res.write('<h1>Not Authorized</h1>');
    //     res.write('<p>Please log in to view this page.</p>');
    //     res.end();
    //     return;
    // 
    let token = req.headers.cookie.split('cheat')[1];
    let userUrl = 'https://api.github.com/user?';
    userUrl += 'access_token=' + token;
    superagent.get(userUrl)
        .then(userResponse => {
            let userName = userResponse.body.login;
            let bio = userResponse.body.bio;
            res.write('<a href="http://localhost:3000"> << home </a>')
            res.write('<img src="' + userResponse.body.avatar_url + '"/>')
            res.write('<h3>' + userName + '</h3>')
            res.write('<p>' + bio + '</p>')
            res.write('<pre' + JSON.stringify(userResponse.body) + '</pre>')
            res.end()
        })
        .catch(err => {
            res.write('<h1>Error</h1>')
            res.write('<p>' + err.body + '</p>');
            res.end();
        });
});




app.listen(PORT, () => {
    console.log(`listening on http://localhost${PORT}`)
});