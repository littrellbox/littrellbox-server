const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('./auth');
const Users = mongoose.model('Users');

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
    res.cookie('authToken', userData.token, {httpOnly: true, maxAge: (new Date().getDate() + 60)});
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
    return res.status(400).json({
      errors: {
        username: 'is required',
      },
    });
  }

  if(!user.email) {
    return res.status(400).json({
      errors: {
        email: 'is required',
      },
    });
  }

  if(!user.password) {
    return res.status(400).json({
      errors: {
        password: 'is required',
      },
    });
  }

  Users.findOne({username: user.username}).then((foundUser) => {
    if(foundUser) {
      return res.status(400).json({
        errors: {
          username: 'is taken'
        }
      });
    } else {
      const finalUser = new Users(user);

      finalUser.setPassword(user.password);

      return finalUser.save()
        .then(() => {
          let userData = finalUser.toAuthJSON();
          res.cookie('authToken', userData.token, {httpOnly: true, maxAge: (new Date().getDate() + 60)});
          res.json({ user: userData });
        });
    }
  });
});

module.exports = router;