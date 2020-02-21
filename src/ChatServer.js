//import libraries
const express = require('express');
const http = require('http');
const https = require('https');
const mongoose = require('mongoose');
const redisAdapter = require('socket.io-redis');
const fs = require('fs');

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

const Users = mongoose.model("Users")

class ChatServer {
    //TODO: Load from ENV variables
    mongooseOptions = {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        useFindAndModify: false,
        authSource: process.env.MONGO_AUTH_SOURCE,
        user: process.env.MONGO_USER,
        pass: process.env.MONGO_PASS
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
        if(process.env.HTTPS_CERT) {
            this.http = https.createServer({
                key: fs.readFileSync(process.env.HTTPS_KEY, 'utf8'),
                cert: fs.readFileSync(process.env.HTTPS_CERT, 'utf8'),
                ca: fs.readFileSync(process.env.HTTPS_CA, 'utf8')
            }, this.app);
        } else {
            this.http = http.createServer(this.app);
        }

        this.io = require('socket.io')(this.http);
        
        if(process.env.REDIS_HOST) {
            io.adapter(redisAdapter({ host: process.env.REDIS_HOST, port: process.env.REDIS_PORT }));
        } else {
            logger.warn("Not using Redis!");
            logger.warn("This server will not sync with any other servers!");
        }

        logger.info("Connecting to database...");
        mongoose.set('useCreateIndex', true);
        mongoose.connect(process.env.MONGO_URL, this.mongooseOptions).then(() => {
            logger.info("Connected to database");
            this.webServer = new webServer(this.app);
            this.webServer.setupWebServer();
            //The following code is a Bad Idea and should be changed at some point.
            //Make sure the sessionCount for all users is 0
            logger.info("Validating user records... (this could take a long time)");
            Users.updateMany({}, {sessionCount: 0}).then(() => {
                this.socketServer = new socketServer(this.io);
                this.socketServer.setupSocketServer();
            
                this.http.listen(parseInt(process.env.PORT), this.httpServerStarted);
            });
            
        }).catch((e) => {
            logger.fatal("A fatal error occured, exiting...");
            logger.debug(e);
            process.exit();
        });
    }

    httpServerStarted() {
        logger.info("Listing on port " + process.env.PORT);
    }
}

module.exports = ChatServer;