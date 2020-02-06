const mongoose = require('mongoose');
const Users = mongoose.model('Users');

const ChannelHandler = require('./user/ChannelHandler');
const MessageHandler = require('./user/MessageHandler');
const PlanetHandler = require('./user/PlanetHandler');

class User {
  constructor(socket, originalUser) {
    this.socket = socket;
    this.decodedToken = originalUser;

    this.ChannelHandler = new ChannelHandler(socket);
    this.MessageHandler = new MessageHandler(socket);
    this.PlanetHandler = new PlanetHandler(socket);
    
    this.setupClient();
  }

  user = null;

  setupClient() {
    //get the user and send it to the client
    Users.findById(this.decodedToken.id, (err, document) => {
      this.socket.emit("setuser", document);
      this.ChannelHandler.setUserAndStart(document);
      this.MessageHandler.setUserAndStart(document);
      this.PlanetHandler.setUserAndStart(document);
    });
  }

}

module.exports = User;