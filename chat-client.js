// Require the packages we will use:
const http = require("http"),
    fs = require("fs");

const port = 3456;
const file = "client.html";
var all_rooms = {};

let roomCount = 0;
// Listen for HTTP connections.  This is essentially a miniature static file server that only serves our one file, client.html, on port 3456:
const server = http.createServer(function (req, res) {
    // This callback runs when a new connection is made to our HTTP server.

    fs.readFile(file, function (err, data) {
        // This callback runs when the client.html file has been read from the filesystem.
        if (err) return res.writeHead(500);
        res.writeHead(200);
        res.end(data);

    });
});



server.listen(port);

// Import Socket.IO and pass our HTTP server object to it.
const socketio = require("socket.io")(http, {
    wsEngine: 'ws'
});
// Attach our Socket.IO server to our HTTP server to listen

console.log("server running");
const io = socketio.listen(server);
io.sockets.on("connection", function (socket) {
    // This callback runs when a new Socket.IO connection is established.
    socket.on('message_to_server', function (data) { 
        // This callback runs when the server receives a new message from the client.
        console.log("message: " + data["message"]); // log it to the Node.JS output
        io.sockets.emit("message_to_client", {message: data["message"]}) // broadcast the message to other users
    });

    socket.on("create_room",function(data) {
        
        const roomName = data['nameOfRoom'];
        const userName = data['userName'];
        const password = data['chatroomPassword'];
        console.log(data);
        const room = {roomName, password};
        all_rooms[roomCount++] = room;
        io.sockets.emit("all_rooms_available", {all_rooms:all_rooms});
     });
     
});