const mongoose = require('mongoose');
const PlanetMembers = mongoose.model('PlanetMembers');
const Planets = mongoose.model('Planets');

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
      member.save();
      this.socket.emit('updateplanet', planet._id, planet);
    });
  }

  joinPlanet(planetId, inviteId) {
    Planets.findById(planetId, (err, document) => {
      let member = PlanetMembers.findOne({'$and': [{userId: this.user._id}, {planetId: planetId}]});
      if(document.invites.includes(inviteId) && !member) {
        let member = new PlanetMembers({
          userId: this.user._id,
          planetId: planet._id
        });
        member.save();
        this.socket.emit('updateplanet', planet._id, planet);
      }
    });
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
        });
      }
    });
  }

  getPlanet(planetId) {
    Planets.findById(planetId, (err, document) => {
      this.socket.emit('updateplanet', planet._id, document);
    });
  }

  getAllPlanets() {
    PlanetMembers.find({userId: this.user._id}, (err, documents) => {
      for(const document of documents) {
        Planets.findById(document.planetId, (err, document2) => {
          if(document2) {
            this.socket.join(document.planetId.toString());
            this.socket.emit('updateplanet', document2._id, document2);
          }
        });
      }
    });
  }
}

module.exports = PlanetHandler;