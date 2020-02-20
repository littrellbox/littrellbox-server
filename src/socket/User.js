const mongoose = require('mongoose');
const Users = mongoose.model('Users');
const fs = require('fs')
const ChannelHandler = require('./user/ChannelHandler');
const MessageHandler = require('./user/MessageHandler');
const PlanetHandler = require('./user/PlanetHandler');

class User {
  constructor(socket, io, originalUser) {
    this.socket = socket;
    this.io = io;
    this.decodedToken = originalUser;

    this.ChannelHandler = new ChannelHandler(socket, io);
    this.MessageHandler = new MessageHandler(socket, io);
    this.PlanetHandler = new PlanetHandler(socket, io);
    
    this.getMOTD = this.getMOTD.bind(this);

    this.setupClient();
  }

  user = null;

  setupClient() {
    //get the user and send it to the client
    Users.findById(this.decodedToken.id, (err, document) => {
      if(!document) {
        this.socket.emit("forcefullydeauth");
        return;
      } else {
        this.socket.emit("setuser", document);
        this.ChannelHandler.setUserAndStart(document);
        this.MessageHandler.setUserAndStart(document);
        this.PlanetHandler.setUserAndStart(document);
        this.socket.on("getmotd", this.getMOTD);
      }
    });
  }

  getMOTD() {
    if(fs.existsSync("motd.md")) {
      this.socket.emit("recvmotd", fs.readFileSync("motd.md").toString())
    }
  }

  deleteChildren() {
    delete this.ChannelHandler;
    delete this.MessageHandler;
    delete this.PlanetHandler;
  }
}

module.exports = User;