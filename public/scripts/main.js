// var canvas = document.getElementById('canvas');
// var ctx = canvas.getContext('2d');
var playBtn = document.getElementById('playBtn');
var loader = document.getElementById('loader');
var msgBox = document.getElementById('msgBox');
var sendBtn = document.getElementById('sendBtn');
var messageData = document.getElementById('messageData');
var username = document.getElementById('username');
var socket = io();

function play() {
    var name = username.value;
    socket.emit('play', {name: name});
    playBtn.style.display = 'none';
    loader.style.display = 'block';
    username.style.display = 'none';
}

function sendMsg() {
    var message = msgBox.value;
    socket.emit('sendMsg', {message: message});
}

function stopSearch() {
    socket.emit('stopSearch', {});
}

setInterval(function(){
    socket.emit('checkstats');
}, 300)

socket.on('userData', function(data) {
    document.getElementById('userId').innerText = `ID: ${data.id}`;
    document.getElementById('lobbyId').innerText =  `Lobby ID: ${data.lobbyId}`;
    document.getElementById('usersInMain').innerText = `Main Lobby: ${data.main}`;
    document.getElementById('usersSearching').innerText = `Searching: ${data.searching}`;
    document.getElementById('usersInMatches').innerText = `Matches: ${data.matches}`;
});

//joins main lobby
socket.on('joinLobby', function() {
    playBtn.style.display = 'block';
    loader.style.display = 'none';
    username.style.display = 'block';
    sendBtn.style.display = 'none';
    messageData.style.display = 'none';
    messageData.innerHTML = '';
})
socket.on('receiveMsg', function(data) {
    var time = new Date().toLocaleTimeString();
    var row = document.createElement('div');
    row.classList.add('row')

    var col = document.createElement('div');
    col.classList.add('col')

    var message = document.createElement('span');
    message.innerText = time + '  ' + data.message;

    col.append(message);
    row.append(col);
    messageData.append(row);
})
socket.on('matchFound', function() {
    console.log('match found')
    loader.style.display = 'none';
    username.style.display = 'none';
    sendBtn.style.display = 'block';
    msgBox.style.display = 'block';
    messageData.style.display = 'block';
})