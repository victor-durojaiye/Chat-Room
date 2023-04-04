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

var allUsers = [];
var allRooms = [];
var usersToRooms = {};


// Attach our Socket.IO server to our HTTP server to listen
const io = socketio.listen(server);
io.sockets.on("connection", function (socket) {
    // This callback runs when a new Socket.IO connection is established.




    socket.on('username_to_server', function (data) {
      user = data['user'];
      if (!allUsers.includes(user)){
        allUsers.push(user);
        io.sockets.emit("successfulLogin", { user: user })

      }
      else{
        io.sockets.emit("loginError", { message: "Username Taken" }) // broadcast the login error
      }

    });


    socket.on('message_to_server', function (data) {
        // This callback runs when the server receives a new message from the client.
        io.to(data['room']).emit('message_to_client', {message: data['message'], user: data['user'], room: data['room']})
        // io.sockets.emit("message_to_client", { message: data["message"], user:data['user'], room: data['room']}) // broadcast the message to other users
    });

    
    socket.on('create_room', function (data) {
      var user = data['userName'];
      var password =  data['chatroomPassword'];
      var roomName = data['nameOfRoom'];
      usersToRooms[roomName] = {
        password: password,
        user: [user]
      };

      if (!allRooms.includes(roomName)){
          allRooms.push(roomName);

      }
      else{
        io.sockets.emit("roomNameError", { message: "Roomname Taken" }) // broadcast the login error

      }
  });

  socket.on('get_rooms_from_server', function (data) {
    io.sockets.emit("give_rooms_to_client", { allRooms: allRooms, usersToRooms: usersToRooms }) // send all rooms to client side
});


socket.on('joinRoom', function (data) {

  let roomName = data['roomName'];
  let user = data['user'];
  let password = data['password'];


  if (usersToRooms[roomName].password == ""){
    usersToRooms[roomName].user.push(user);
    socket.join(roomName);
    io.to(roomName).emit("userJoinedRoom", { user: user, room:roomName }); 
    console.log(usersToRooms);
  }

  else if(password == usersToRooms[roomName].password){

    usersToRooms[roomName].user.push(user);
    socket.join(roomName);
    io.to(roomName).emit("userJoinedRoom", { user: user, room:roomName }); 
    console.log(usersToRooms);
    
  } else {
    // handle incorrect password
  }
});
});