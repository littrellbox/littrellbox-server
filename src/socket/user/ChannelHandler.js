const mongoose = require('mongoose');
const Planets = mongoose.model('Planets');
const Channels = mongoose.model('Channels');

class ChannelHandler {
  constructor(socket, io) {
    this.socket = socket;
    this.io = io;
  }

  user = null;

  setUserAndStart(user) {
    this.user = user;
    this.socket.on("createchannel", this.createChannel);
    this.socket.on("getchannel", this.getChannel);
  }

  createChannel(name, planetId) {
    Planets.findById(planetId).then((document) => {
      if(document && document.userId === this.user._id) {
        let channel = new Channels({
          name,
          planetId,
          userId: this.user._id
        });

        channel.save().then(() => {
          this.io.to('planet-in-' + planetId).emit("updatechannel", channelId, channel);
        });
      }
    });
  }
  
  getChannel(channelId) {
    Channels.findById(channelId).then((document) => {
      this.socket.emit("updatechannel", channelId, document);
    });
  }
}

module.exports = ChannelHandler;