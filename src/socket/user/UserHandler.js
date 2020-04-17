const mongoose = require('mongoose');
const Users = mongoose.model('Users');

//setup logging
const log4js = require('log4js');
const logger = log4js.getLogger('user');
logger.level = 'debug';

class UserHandler {
  constructor(socket, io) {
    this.socket = socket;
    this.io = io;

    this.getCurrentUser = this.getCurrentUser.bind(this);
    this.getUser = this.getCurrentUser.bind(this);
    this.subscribeToUser = this.subscribeToUser.bind(this);
    this.unsubscribeFromUser = this.unsubscribeFromUser.bind(this);
    this.unsubscribeFromAllUsers = this.unsubscribeFromAllUsers.bind(this);
  }

  user = null;
  subscribedIds = [];

  setUserAndStart(user) {
    this.user = user;
    
    this.socket.on("getcurrentuser", this.getCurrentUser);
    this.socket.on("getuser", this.getUser);
    this.socket.on("subscribetouser", this.subscribeToUser);
    this.socket.on("unsubscribefromuser", this.unsubscribeFromUser);
    this.socket.on("unsubscribefromallusers", this.unsubscribeFromAllUsers);

    this.socket.emit("acceptingUsers");
  }

  getUser(id) {
    Users.findById(id).then((document) => {
      if(document) {
        delete document.hash;
        delete document.salt;
        this.socket.emit("updateuser", document);
      }
    }).catch((error) => {logger.error(error);});
  }

  getCurrentUser() {
    Users.findById(this.user._id).then((document) => {
      if(document) {
        delete document.hash;
        delete document.salt;
        this.socket.emit("setuser", document);
      }
    }).catch((error) => {logger.error(error);});
  }

  subscribeToUser(id) {
    Users.findById(id).then((document) => {
      if(document) {
        delete document.hash;
        delete document.salt;
        if(!this.subscribedIds.includes(id)) {
          this.socket.join("usersub-" + document._id.toString());
          this.subscribedIds.push(id);
        }
        this.socket.emit("updateuser", document);
      }
    }).catch((error) => {logger.error(error);});
  }

  unsubscribeFromUser(id) {
    if(this.subscribedIds.includes(id)) {
      this.socket.leave("usersub-" + id.toString());
      this.subscribedIds[this.subscribedIds.indexOf(id)].splice(indexOf(id), 1);;
    }
  }

  unsubscribeFromAllUsers() {
    this.subscribedIds.forEach((id) => {
      this.socket.leave("usersub-" + id);
    });
    this.subscribedIds = [];
  }
}

module.exports = UserHandler;