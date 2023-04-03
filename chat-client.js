// Require the packages we will use:
const http = require("http"),
    fs = require("fs");

const port = 3456;
const file = "client.html";
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
var globalMessages = {};


// Attach our Socket.IO server to our HTTP server to listen
const io = socketio.listen(server);
io.sockets.on("connection", function (socket) {
    // This callback runs when a new Socket.IO connection is established.

    socket.on('message_to_server', function (data) {
        // This callback runs when the server receives a new message from the client.
        console.log("message: " + data["message"]); // log it to the Node.JS output
        const room = data["room"];
        const message = { message: data["message"], user: data["user"], room: room };
        if (!globalMessages[room]) {
            globalMessages[room] = []; 
          }
        globalMessages[room].push(message);
        console.log(globalMessages)
        io.sockets.emit("message_to_client", { message: data["message"], user: data["user"], room: data['room'], globalMessages: globalMessages }) // broadcast the message to other users
    });
    
    socket.on('setCurrentUser', function (data) {
        console.log("userwhologgedin: " + data["user"]); // log it to the Node.JS output
        io.sockets.emit("set_user_to_client", { user: data["user"] }) // broadcast the message to other users

    });

    socket.on('setCurrentRoom', function (data) {
        console.log("currentRoom: " + data["room"]); // log it to the Node.JS output
        io.sockets.emit("set_room_to_client", { room: data["room"] }) // broadcast the message to other users
    });

    socket.on('createPublicChatRoom', function(data){
        console.log("New room: " + data["room"]);
        io.sockets.emit("new_public_room", {room: data["room"]})
    });



});