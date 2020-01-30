const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('./auth');
const Users = mongoose.model('Users');

router.post('/login', auth.optional, (req, res, next) => {
  const reqUser = req.body;

  console.log("A")

  if(!reqUser.username) {
    console.log("B1")
    return res.status(400).json({
      errors: {
        username: 'is required',
      },
    });
  }

  if(!reqUser.password) {
    console.log("B2")
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

    return res.json({user: user.toAuthJSON()});
  }).catch((err) => {
    return res.status(500).json({
      errors: {
        ISE: true
      }
    })
  })
});

router.post('/register', auth.optional, (req, res, next) => {
  const user = req.body;

  if(!user.username) {
    return res.status(422).json({
      errors: {
        username: 'is required',
      },
    });
  }

  if(!user.email) {
    return res.status(422).json({
      errors: {
        email: 'is required',
      },
    });
  }

  if(!user.password) {
    return res.status(422).json({
      errors: {
        password: 'is required',
      },
    });
  }

  const finalUser = new Users(user);

  finalUser.setPassword(user.password);

  return finalUser.save()
    .then(() => res.json({ user: finalUser.toAuthJSON() }));
});

module.exports = router;