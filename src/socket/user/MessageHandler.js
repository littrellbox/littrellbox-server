const mongoose = require('mongoose');
const PlanetMembers = mongoose.model('PlanetMembers');
const Channels = mongoose.model('Channels');
const Messages = mongoose.model('Messages');
const Attachments = mongoose.model('Attachments');

//setup logging
const log4js = require('log4js');
const logger = log4js.getLogger('messages');
logger.level = 'debug';

class MessageHandler {
  constructor(socket, io) {
    this.socket = socket;
    this.io = io;

    this.sendMessage = this.sendMessage.bind(this);
    this.getMessage = this.getMessage.bind(this);
    this.getMessages = this.getMessages.bind(this);
    this.getAttachments = this.getAttachments.bind(this);
  }

  user = null;

  setUserAndStart(user) {
    this.user = user;

    this.socket.on("sendmessage", this.sendMessage);
    this.socket.on("getmessage", this.getMessage);
    this.socket.on("getmessages", this.getMessages);
    this.socket.on("getattachments", this.getAttachments);
    this.socket.emit("acceptingMessages");
  }

  sendMessage(text, channelId, predictionId) {
    Channels.findById(channelId).then((documentChannel) => {
      if(documentChannel) {
        PlanetMembers.findOne({'$and': [{userId: this.user._id}, {planetId: documentChannel.planetId}]}).then((document2) => {
          if(document2) {
            let message = new Messages({
              username: this.user.username, //cache the username to prevent mass lookups
              userId: this.user._id,
              planetId: documentChannel.planetId,
              channelId: documentChannel._id,
              content: text,
            });
            message.save().then(() => {
              logger.debug(this.user._id + " has sent a message: " + text);
              if(predictionId) {
                //tell the client we're done
                this.socket.emit("msgpredictionsuccess", predictionId, message._id);
              }
              this.io.to("channel-in-" + documentChannel._id).emit('updatemessage', message._id, message);
            }).catch((error) => {logger.error(error);});
          }
        }).catch((error) => {logger.error(error);});
      }
    }).catch((error) => {logger.error(error);});
  }

  getMessage(messageId) {
    Messages.findById(messageId).then((documentMessage) => {
      if(documentMessage) {
        PlanetMembers.findOne({'$and': [{userId: this.user._id}, {planetId: documentMessage.planetId}]}).then((document2) => {
          if(document2) {
            this.socket.emit("recvmessage", messageId, message);
          }
        }).catch((error) => {logger.error(error);});
      }
    }).catch((error) => {logger.error(error);});
  }

  getMessages(channelId) {
    Channels.findById(channelId).then((documentChannel) => {
      if(documentChannel) {
        PlanetMembers.findOne({'$and': [{userId: this.user._id}, {planetId: documentChannel.planetId}]}).then((document2) => {
          if(document2) {
            Messages.find({channelId: channelId}).limit(50).sort({"date":-1}).then((messages) => {
              this.socket.emit("recvbatchmessage", messages.reverse());
            }).catch((error) => {logger.error(error);});
          }
        }).catch((error) => {logger.error(error);});
      }
    }).catch((error) => {logger.error(error);});
  }

  getAttachments(messageId) {
    Messages.findById(messageId).then((messageDocument) => {
      if(messageDocument) {
        PlanetMembers.findOne({'$and': [{userId: this.user._id}, {planetId: messageDocument.planetId}]}).then((document2) => {
          if(document2) {
            Attachments.find({messageId: messageId}).then((documents) => {
              for(let i = 0; i < documents.length; i++) {
                this.socket.emit("updateattachment", documents[i]);
              }
            }).catch((error) => {logger.error(error);});
          }
        }).catch((error) => {logger.error(error);});
      }
    }).catch((error) => {logger.error(error);});
  }
}

module.exports = MessageHandler;