// Require the packages we will use:
const http = require("http"),
    fs = require("fs");

const port = 3456;
const file = "client.html";

const chatrooms = {
    room1: [],
    room2: [],
  };
  
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
const io = socketio.listen(server);
io.sockets.on("connection", function (socket) {
    // This callback runs when a new Socket.IO connection is established.

    socket.on('message_to_server', function (data) {
        // This callback runs when the server receives a new message from the client.
        console.log("message: " + data["message"] + "chatroom #" + data["currentChatRoom"]); // log it to the Node.JS output
        io.sockets.emit("message_to_client", { message: data["message"], user: data["user"]}) // broadcast the message to other users
    });


    socket.on('newChatroom', function (data) {
        console.log("room: " + data["newRoom"] + "user: "+ data['user']); // log it to the Node.JS output
        io.sockets.emit("newChatroom", { newRoom: data["newRoom"] }) // broadcast the message to other users
    });

    socket.on('nickName', function (data) {
        console.log("User NickName " + data["nickNames"]); // log it to the Node.JS output
        io.sockets.emit("user_to_client", { nickNames: data["nickNames"] }) // broadcast the message to other users
    });
    socket.on('currentChatRoom', function (data) {
        console.log(data["currentChatRoom"]); // log it to the Node.JS output
        io.sockets.emit("user_to_client", { nickNames: data["nickNames"], currentChatRoom: data['currentChatRoom'] }) // broadcast the message to other users
    });

    


});
