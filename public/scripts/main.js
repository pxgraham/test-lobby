// var canvas = document.getElementById('canvas');
// var ctx = canvas.getContext('2d');
var playBtn = document.getElementById('playBtn');
var joined = false;
var socket = io();
function play() {
    if(!joined) {
        var name = document.getElementById('name').value;
        socket.emit('play', {name: name});
        joined = true;
        playBtn.classList.add('btn-danger')
    }
}

function checkstats() {
    socket.emit('checkstats');
}
socket.on('joinMsg', function(data) {
    document.getElementById('message').innerText = 'Joined ' + data.lobby;
})