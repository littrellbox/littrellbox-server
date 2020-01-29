//import libraries
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const redisAdapter = require('socket.io-redis');

//setup logging
const log4js = require('log4js');
const logger = log4js.getLogger('chat');
logger.level = 'debug';

//import server modules
const socketServer = require('./socket/SocketServer');
const webServer = require('./web/WebServer')

class ChatServer {
    //TODO: Load from ENV variables
    port = 3001;
    mongoURL = "mongodb://localhost:27017/littrellbox";
    redisHost = null;
    redisPort = 6379;
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
        logger.info("Starting chat server")
        this.app = express();
        this.http = http.createServer(this.app);
        this.io = require('socket.io')(this.http);
        
        if(this.redisHost) {
            io.adapter(redisAdapter({ host: this.redisHost, port: this.redisPort }));
        } else {
            logger.warn("Not using Redis!");
            logger.warn("This server will not sync with any other servers!")
        }

        logger.info("Connecting to database...")
        mongoose.connect(this.mongoURL, this.mongooseOptions).then(() => {
            logger.info("Connected to database");
            this.webServer = new webServer(this.app);
            this.webServer.setupWebServer();
            this.socketServer = new socketServer(this.io);
            this.socketServer.setupSocketServer();

            this.http.listen(this.port, this.httpServerStarted);
        }).catch((e) => {
            logger.fatal("Connecting to database failed, exiting...");
            logger.debug(e)
            process.exit();
        })
    }

    httpServerStarted() {
        logger.info("Listing on port " + this.port);
    }
}

module.exports = ChatServer;