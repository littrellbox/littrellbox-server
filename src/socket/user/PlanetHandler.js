const mongoose = require('mongoose');
const PlanetMembers = mongoose.model('PlanetMembers');
const Planets = mongoose.model('Planets');

class PlanetHandler {
  constructor(socket) {
    this.socket = socket;

    this.createPlanet = this.createPlanet.bind(this);
    this.joinPlanet = this.joinPlanet.bind(this);
    this.getAllPlanets = this.getAllPlanets.bind(this);
    this.getPlanet = this.getPlanet.bind(this);
  }

  user = null;

  setUser(user) {
    this.user = user;
  }

  setUserAndStart(user) {
    this.user = user;

    this.socket.on("createplanet", this.createPlanet);
    this.socket.on("joinplanet", this.joinPlanet);
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
      if(document.invites.includes(inviteId)) {
        let member = new PlanetMembers({
          userId: this.user._id,
          planetId: planet._id
        });
        member.save();
        this.socket.emit('updateplanet', planet._id, planet);
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
        this.socket.emit('updateplanet', document._id, document);
      }
    });
  }
}

module.exports = PlanetHandler;