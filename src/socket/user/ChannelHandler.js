const mongoose = require('mongoose');
const Planets = mongoose.model('Planets');
const PlanetMembers = mongoose.model('PlanetMembers');
const Channels = mongoose.model('Channels');

class ChannelHandler {
  constructor(socket, io) {
    this.socket = socket;
    this.io = io;

    this.createChannel = this.createChannel.bind(this);
    this.getChannel = this.getChannel.bind(this);
    this.getAllChannels = this.getAllChannels.bind(this);
  }

  user = null;

  setUserAndStart(user) {
    this.user = user;
    this.socket.on("createchannel", this.createChannel);
    this.socket.on("getchannel", this.getChannel);
    this.socket.on("getallchannels", this.getAllChannels);
  }

  createChannel(name, planetId) {
    Planets.findById(planetId).then((document) => {
      if(document && (document.userId === this.user._id.toString())) {
        let channel = new Channels({
          name,
          planetId,
          userId: this.user._id
        });
        channel.save().then(() => {
          this.io.to('planet-in-' + planetId).emit("updatechannel", channel._id, channel);
        });
      }
    });
  }
  
  getAllChannels(planetId) {
    Planets.findById(planetId).then((document) => {
      if(document) {
        PlanetMembers.findOne({'$and': [{userId: this.user._id}, {planetId: planetId}]}).then((document2) => {
          if(document2) {
            Channels.find({planetId: planetId}).then((channelDocuments) => {
              for(const channel of channelDocuments) {
                this.socket.emit("updatechannel", channel._id, channel);
              }
            });
          }
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