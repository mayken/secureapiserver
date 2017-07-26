var config = require('config.json');
var _ = require('lodash');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var Q = require('q');
var hat = require('hat');
var mongo = require('mongoskin');
var db = mongo.db(config.connectionString, {
    native_parser: true
});
db.bind('users');

var service = {};

service.authenticate = authenticate;
service.getAll = getAll;
service.getById = getById;
service.create = create;
service.update = update;
service.delete = _delete;
service.setApiKey = setApiKey;

module.exports = service;

function authenticate(username, password) {
    var deferred = Q.defer();

    db.users.findOne({
        username: username
    }, function (err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (user && bcrypt.compareSync(password, user.hash)) {
            // authentication successful
            deferred.resolve({
                _id: user._id,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                eMail: user.eMail,
                userRole: user.userRole,
                apiKey: user.apiKey,
                token: jwt.sign({
                    sub: user._id
                }, config.secret)
            });
        } else {
            // authentication failed
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function getAll() {
    var deferred = Q.defer();

    db.users.find().toArray(function (err, users) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        // return users (without hashed passwords)
        users = _.map(users, function (user) {
            return _.omit(user, 'hash');
        });

        deferred.resolve(users);
    });

    return deferred.promise;
}

function getById(_id) {
    var deferred = Q.defer();

    db.users.findById(_id, function (err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (user) {
            // return user (without hashed password)
            deferred.resolve(_.omit(user, 'hash'));
        } else {
            // user not found
            deferred.resolve();
        }
    });

    return deferred.promise;
}

function create(userParam) {
    var deferred = Q.defer();

    var usernameValid = false;
    var emailValid = false;

    // validation
    db.users.findOne({
            username: userParam.username
        },
        function (err, user) {
            if (err) deferred.reject(err.name + ': ' + err.message);

            if (user) {
                // username already exists
                deferred.reject('Username "' + userParam.username + '" is already taken');
            } else {
                usernameValid = true;
            }
        });

    db.users.findOne({
            eMail: userParam.eMail
        },
        function (err, user) {
            if (err) deferred.reject(err.name + ': ' + err.message);

            if (user) {
                // eMail already exists
                deferred.reject('eMail "' + userParam.username + '" is already taken');
            } else {
                emailValid = true;
            }


            if (emailValid && usernameValid) {
                createUser();
            }
        });


    function createUser() {
        // set user object to userParam without the cleartext password
        var user = _.omit(userParam, 'password');

        // add hashed password to user object
        user.hash = bcrypt.hashSync(userParam.password, 10);
        user.userRole = "regular";

        db.users.insert(
            user,
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);

                deferred.resolve();
            });
    }

    return deferred.promise;
}

function update(_id, userParam) {
    var deferred = Q.defer();

    // validation
    db.users.findById(_id, function (err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        if (user.username !== userParam.username) {
            // username has changed so check if the new username is already taken
            db.users.findOne({
                    username: userParam.username
                },
                function (err, user) {
                    if (err) deferred.reject(err.name + ': ' + err.message);

                    if (user) {
                        // username already exists
                        deferred.reject('Username "' + req.body.username + '" is already taken')
                    } else {
                        updateUser();
                    }
                });
        } else {
            updateUser();
        }
    });

    function updateUser() {
        // fields to update
        var set = {
            firstName: userParam.firstName,
            lastName: userParam.lastName,
            username: userParam.username,
        };

        // update password if it was entered
        if (userParam.password) {
            set.hash = bcrypt.hashSync(userParam.password, 10);
        }

        db.users.update({
                _id: mongo.helper.toObjectID(_id)
            }, {
                $set: set
            },
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);

                deferred.resolve();
            });
    }

    return deferred.promise;
}

function setApiKey(user) {
    var deferred = Q.defer();
    var uid = hat();
    // validation
    db.users.findById(user._id, function (err, user) {
        if (err) deferred.reject(err.name + ': ' + err.message);

        user.apiKey = uid;

        updateUser();
    });


    function updateUser() {
        // fields to update
        var set = {
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            eMail: user.eMail,
            apiKey: user.apiKey,
            userRole: user.userRole
        };

        // update password if it was entered
        if (user.password) {
            set.hash = bcrypt.hashSync(user.password, 10);
        }

        db.users.update({
                _id: mongo.helper.toObjectID(user._id)
            }, {
                $set: set
            },
            function (err, doc) {
                if (err) deferred.reject(err.name + ': ' + err.message);

                deferred.resolve();
            });
    }
    return deferred.promise;
}

function _delete(_id) {
    var deferred = Q.defer();

    db.users.remove({
            _id: mongo.helper.toObjectID(_id)
        },
        function (err) {
            if (err) deferred.reject(err.name + ': ' + err.message);

            deferred.resolve();
        });

    return deferred.promise;
}
