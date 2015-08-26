var Q = require('q');
var rp = require('request-promise');

/**
 * Retrieves information about a specific application id.
 * @param {object} credentials user and pass
 * @param {id} domainId
 * @param {id} appId
 */
module.exports.info = function(credentials, domainId, appId){
    var opts = {
        method: "GET",
        uri: "https://openshift.redhat.com/broker/rest/domains/" + domainId + "/applications/" + appId,
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
