//import libraries
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const redisAdapter = require('socket.io-redis');

//setup logging
const log4js = require('log4js');
const logger = log4js.getLogger('chat');
logger.level = 'debug';

//import db models
//we don't use these right now but they all need to be loaded at startup
require('./models/Users');
require('./models/Planets');
require('./models/PlanetMembers');
require('./models/Messages');
require('./models/Channels');

//import server modules
const socketServer = require('./socket/SocketServer');
const webServer = require('./web/WebServer');

class ChatServer {
    //TODO: Load from ENV variables
    mongooseOptions = {
        useUnifiedTopology: true,
        useNewUrlParser: true
    }

    app = null;
    http = null;
    io = null;

    socketServer = null;
    webServer = null;

    constructor() {
        this.httpServerStarted = this.httpServerStarted.bind(this);
    }

    startServer() {
        logger.info("Starting chat server");
        this.app = express();
        this.http = http.createServer(this.app);
        this.io = require('socket.io')(this.http);
        
        if(process.env.REDIS_HOST) {
            io.adapter(redisAdapter({ host: process.env.REDIS_HOST, port: process.env.REDIS_PORT }));
        } else {
            logger.warn("Not using Redis!");
            logger.warn("This server will not sync with any other servers!");
        }

        logger.info("Connecting to database...");
        mongoose.connect(process.env.MONGO_URL, this.mongooseOptions).then(() => {
            logger.info("Connected to database");
            this.webServer = new webServer(this.app);
            this.webServer.setupWebServer();
            this.socketServer = new socketServer(this.io);
            this.socketServer.setupSocketServer();
            
            this.http.listen(parseInt(process.env.PORT), this.httpServerStarted);
        }).catch((e) => {
            logger.fatal("Connecting to database failed, exiting...");
            logger.debug(e);
            process.exit();
        });
    }

    httpServerStarted() {
        logger.info("Listing on port " + process.env.PORT);
    }
}

module.exports = ChatServer;