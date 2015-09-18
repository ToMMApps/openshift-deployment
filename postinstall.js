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
    console.log("SSH-Key does already exist");
}, function(){
    var sshKeygen = spawn('ssh-keygen', [
        '-t','rsa',
        '-C', config.key.comment,
        '-f', location
    ]);

    sshKeygen.stdout.on('data', function(data){
        console.log(data.toString());
    });

    sshKeygen.stderr.on('data', function(data){
        console.error(data.toString());
    });
});
