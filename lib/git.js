var exec = require('child-process-promise').exec;
var Q = require('q');
var config = require('../config.json');
var path = require('path');
var git = path.join(__openShiftDeploymentRoot, "git.sh") + " -i " + path.join(__openShiftDeploymentRoot, require('../config').key.filename);

var api = {};

function w(){
    var result = arguments[0];

    for(var i = 1; i < arguments.length; i++){
        result = result + " " + arguments[i];
    }

    return result;
}

api.Repository = function (path) {
    this.path = path;
};

api.Repository.open = function (path) {
    return Q(new api.Repository(path));
};

api.Repository.prototype.pull = function (remote, branch) {
    return exec(w(git, "pull", remote, branch), {cwd: this.path});
};

api.Repository.prototype.addAll = function () {
    return exec(w("git", "add", "-A"), {cwd: this.path});
};

api.Repository.prototype.commit = function (message) {
    return exec(w("git", "commit", "-m", message), {cwd: this.path});
};

api.Repository.prototype.push = function (remote, branch) {
    return exec(w(git, "push", remote, branch), {cwd: this.path});
};

api.clone = function(url, path){

    return exec(w(git, "clone", url, path), {cwd: this.path}).then(function () {
        return new api.Repository(path);
    });
};

module.exports = api;