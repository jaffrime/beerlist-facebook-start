var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var User = require("../models/UserModel");
var jwt = require('jsonwebtoken');
var expressJWT = require('express-jwt');
var ensureAuthenticated = expressJWT({ secret: 'thisIsTopSecret' });

//passport configuration here
passport.use(new FacebookStrategy({
    clientID: "405779553126589",
    clientSecret: "73477bdb74dbbfe2dd112c864cd4a55f",
    callbackURL: "http://localhost:8000/auth/facebook/callback",
    profileFields: ['displayName', 'email']
  },
  function(accessToken, refreshToken, profile, done) {
    // User.findOrCreate({ facebookId: profile.id }, function (err, user) {
    //   return cb(err, user);
    // });

//NOTE: Why is this different from the user docs?
    //code to check database goes here
    User.findOne({ 'socialId': profile.id }, function(err, user) {
          if (err) {
            return done(err);
          }
          //If no user was found, create a new user with details from the facebook profile
          if (!user) {
            user = new User({
              socialId: profile.id,
              name: profile.displayName,
              email: profile.emails ? profile.emails[0].value : "",
              provider: 'facebook',
              loginCount: 0
            });
          } else {
            //else, a user exists so let's add one to their login count
            user.loginCount++;
          }
          //finally let's save and call "done"
          user.save(function(err, newUser) {
            if (err) {
              return done(err);
            } else {
              //code to create JWT goes here
              var token = jwt.sign({
                id: newUser.id,
                name: newUser.name,
              }, 'thisIsTopSecret', { expiresIn: "7d" });

              return done(null, { token: token, name: newUser.name} );
            }
          });
        });
  }
));

module.exports = passport;
