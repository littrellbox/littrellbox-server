const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('./auth');
const Users = mongoose.model('Users');
const fs = require('fs');

const log4js = require('log4js');
const logger = log4js.getLogger('auth');
logger.level = 'debug';

let inviteCodes = [];
let usingCodes = false;
if(fs.existsSync('./invitecodes.json')) {
  logger.warn("Using invite codes for registration!");
  logger.warn("Users must have an invite code to register!");
  usingCodes = true;
  let rawdata = fs.readFileSync('./invitecodes.json');
  inviteCodes = JSON.parse(rawdata);
}


router.post('/login', auth.optional, (req, res, next) => {
  const reqUser = req.body;

  if(!reqUser.username) {
    return res.status(400).json({
      errors: {
        username: 'is required',
      },
    });
  }

  if(!reqUser.password) {
    return res.status(400).json({
      errors: {
        password: 'is required',
      },
    });
  }

  Users.findOne({ username: reqUser.username }).then((user) => {
    if(!user || !user.validatePassword(reqUser.password)) {
      return res.status(400).json({
        errors: {
          all: "wrong",
        },
      });
    }

    let userData = user.toAuthJSON();

    const today = new Date();
    const expirationDate = new Date(today);
    expirationDate.setDate(today.getDate() + 60);

    res.cookie('authToken', userData.token, {});
    res.json({ user: userData });
  }).catch((err) => {
    return res.status(500).json({
      errors: {
        ISE: true
      }
    });
  });
});

router.post('/register', auth.optional, (req, res, next) => {
  const user = req.body;

  if(!user.username) {
    console.log("no name");
    return res.status(400).json({
      errors: {
        username: 'is required',
      },
    });
  }

  if(!user.email) {
    console.log("no email");
    return res.status(400).json({
      errors: {
        email: 'is required',
      },
    });
  }

  if(!user.password) {
    console.log("no pass");
    return res.status(400).json({
      errors: {
        password: 'is required',
      },
    });
  }
  
  if(usingCodes && !inviteCodes.includes(req.body.inviteCode)) {
    return res.status(403).json({
      errors: {
        password: ""
      }
    });
  }

  if(usingCodes) {
    delete inviteCodes[inviteCodes.indexOf(req.body.inviteCode)];
    fs.writeFileSync('./invitecodes.json', JSON.stringify(inviteCodes));
  }

  Users.findOne({username: user.username }).then((foundUser) => {
    if(foundUser) {
      return res.status(401).json({
        errors: {
          username: 'is taken'
        }
      });
    } else {
      Users.findOne({email: user.email}).then((foundUser2) => {
        if(foundUser2) {
          return res.status(422).json({
            errors: {
              email: "is taken"
            }
          });
        }
        const finalUser = new Users(user);

        finalUser.setPassword(user.password);

        return finalUser.save()
          .then(() => {
            let userData = finalUser.toAuthJSON();
            res.cookie('authToken', userData.token, {httpOnly: true, maxAge: (new Date().getDate() + 60)});
            res.json({ user: userData });
          });
      });
    }
  });
});

module.exports = router;