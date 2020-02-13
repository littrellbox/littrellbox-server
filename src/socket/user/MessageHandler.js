class MessageHandler {
  constructor(socket, io) {
    this.socket = socket;
    this.io = io;
  }

  user = null;

  setUserAndStart(user) {
    this.user = user;
  }

  sendMessage() {

  }

  getMessage() {

  }

  getMessages() {

  }
  
}

module.exports = MessageHandler;