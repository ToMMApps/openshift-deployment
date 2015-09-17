#OpenShift-Deployment

This tool allows it to deploy a given folder to OpenShift.

Installation
-------------

```
npm install openshift-deployment
```

Usage
---------

You will only need to do the following:

Create a new OpenShift application under a specific domain. This can be done on the OpenShift website or by using the tool rhc.
That's it. Now you are ready to use the deploy function. SSH key management will be done automatically for you. 
This tool generates a new SSH key on npm install.

```
var openshift = require('openshift');
openshift.deploy({user: 'example@test.com', pass: 'pass'}, 'myDomain', 'myApp', sourcePath).then(function(){
    //done
});
```

If the deployment was successful this function resolves.

Code-Quality
--------------

For coverage report run "npm run cover" and npm test for all mocha tests.

Written by Henning Gerrits, ToMM Apps GmbH
