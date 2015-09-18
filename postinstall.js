var fs = require('fs');
var config = require('./config');
var path = require('path');
var Q = require('q');
var location = path.join(__dirname, config.key.filename);
var stat = Q.nfbind(fs.stat);
var writeFile = Q.nfbind(fs.writeFile);
var keypair = require('keypair');

Q.all([
    stat(location),
    stat(location + ".pub")
])
.then(function(){
    return Q("SSH-Key does already exist");
}, function(){
        var pair = keypair();

        var publicKey = "ssh-rsa" + " " + pair.public.split("\n")[1] + " " + config.key.comment;

        return Q([
            writeFile(location, pair.private),
            writeFile(location + ".pub", publicKey)
        ]).then(function () {
            return Q("Successfully generated SSH-Key");
        }, function () {
            return Q.reject("Failed to generate SSH-Key");
        })
}).then(console.log, console.error);
