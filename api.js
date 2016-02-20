module.exports = [
    {
        description: 'Start OTG search',
        method: 'PUT',
        path: '/search/',
        requires_authorizaton: false,
        fn: function(callback, args) {
            console.log("/search");
            var openComm = Homey.app.api.openComm;
			var ok = openComm(args['body']['ip'], args['body']['port']);
			callback(null, ok);
        }
    },
    {
        description: 'Determine of OTG has been found',
        method: 'GET',
        path: '/found/',
        requires_authorizaton: false,
        fn: function(callback, args) {
            console.log("/found");
            var found = Homey.app.api.found();
			callback(null, found);    
        }
    },
    {
        description: 'Update feature settings',
        method: 'PUT',
        path: '/feature/',
        requires_authorizaton: false,
        fn: function(callback, args) {
            console.log("/feature");
            var setFeatures = Homey.app.api.setFeatures;
			var ok = setFeatures(args['body']['features']);
			callback(null, ok);
        }
    }
];