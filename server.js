var express = require("express");
var path = require("path");
var app = express();

var PORT = process.env.PORT || 3000;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/public", express.static(__dirname + "/public"));

require("./routes/htmlRoutes")(app);

var serv = require('http').createServer(app);

serv.listen(PORT, function() {
  console.log("App listening on PORT: " + PORT);
});

var io = require('socket.io')(serv, {});

//stores list of sessions
var users = {};

//Lobby contains the main lobby, searching, and matched lobby data.
var lobby = {
  main: {
    users: {},
    count: 0
  }, 
  searching: {
    users: {}, 
    count: 0
  }, 
  matched: {
    games: {}, 
    count: 0
  }
};


io.sockets.on('connection', function(socket) { 

  //add user to list on connection
  users[socket.id] = socket;
  socket.emit('joinLobby');
  for(var i in users){
    var user = users[i];
    if(user.id === socket.id) {
      user.inLobby = 'main';
      user.username = 'Anon';
      //adds individual to main lobby
      lobby.main.users[user.id] = user;
      lobby.main.count++;
    }
  }

  //press play
  socket.on('play', function(data) {
    //if no one is in the search lobby
    if(lobby.searching.count === 0) {
      for(var i in users){
        var user = users[i];
        if(user.id === socket.id) {
          //set name
          user.username = data.name;

          //exit main lobby
          delete lobby.main.users[user.id];
          lobby.main.count--;

          //enter search queue
          user.inLobby = 'search';
          lobby.searching.users[user.id] = user;
          lobby.searching.count++;
          user.emit('searchingForGame', {});
        }
      }
      //if someones already searching you create a match and join it, then bring the searcher to the match and delete them from the search and delete yourself from the main lobby
    } else if(lobby.searching.count === 1) {
  
      for(var i in users){
        var user = users[i];
        if(user.id === socket.id) {
          user.username = data.name;
          var lobbyId = Math.random();
          user.inLobby = lobbyId;
          delete lobby.main.users[user.id];
          lobby.main.count--;
          lobby.matched.games[lobbyId] = []; //lobby.matched.games.uniqueid gets set as an empty array
          lobby.matched.games[lobbyId].push(user) //push current user to the array
          lobby.matched.count++;
          for(var i in lobby.searching.users) {

            //add opponent data to match
            var opponent = lobby.searching.users[i];
            socket.emit('matchFound', {opponentName: opponent.username});
            opponent.inLobby = lobbyId;
            opponent.emit('matchFound', {opponentName: user.username});
            lobby.matched.games[lobbyId].push(opponent);

            //delete opponent data from search
            delete lobby.searching.users[opponent.id];
            if(lobby.searching.count > 0) {            
              lobby.searching.count--;
            }
          }
        }
      }
    } else {
      socket.emit('refresh');
    }
  })
  socket.on('sendMsg', function(data) {
    for(var i in users) {
      var user = users[i];
      if(user.id === socket.id) {
        for(var j = 0; j < lobby.matched.games[user.inLobby].length; j++) {
          lobby.matched.games[user.inLobby][j].emit('receiveMsg', {message: data.message, username: user.username})
        }
      }
    }
  })
  socket.on('checkstats', function() {
    for(var i in users) {
      if(users[i].id === socket.id) {
        var lobbyId = users[i].inLobby;
        var id = users[i].id
        var username = users[i].username;
      }
    }
    socket.emit('userData', {
      username: username,
      id: id,
      lobbyId: lobbyId,
      main: lobby.main.count,
      searching: lobby.searching.count,
      matches: lobby.matched.count,
    })
  })
  socket.on('stopSearch', function() {
    lobby.main.users[socket.id] = lobby.searching.users[socket.id]; 
    lobby.main.count++;

    delete lobby.searching.users[socket.id]; 
    if(lobby.searching.count > 0) {            
      lobby.searching.count--;
    }
    socket.emit('joinLobby', {});
  })
  socket.on('disconnect', function() {
    for(var i in users) {
      var user = users[i];
      var opponentName = user.username; 
      if(user.id === socket.id) {

        //delete user from user list
        delete users[socket.id]
        if(user.inLobby === 'main') {

          //if they are in the main lobby, delete them from there as well
          delete lobby.main.users[socket.id];
          lobby.main.count--;
        } else if(user.inLobby === 'search') {

          //delete them from search queue if they disconnect while in there
          delete lobby.searching.users[socket.id]; 
          if(lobby.searching.count > 0) {            
            lobby.searching.count--;
          }
        } else if(user.inLobby !== 'search' && user.inLobby !== 'main') {  
          //if they are not searching or in main. in other words, if they are in a match
          //delete the user who disconnected from the match
          for(var j = 0; j < lobby.matched.games[user.inLobby].length; j++) {
            var theMatch = lobby.matched.games[user.inLobby][j];
            if(theMatch.id === socket.id) {              
              lobby.matched.games[user.inLobby].splice(j, 1);
              break;
            } 
          }

          //move other player in match back to lobby
          lobby.main.users[lobby.matched.games[user.inLobby][0].id] = lobby.matched.games[user.inLobby][0]
          lobby.main.users[lobby.matched.games[user.inLobby][0].id].inLobby = 'main';
          lobby.main.count++;
          lobby.main.users[lobby.matched.games[user.inLobby][0].id].emit('joinLobby_opponentDisconnect', {opponentName: opponentName});
          //delete the match
          delete lobby.matched.games[user.inLobby];
          lobby.matched.count--;
        }
      }
    }
  })
})