// var canvas = document.getElementById('canvas');
// var ctx = canvas.getContext('2d');
var playBtn = document.getElementById('playBtn');
var loader = document.getElementById('loader');
var msgBox = document.getElementById('msgBox');
var sendBtn = document.getElementById('sendBtn');
var messageData = document.getElementById('messageData');
var usernameInput = document.getElementById('usernameInput');
var header = document.getElementById('header');
var socket = io();

function play() {
    var name = usernameInput.value;
    usernameInput.style.display = 'none';
    socket.emit('play', {name: name});
    playBtn.style.display = 'none';
    loader.style.display = 'block';
}

function sendMsg() {
    var message = msgBox.value;
    socket.emit('sendMsg', {message: message});
    msgBox.value = '';
}

function stopSearch() {
    socket.emit('stopSearch', {});
}

setInterval(function(){
    socket.emit('checkstats');
}, 100)

socket.on('userData', function(data) {
    document.getElementById('username').innerText = `Name: ${data.username}`;
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
    sendBtn.style.display = 'none';
    msgBox.style.display = 'none';
    usernameInput.style.display = 'block';
    usernameInput.value = '';
    messageData.style.display = 'none';
    messageData.innerHTML = '';
    header.innerText = 'You are in the main lobby'
})
socket.on('receiveMsg', function(data) {
    var time = new Date().toLocaleTimeString();
    var row = document.createElement('div');
    row.classList.add('row');
    row.classList.add('border');
    row.classList.add('border-primary');

    var col = document.createElement('div');
    col.classList.add('col')

    var message = document.createElement('span');
    message.innerText = data.username + '  ' + time + '  ' + data.message;
    message.innerText = `${data.username} at ${time} \n ${data.message}`;

    col.append(message);
    row.append(col);
    messageData.prepend(row);
})
socket.on('matchFound', function(data) {
    loader.style.display = 'none';
    usernameInput.style.display = 'none';
    sendBtn.style.display = 'block';
    msgBox.style.display = 'block';
    messageData.style.display = 'block';
    header.innerText = 'Match Found! Partnered with: ' + data.opponentName;
})
socket.on('searchingForGame', function() {
    header.innerText = 'Searching. Please wait...';
})
usernameInput.addEventListener('keydown', function(e) {
    switch(e.keyCode) {
        case 13:
            var name = usernameInput.value;
            usernameInput.style.display = 'none';
            socket.emit('play', {name: name});
            playBtn.style.display = 'none';
            loader.style.display = 'block';
        break;
        default: //do nothing
    }
})

msgBox.addEventListener('keydown', function(e) {    
    console.log(e.keyCode)
    switch(e.keyCode) {
        case 13:
            var message = msgBox.value;
            socket.emit('sendMsg', {message: message});
            msgBox.value = '';
        break;
        default: //do nothing
    }
})


socket.on('joinLobby_opponentDisconnect', function(data) {
    playBtn.style.display = 'block';
    loader.style.display = 'none';
    sendBtn.style.display = 'none';
    msgBox.style.display = 'none';
    usernameInput.style.display = 'block';
    usernameInput.value = '';
    messageData.style.display = 'none';
    messageData.innerHTML = '';
    header.innerText = data.opponentName + ' Disconnected! You returned to the main lobby.';
})

socket.on('refresh', function() {
    window.location.href = '/';
})