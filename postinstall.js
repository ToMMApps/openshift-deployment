var child_process = require('child_process');
var config = require('./config');
var path = require('path');

var keygen = child_process.spawn('ssh-keygen', [
    '-t','rsa',
    '-b','2048',
    '-C', config.key.comment,
    '-N', config.key.password,
    '-f', path.join(__dirname, config.key.filename)
]);

keygen.stdout.on('data', function(data){
    console.log(data.toString());
});

keygen.stderr.on('data', function(data){
    console.error(data.toString());
});