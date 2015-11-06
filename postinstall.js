var fs = require('fs');
var path = require('path');
var childProcess = require('child_process');
var Q = require('q');

var stat = Q.nfbind(fs.stat);
var os = require('os');

var config = {
    "key": {
        "filename": "openshift_rsa",
        "name": "openshift-deployment" + "_" + os.hostname(),
        "comment": "created by openshift-deployment",
        "password": "openshift-deployment"
    }
};

var location = path.join(__dirname, config.key.filename);

if(!fs.existsSync(location) || !fs.existsSync(location + ".pub")){
    var sshKeygen = childProcess.spawn('ssh-keygen', [
        '-t','rsa',
        '-C', config.key.comment,
        '-f', location,
        '-N', ""
    ]);

    sshKeygen.stdout.on('data', function(data){
        console.log(data.toString());
    });

    sshKeygen.stderr.on('data', function(data){
        console.error(data.toString());
    });
} else {
    console.log("SSH Key does already exist!");
}

var configPath = path.join(__dirname, "config.json");

if(!fs.existsSync(configPath)){
    fs.writeFileSync(path.join(__dirname, "config.json"), JSON.stringify(config));
}


