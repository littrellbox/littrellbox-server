const mongoose = require('mongoose');
const PlanetMembers = mongoose.model('PlanetMembers');
const Planets = mongoose.model('Planets');
const Channels = mongoose.model('Channels');
const Messages = mongoose.model('Messages');

//setup logging
const log4js = require('log4js');
const logger = log4js.getLogger('planet');
logger.level = 'debug';

class MessageHandler {
  constructor(socket, io) {
    this.socket = socket;
    this.io = io;

    this.sendMessage = this.sendMessage.bind(this);
    this.getMessage = this.getMessage.bind(this);
    this.getMessages = this.getMessages.bind(this);
  }

  user = null;

  setUserAndStart(user) {
    this.user = user;

    this.socket.on("sendmessage", this.sendMessage);
    this.socket.on("getmessage", this.getMessage);
    this.socket.on("getmessages", this.getMessages);
  }

  sendMessage(text, channelId) {
    Channels.findById(channelId).then((documentChannel) => {
      if(documentChannel) {
        Planets.findById(documentChannel.planetId).then((document) => {
          if(document) {
            PlanetMembers.findOne({'$and': [{userId: this.user._id}, {planetId: documentChannel.planetId}]}).then((document2) => {
              if(document2) {
                let message = new Messages({
                  username: this.user.username, //cache the username to prevent mass lookups
                  userId: this.user._id,
                  planetId: document._id,
                  channelId: documentChannel._id,
                  content: text
                });
                message.save().then(() => {
                  logger.debug(this.user._id + " has sent a message: " + text);
                  this.io.to("channel-in-" + documentChannel._id).emit('updatemessage', message._id, message);
                });
              }
            });
          }
        });
      }
    });
  }

  getMessage(messageId) {
    Messages.findById(messageId).then((documentMessage) => {
      if(documentMessage) {
        PlanetMembers.findOne({'$and': [{userId: this.user._id}, {planetId: documentMessage.planetId}]}).then((document2) => {
          if(document2) {
            this.socket.emit("recvmessage", messageId, message);
          }
        });
      }
    });
  }

  getMessages(channelId) {
    Channels.findById(channelId).then((documentChannel) => {
      if(documentChannel) {
        Planets.findById(documentChannel.planetId).then((document) => {
          if(document) {
            PlanetMembers.findOne({'$and': [{userId: this.user._id}, {planetId: documentChannel.planetId}]}).then((document2) => {
              if(document2) {
                Messages.find({channelId: channelId}).limit(50).sort({"date":-1}).then((messages) => {
                  this.socket.emit("recvbatchmessage", messages.reverse());
                });
              }
            });
          }
        });
      }
    });
  }

}

module.exports = MessageHandler;