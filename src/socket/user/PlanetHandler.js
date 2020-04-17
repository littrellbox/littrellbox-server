const mongoose = require('mongoose');
const PlanetMembers = mongoose.model('PlanetMembers');
const Planets = mongoose.model('Planets');
const uuidv4 = require('uuid/v4');

//setup logging
const log4js = require('log4js');
const logger = log4js.getLogger('planet');
logger.level = 'debug';

class PlanetHandler {
  constructor(socket,io) {
    this.socket = socket;
    this.io = io;

    this.createPlanet = this.createPlanet.bind(this);
    this.joinPlanet = this.joinPlanet.bind(this);
    this.openPlanet = this.openPlanet.bind(this);
    this.getAllPlanets = this.getAllPlanets.bind(this);
    this.getPlanet = this.getPlanet.bind(this);
    this.getInvitePlanet = this.getInvitePlanet.bind(this);
    this.getInvite = this.getInvite.bind(this);
  }

  user = null;
  currentPlanet = null;

  setUser(user) {
    this.user = user;
  }

  setUserAndStart(user) {
    this.user = user;

    this.socket.on("createplanet", this.createPlanet);
    this.socket.on("joinplanet", this.joinPlanet);
    this.socket.on("openplanet", this.openPlanet);
    this.socket.on("getplanet", this.getPlanet);
    this.socket.on("getallplanets", this.getAllPlanets);
    this.socket.on("getinviteplanet", this.getInvitePlanet);
    this.socket.on("getinvite", this.getInvite);
    this.socket.emit("acceptingPlanets");
  }

  createPlanet(planetName) {
    let planet = new Planets({
      name: planetName,
      userId: this.user._id,
      invites: []
    });
    planet.save().then(() => {
      let member = new PlanetMembers({
        userId: this.user._id,
        planetId: planet._id
      });
      member.save().catch((error) => {logger.error(error);});
      this.socket.emit('updateplanet', planet._id, planet);
      this.socket.join("planet-in-" + planet._id.toString());
      this.socket.emit("setplanet", planet);
    }).catch((error) => {logger.error(error);});
  }

  joinPlanet(planetId, inviteId) {
    Planets.findById(planetId, (err, document) => {
      PlanetMembers.findOne({'$and': [{userId: this.user._id}, {planetId: planetId}]}).then((member) => {
        if(document.invites.includes(inviteId) && !member) {
          let member = new PlanetMembers({
            userId: this.user._id,
            planetId: document._id
          });
          member.save().catch((error) => {logger.error(error);});
          this.socket.emit('updateplanet', document._id, document);
          this.socket.join("planet-in-" + planetId.toString());
          this.socket.emit("setplanet", document);
        }
      }).catch((error) => {logger.error(error);});
    }).catch((error) => {logger.error(error);});
  }

  openPlanet(planetId) {
    Planets.findById(planetId).then((document) => {
      if(document) {
        PlanetMembers.findOne({'$and': [{userId: this.user._id}, {planetId: planetId}]}).then((document2) => {
          if(document2) {
            if(this.currentPlanet !== null) {
              this.socket.leave("planet-in-" + this.currentPlanet);
            }
            this.currentPlanet = planetId;
            logger.debug(this.user.username + " joined " + planetId);
            this.socket.join("planet-in-" + planetId.toString());
            this.socket.emit("setplanet", document);
          }
        }).catch((error) => {logger.error(error);});
      }
    }).catch((error) => {logger.error(error);});
  }

  getPlanet(planetId) {
    Planets.findById(planetId, (err, document) => {
      this.socket.emit('updateplanet', planet._id, document);
    }).catch((error) => {logger.error(error);});
  }

  getAllPlanets() {
    PlanetMembers.find({userId: this.user._id}, (err, documents) => {
      for(const document of documents) {
        Planets.findById(document.planetId, (err, document2) => {
          if(document2) {
            this.socket.join(document.planetId.toString());
            this.socket.emit('updateplanet', document2._id, document2);
          }
        }).catch((error) => {logger.error(error);});
      }
    }).catch((error) => {logger.error(error);});
  }

  getInvite(planetId) {
    Planets.findById(planetId).then((document) => {
      if(document && document.invites.length === 0 && document.userId === this.user._id.toString()) {
        document.invites.push(uuidv4());
        document.save().catch((error) => {logger.error(error);});
        logger.debug("Sending " + document._id + " invite to " + this.user._id);
        this.socket.emit("recvinvite", document.invites[0]);
      } else if(document && document.userId === this.user._id.toString()) {
        logger.debug("Sending " + document._id + " invite to " + this.user._id);
        this.socket.emit("recvinvite", document.invites[0]);
      }
    }).catch((error) => {logger.error(error);});
  }
  
  getInvitePlanet(inviteId) {
    Planets.find({ invites: inviteId }).then((document) => {
      this.socket.emit("setinviteplanet", document);
    }).catch((error) => {logger.error(error);});
  }
}

module.exports = PlanetHandler;