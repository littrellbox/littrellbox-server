const jwt = require('jsonwebtoken');
const User = require('./User');
const fs = require('fs');

//setup logging
const log4js = require('log4js');
const logger = log4js.getLogger('socket');
logger.level = 'debug';

class SocketServer {
  constructor(socket) {
    this.io = socket;

    this.authenticateUser = this.authenticateUser.bind(this);
    this.disconnectUser = this.disconnectUser.bind(this);
    this.getInfo = this.getInfo.bind(this);
  }

  users = []

  setupSocketServer() {
    this.io.on('connection', function(socket){
      let id = socket.id;
      socket.on('authenticate', (token) => this.authenticateUser(token, socket));
      socket.on('disconnect', () => this.disconnectUser(id));
      socket.on('logout', () => socket.disconnect());
      socket.on('getinfo', () => this.getInfo(socket));
    }.bind(this));
    logger.info("Socket.IO started");
  }

  authenticateUser(token, socket) {
    jwt.verify(token, process.env.JWT_SECRET, function(err, decode) {
      if(err) {
        socket.emit('auth-error');
      }
      if(!decode) {
        return;
      }
      logger.debug("User connected");
      socket.emit('authentication', decode);
      this.users[socket.id] = (new User(socket, this.io, decode));
    }.bind(this));
  }

  getInfo(socket) {
    socket.emit("setinfo", {
      version: global.version,
      serverType: "littrellbox-server",
      inviteCodeReq: fs.existsSync('./invitecodes.json')
    });
  }
  
  disconnectUser(id) {
    if(this.users[id]) {
      this.users[id].setOffline(() => {delete this.users[id];});
    }
  }
}

module.exports = SocketServer;