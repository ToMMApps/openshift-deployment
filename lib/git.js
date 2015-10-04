var childProcessPromise = require('child-process-promise');
var Q = require('q');
var config = require('../config.json');
var path = require('path');
var api = {};

var git = function () {
    return path.join(__openShiftDeploymentRoot, "git.sh") + " -i " + path.join(__openShiftDeploymentRoot, require('../config').key.filename);
};

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
    return childProcessPromise.exec(w(git(), "pull", remote, branch), {cwd: this.path});
};

api.Repository.prototype.addAll = function () {
    return childProcessPromise.exec(w("git", "add", "-A"), {cwd: this.path});
};

api.Repository.prototype.commit = function (message) {
    return childProcessPromise.exec(w("git", "commit", "-m", message), {cwd: this.path});
};

api.Repository.prototype.push = function (remote, branch) {
    return childProcessPromise.exec(w(git(), "push", remote, branch), {cwd: this.path});
};

api.clone = function(url, path){

    return childProcessPromise.exec(w(git(), "clone", url, path), {cwd: this.path}).then(function () {
        return new api.Repository(path);
    });
};

module.exports = api;