///////////////////////
/////// CLASSES //////
//////////////////
class GameStateContainer {

    constructor(gamestate) {
        this.current = gamestate;
        this.gamestates = new Array();
        this.gamestates.push(gamestate);
    }
    Add(g) {
        this.current = g;
        this.gamestates.push(new GameState(this.current.counter1, this.current.counter2, this.current.matchCounter1, this.current.matchCounter2, this.current.serve1, this.current.serve2, this.current.server, this.current.whoStarted, this.current.switchUsers, this.isMatchPoint));
    }
    Copy(g) {
        return new GameState(g.counter1, g.counter2, g.matchCounter1, g.matchCounter2, g.serve1, g.serve2, g.server, g.whoStarted, g.switchUsers, g.isMatchPoint);
    }
}
class GameState {
    constructor(counter1, counter2, matchCounter1, matchCounter2, serve1, serve2, server, whoStarted, switchUsers, isMatchPoint) {
        this.counter1 = counter1;
        this.counter2 = counter2;
        this.matchCounter1 = matchCounter1;
        this.matchCounter2 = matchCounter2;
        this.serve1 = serve1;
        this.serve2 = serve2;
        this.serve = serve;
        this.whoStarted = whoStarted;
        this.switchUsers = switchUsers;
        this.isMatchPoint = isMatchPoint;
    }
}

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



var counter1 = 0;
var counter2 = 0;
var matchCounter1 = 0;
var matchCounter2 = 0;
var serve1 = 2;
var serve2 = 0;
var serve = 1;
var whoStarted = 1;
var switchUsers = false;

var gameState = new GameState(counter1, counter2, matchCounter1, matchCounter2, serve1, serve2, whoStarted, switchUsers);
var gameStateContainer = new GameStateContainer();
gameStateContainer.Add(gameState);


app.use(express.static('public'));

app.get('/', function (req, res) {

    res.sendFile(__dirname + '/index.html');
});

app.get('/back', function (req, res) {

    gameStateContainer.gamestates.pop();
    emitAll(gameStateContainer.Copy(gameStateContainer.gamestates[gameStateContainer.gamestates.length - 1]));
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end();
});
app.get('/add', function (req, res) {

    score('add', req.query.p);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end();
});

function score(action, player) {

    if (gameState.isMatchPoint) {
        if (gameState.counter1 > gameState.counter2) {
            gameState.matchCounter1 += 1;
        }
        else {
            gameState.matchCounter2 += 1;
        }
        gameState.counter1 = gameState.counter2 = 0;

        gameState.switchUsers = !gameState.switchUsers;
        if (gameState.whoStarted == 1) {
            gameState.whoStarted = 2;
            gameState.serve = 2;
            gameState.serve2 = 2;
        } else {
            gameState.whoStarted = 1;
            gameState.serve = 1;
            gameState.serve1 = 2;
        }
        gameState.isMatchPoint = false;
        gameStateContainer.Add(gameState);
        emitAll(gameState);
        return;

    }
    if (gameState.switchUsers) {
        if (player == 1)
            player = 2;
        else
            player = 1;
    }

    //audioplayer.play(__dirname + '/ding.mp3', function (err) {

    gameState.isMatchPoint = false;

        if (player == 1) {
            gameState.counter1 += 1;

        } else {
            gameState.counter2 += 1;

        }


    if (gameState.serve == 1) {
        gameState.serve1 = gameState.serve1 - 1;
        if (gameState.serve1 == 0) {
            gameState.serve = 2;
            gameState.serve2 = howManyServes(gameState.counter1, gameState.counter2);
            if (gameState.serve2 > 1) {
                server.emit('p2_turn', gameState.serve2);
            }
            gameState.serve1 = 0;
        }
    } else {
        gameState.serve2 = gameState.serve2 - 1;
        if (gameState.serve2 == 0) {
            gameState.serve = 1;
            gameState.serve1 = howManyServes(gameState.counter1, gameState.counter2);
            if (gameState.serve1 > 1)
                server.emit('p1_turn', gameState.serve1);
            gameState.serve2 = 0;
        }

    }

    //server.emit('serve', { p: gameState.serve, s: gameState.serve1 +gameState.serve2 });
    

    if (gameState.counter1 > gameState.counter2) {
        if (gameState.counter1 >= 11 && gameState.counter1 - gameState.counter2 >= 2) {
            gameState.isMatchPoint = true;
        }
    } else if (gameState.counter2 >= 11 && gameState.counter2 - gameState.counter1 >=2) {
        gameState.isMatchPoint = true;
    }

    

    gameStateContainer.Add(gameState);
    if (gameState.isMatchPoint) {
        //beep(3,1000);

        //server.emit('serve', { p: gameState.serve, s: gameState.serve1 + gameState.serve2 });
        emitAll(gameState);
    } else {
        emitWithoutMatchPoint(gameState);
    }
    

}
function emitMatchPoint(gamestate) {
    server.emit('p1_match', gamestate.matchCounter1);
    server.emit('p2_match', gamestate.matchCounter2);
}
function emitWithoutMatchPoint(gamestate) {
    server.emit('p1_count', gamestate.counter1);
    server.emit('p2_count', gamestate.counter2);
    server.emit('serve', { p: gamestate.serve, s: gamestate.serve1 + gamestate.serve2 });
}
function emitAll(gamestate) {
    server.emit('p1_count', gamestate.counter1);
    server.emit('p2_count', gamestate.counter2);
    server.emit('p1_match', gamestate.matchCounter1);
    server.emit('p2_match', gamestate.matchCounter2);
    server.emit('serve', { p: gamestate.serve, s: gamestate.serve1 + gamestate.serve2 });
}

server.on('connection', function (socket) {
    

    //on user connected sends the current click count
    //socket.emit('click_count', counter);
    socket.emit('p1_count', gameState.counter1);
    socket.emit('p2_count', gameState.counter2);
    server.emit('p1_match', gameState.matchCounter1);
    server.emit('p2_match', gameState.matchCounter2);
    server.emit('serve', { p: gameState.serve, s: gameState.serve1 + gameState.serve2 });
    //when user click the button
    socket.on('clicked', function () {
        //counter += 1;//increments global click count
         gameState.counter1 = 0;
         gameState.counter2 = 0;
         gameState.matchCounter1 = 0;
         gameState.matchCounter2 = 0;
         gameState.serve1 = 2;
         gameState.serve2 = 0;
         gameState.serve = 1;
        gameState.whoStarted = 1;
        gameState.switchUsers = false;
        gameState.isMatchPoint = false;
        gameStateContainer = new GameStateContainer();
        gameStateContainer.Add(gameState);
        emitAll(gameState);


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



