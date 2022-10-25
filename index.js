var express = require('express');
var app = express();
var http = require('http').Server(app);
var server = require('socket.io')(http, {
    cors: {
        origin: "http://localhost:8100",
        methods: ["GET", "POST"],
        transports: ['websocket', 'polling'],
        credentials: true
    },
    allowEIO3: true
});
var port = 89;
//var audioplayer = require('play-sound')(opts = {});

var counter = 0;//Initial counter value 
var counter1 = 0;
var counter2 = 0;
var matchCounter1 = 0;
var matchCounter2 = 0;
var serve1 = 2;
var serve2 = 0;
var serve = 1;
var whoStarted = 1;

app.use(express.static('public'));

app.get('/', function (req, res) {

    res.sendFile(__dirname + '/index.html');
});

app.get('/add', function (req, res) {

    //audioplayer.play(__dirname + '/ding.mp3', function (err) {
    
    var matchPoint = false;
    var player = req.query.p;
    if (player == 1) {
        counter1 += 1;

    } else {
        counter2 += 1;

    }

    if (serve == 1) {
        serve1 = serve1 - 1;
        if (serve1 == 0) {
            serve = 2;
            serve2 = howManyServes(counter1, counter2);
            serve1 = 0;
        }
    } else {
        serve2 = serve2 - 1;
        if (serve2 == 0) {
            serve = 1;
            serve1 = howManyServes(counter1, counter2);
            serve2 = 0;
        }

    }

    server.emit('serve', { p: serve, s: serve1+serve2 });
    

    if (counter1 > counter2) {
        if (counter1 >= 11 && counter1 - counter2 >= 2) {
            matchCounter1 += 1;
            counter1 = 0;
            counter2 = 0;
            matchPoint = true;
            
        }
    } else if (counter2 >= 11 && counter2 - counter1 >=2) {
        matchCounter2 += 1;
        counter1 = 0;
        counter2 = 0;
        matchPoint = true;
    }

    if (matchPoint) {
        if (whoStarted == 1) {
            whoStarted = 2;
            serve = 2;
            serve2 = 2;
        } else {
            whoStarted = 1;
            serve = 1;
            serve1 = 2;
        }
        server.emit('serve', { p: serve, s: serve1 + serve2 });
    }
    

    server.emit('p1_count', counter1);
    server.emit('p2_count', counter2);
    server.emit('p1_match', matchCounter1);
    server.emit('p2_match', matchCounter2);
    


    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end();

});

server.on('connection', function (socket) {
    

    //on user connected sends the current click count
    //socket.emit('click_count', counter);
    socket.emit('p1_count', counter1);
    socket.emit('p2_count', counter2);
    server.emit('serve', { p: serve, s: serve1 + serve2 });
    //when user click the button
    socket.on('clicked', function () {
        //counter += 1;//increments global click count
         counter1 = 0;
         counter2 = 0;
         matchCounter1 = 0;
         matchCounter2 = 0;
         serve1 = 2;
         serve2 = 0;
         serve = 1;
        whoStarted = 1;
        server.emit('p1_count', counter1);
        server.emit('p2_count', counter2);
        server.emit('p1_match', matchCounter1);
        server.emit('p2_match', matchCounter2);
        server.emit('serve', { p: serve, s: serve1 + serve2 });

        //server.emit('click_count', counter);//send to all users new counter value
    });

});

//starting server
http.listen(port, function () {
    console.log('listening on port:' + port);
});
function howManyServes(p1, p2) {
    if (p1 >= 10 && p2 >= 10)
        return 1;
    else
        return 2;
}












//////'use strict';
////// index.js

/////**
//// * App Variables
//// */
////const express = require("express");
////const path = require("path");
//////var http = require('http');
////var port = process.env.PORT || 8000;
////const app = express();

/////**
//// *  App Configuration
//// */

////app.set("views", path.join(__dirname, "views"));
////app.set("view engine", "pug");


/////*http.createServer(function (request, response) {
    
////    if (request.method == 'POST') {
////        var body = '';
////        request.on('data', function (data) {
////            body += data;
////        });
////        request.on('end', function () {
////            console.log('Body: ' + body);
////            response.writeHead(200, { 'Content-Type': 'text/plain' });
////            console.log('Data', 'body:' + body + '\n waiting for another request...');
////            response.end('body:' + body + '\n waiting for another request...');
////        });
////    } else {
////        response.writeHead(200, { 'Content-Type': 'text/plain' });
////        response.end('PingPong Scoreboard waiting for requests...\n');
////    }
////}).listen(port);
////*/

/////**
//// * Routes Definitions
//// */
////app.get("/", (req, res) => {
////    res.render("index", { title: "cHome" });
////});

/////**
//// * Server Activation
//// */
////app.listen(port, () => {
////    console.log(`Listening to requests on http://localhost:${port}`);
////});
