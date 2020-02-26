var express = require("express");
var path = require("path");
var app = express();

var PORT = process.env.PORT || 8080;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/public", express.static(__dirname + "/public"));

require("./routes/htmlRoutes")(app);

var serv = require('http').createServer(app);

serv.listen(PORT, function() {
  console.log("App listening on PORT: " + PORT);
});

var io = require('socket.io')(serv, {});
var users = {};

//currently set up to where when you press play, you start searching. if there is at least 1 person
//searching already, you both join a match together. 
var lobby = {main: {users: 0}, searching: {users: {}, count: 0}, matched: {}};
io.sockets.on('connection', function(socket) { 
  console.log(socket.id + ' joined main')
  socket.emit('joinMsg', {lobby: 'Main Lobby'})
  users[socket.id] = socket;
  for(var i in users){
    var user = users[i];
    if(user.id === socket.id) {
      lobby.main[user.id] = user;
      lobby.main.users++;
    }
  }

  //press play
  socket.on('play', function(data) {
    socket.emit('joinedState', {joined: true});
    console.log(socket.id + ' joined search')
    socket.emit('joinMsg', {lobby: 'Search'})

    //if no one is searching
    if(lobby.searching.count === 0) {
      for(var i in users){
        var user = users[i];
        if(user.id === socket.id) {

          //exit lobby and enter search
          delete lobby.main[user.id];
          lobby.searching.users[user.id] = user;
          lobby.searching.count++;
        }
      }
      //if one other person is searching
    } else if(lobby.searching.count === 1) {
      socket.emit('joinMsg', {lobby: 'Match! id:  ' + socket.id})
      console.log(socket.id + ' joined match')
      for(var i in users){
        var user = users[i];
        if(user.id === socket.id) {
          //enter match
          lobby.matched[user.id] = [];
          lobby.matched[user.id].push(user)
          //bring person whos searching to match with you
          for(var i in lobby.searching.users) {
            var opponent = lobby.searching.users[i];
            opponent.emit('joinMsg', {lobby: 'Match! id:  ' + user.id})
            console.log(opponent.id + ' joined match')
            opponent.lobbyId = user.id;
            user.lobbyId = opponent.lobbyId;
            lobby.matched[user.id].push(opponent);
            delete lobby.searching.users[opponent.id];
            lobby.searching.count --;
          }
        }
      }
    }
  })
  socket.on('checkstats', function() {
    for(var i in lobby.matched) { //gets all matched lobbies

    }
  })
  socket.on('disconnect', function() {
    for(var i in users) {
      if(users[i].id === socket.id) {
        delete users[socket.id]
        console.log('user left')
      }
    }
    for(var i in lobby.main) {
      if(lobby.main[i].id === socket.id) {
        delete lobby.main[socket.id];
        lobby.searching.count--;
        console.log('disconnected from main')
      }
    }
    for(var i in lobby.searching.users) {
      if(lobby.searching.users[i].id === socket.id) {
        delete lobby.searching.users[socket.id]
        console.log('disconnected from search')
      }
    }
  })
})