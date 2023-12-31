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
//var blackList = {};
var connectedUsers = {};
var bannedUsers = {};


// Attach our Socket.IO server to our HTTP server to listen
const io = socketio.listen(server);
io.sockets.on("connection", function (socket) {
    // This callback runs when a new Socket.IO connection is established.




    socket.on('username_to_server', function (data) {
      //here
      user = data['user'];
      connectedUsers[data.user] = socket.id;
      if (!allUsers.includes(user)){
        allUsers.push(user);

        var recipientSocketId = connectedUsers[data['user']];

        io.to(recipientSocketId).emit('successfulLogin', {user:user})

      }
      else{
        var recipientSocketId = connectedUsers[data['user']];

        io.to(recipientSocketId).emit('loginError', {user:user})      }

    });


    socket.on('message_to_server', function (data) {
        // This callback runs when the server receives a new message from the client.
        if (data['message'].includes(":)")){
          data['message'] = data['message'].replace(":)", "&#128512");
        }
         if(data['message'].includes(":(")){
          data['message'] = data['message'].replace(":(", "&#128577");

        }
         if(data['message'].includes(":/")){
          data['message'] = data['message'].replace(":/", "&#128533");

        }
         if(data['message'].includes(":|")){
          data['message'] = data['message'].replace(":|", "&#128529");

        }
         if(data['message'].includes(":X")){
          data['message'] = data['message'].replace(":X", "&#10060");

        }

        if(data['message'].includes(":?")){
          data['message'] = data['message'].replace(":?", "&#10067");

        }
        if(data['message'].includes(":pointer")){
          data['message'] = data['message'].replace(":pointer", "&#128070");

        }

        
 
 
        io.to(data['room']).emit('message_to_client', {message: data['message'], user: data['user'], room: data['room']})
        
    });

    
    socket.on('create_room', function (data) {
      var user = data['userName'];
      var password =  data['chatroomPassword'];
      var roomName = data['nameOfRoom'];
      usersToRooms[roomName] = {
        password: password,
        user: [user],
        bannedUsers: ""
      };

      if (!allRooms.includes(roomName)){
          allRooms.push(roomName);

      }
      else{
        var recipientSocketId = connectedUsers[user];
        io.to(recipientSocketId).emit("roomNameError", { message: "Roomname Taken" })
      }
  });

  socket.on('get_rooms_from_server', function (data) {
    var user = data['user'];
    var socketID = connectedUsers[user];

    // io.sockets.emit("give_rooms_to_client", { allRooms: allRooms, usersToRooms: usersToRooms }) // send all rooms to client side
    io.to(socketID).emit("give_rooms_to_client", { allRooms: allRooms, usersToRooms: usersToRooms})

});

socket.on('privateMessage', function(data){
  var userTo = data['userTo'];
  var recipientSocketId = connectedUsers[userTo];
  console.log("private: " + JSON.stringify(data));
  io.to(recipientSocketId).emit('message_to_user', {message: data['message'], user: data['user']})
});

socket.on('user_leave', function (data) {
  console.log("in hereeeeee");
  let user = data['user'];
  let room = data['roomToLeave'];
  var recipientSocketId = connectedUsers[user];
  socket.leave(room);
  io.to(recipientSocketId).emit('userLeftRoom', { user: user, room: room})
  io.to(room).emit('give_rooms_to_client', {allRooms: allRooms, usersToRooms: usersToRooms})
  io.to(room).emit('announceLeave', {room: room, user: user})

});


socket.on('ban_user', function (data) {
  let user = data['user'];
  let room = data['room'];
  usersToRooms[room] = {
    bannedUsers: [user]
  };
  var socketID = connectedUsers[user];
  io.to(socketID).emit('hideBan', {user:user, room:room})

});

socket.on('userIsTyping', function (data) {
  var room = data['room'];
  var user = data['user'];
  io.to(room).emit('isTyping', { user: data['user']})
});


socket.on("kick_user", function(data){
  const room = data['room'];
  const user = data['user'];
  var socketID = connectedUsers[user];

  socket.leave(socketID)

  socket.emit("kicked_user");
  io.to(socketID).emit('kickIndividualUser', { msg: 'kicked', room:room})

});  

socket.on('joinRoom', function (data) {

  let roomName = data['roomName'];
  let user = data['user'];
  let password = data['password'];
  var recipientSocketId = connectedUsers[user];
  if(usersToRooms[roomName].bannedUsers == user){
    io.to(roomName).emit("userBannedFailure", { message: "This user is banned"}); 

  }
  else if (usersToRooms[roomName].password == ""){
    usersToRooms[roomName].user.push(user);
    socket.join(roomName);
    io.to(recipientSocketId).emit("userJoinedRoom", { user: user, room:roomName }); 
    io.to(roomName).emit("updateUsersFinal", {user:user}); 

  }
  else if(password == usersToRooms[roomName].password){
    usersToRooms[roomName].user.push(user);
    socket.join(roomName);
    io.to(recipientSocketId).emit("userJoinedRoom", { user: user, room:roomName }); 
    io.to(roomName).emit("updateUsersFinal", {user:user});     
  } else {
    io.to(recipientSocketId).emit("wrongPassword", { user: user, room:roomName }); 

  }
});
});