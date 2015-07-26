var Q = require('q');
var rp = require('request-promise');

/**
 * @param {id} appId
 * @param {object} credentials user and pass
 */
module.exports.info = function(appId, credentials){
    var opts = {
        method: "GET",
        uri: "https://openshift.redhat.com/broker/rest/application/" + appId,
        auth: credentials,
        headers: {
            accept: '*/*'
        },
        transform: JSON.parse
    };

    return rp(opts).then(function(response){
        return Q(response.data);
    });
};