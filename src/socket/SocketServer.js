const jwt = require('jsonwebtoken');
const User = require('./User');

//setup logging
const log4js = require('log4js');
const logger = log4js.getLogger('socket');
logger.level = 'debug';

class SocketServer {
  constructor(socket) {
    this.io = socket;

    this.authenticateUser = this.authenticateUser.bind(this);
    this.disconnectUser = this.disconnectUser.bind(this);
  }

  users = []

  setupSocketServer() {
    this.io.on('connection', function(socket){
      socket.on('authenticate', (token) => this.authenticateUser(token, socket));
      socket.on('disconnect', () => this.disconnectUser(socket));
      socket.on('logout', () => this.disconnectUser(socket));
    }.bind(this));
    logger.info("Socket.IO started");
  }

  authenticateUser(token, socket) {
    jwt.verify(token, process.env.JWT_SECRET, function(err, decode) {
      if(err) {
        socket.emit('auth-error');
      }
      logger.debug("User connected");
      socket.emit('authentication', decode);
      this.users[socket.id] = (new User(socket, decode));
    }.bind(this));
  }

  disconnectUser(socket) {
    //delete the User object
    this.users[socket.id] = null;
  }
}

module.exports = SocketServer;