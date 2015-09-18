var fs = require('fs');
var config = require('./config');
var path = require('path');
var child_process = require('child_process');
var Q = require('q');
var spawn = child_process.spawn;
var location = path.join(__dirname, config.key.filename);
var readFile = Q.nfbind(fs.readFile);
var stat = Q.nfbind(fs.stat);

Q.all([
    stat(location),
    stat(location + ".pub")
])
.then(function(){
    return Q("");
}, function(){
    var deferred = Q.defer();

    var sshKeygen = spawn('ssh-keygen', [
        '-t','rsa',
        '-C', config.key.comment,
        '-f', location
    ]);

    var message = "\n";

    sshKeygen.stdout.on('data', function(data){
        message += data.toString();
    });

    sshKeygen.stderr.on('data', function(data){
        message += data.toString();
    });

    sshKeygen.on('close', function(code){
        if(code !== 0){
            deferred.reject(new Error(message));
        } else {
            deferred.resolve(message);
        }
    });

    return deferred.promise;
})
.then(console.log, console.error);
