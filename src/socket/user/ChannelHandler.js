class ChannelHandler {
  constructor(socket) {
    this.socket = socket;
  }

  user = null;

  setUserAndStart(user) {
    this.user = user;
  }
}

module.exports = ChannelHandler;