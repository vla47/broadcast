const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const log = require('simple-node-logger').createSimpleFileLogger('project.log');

const app = express();

var users = [];
var connections = [];
var messages = [];

// CORS Middleware
app.use(cors());

// Port Number
const port = process.env.PORT || 3000;

// Parsers for POST data
app.use(bodyParser.json());

// Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));

// Catch all other routes and return the index file
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Start Server
var server = app.listen(port, () => {
    console.log('Server started on port ' + port);
});

//socket.io instantiation
const io = require("socket.io")(server)

//listen on every connection
io.on('connection', (socket) => {
    connections.push(socket);
    console.log('Connected: %s sockets connected', connections.length)

    //listen on disconnect
    socket.on('disconnect', (data) => {
        users.splice(connections.indexOf(socket.username), 1);
        updateUsernames();
        connections.splice(connections.indexOf(socket), 1);
        console.log('Disconnected %s sockets connected', connections.length);
    });

    //listen on send message
    socket.on('send message', (message, callback) => {
        messages.push(message);
        log.info('message: ' + message.message + ', username: ' + socket.username);
        console.log(message)
        io.sockets.to(message.to).emit('new message', message);
        callback({ok:true});
    });

    //listen on send message
    socket.on('broadcast message', (message) => {
        messages.push(message);
        log.info('message: ' + message.message + ', username: ' + socket.username);
        io.sockets.emit('new message', message);
    });

    socket.on('new user', (username, callback) => {
        console.log(username)
        if (username in users){
            callback(false);
        } else {
            callback(true);
            socket.username = username;
            users.push(socket.username);
            socket.join(socket.username); 
            updateUsernames();
        }
        
    });

    //listen on typing
    socket.on('typing', (data) => {
        socket.broadcast.emit('typing', {
            username: socket.username
        });
    });

    function updateUsernames() {
        io.sockets.emit('get users', users)
    }
});