module.exports = [
    {
        description: 'Start OTG search',
        method: 'PUT',
        path: '/search/',
        requires_authorizaton: true,
        fn: function(callback, args) {
            var openComm = Homey.app.api.openComm;
			var ok = openComm(args['body']['ip'], args['body']['port']);
			callback(null, ok);
        }
    },
    {
        description: 'Get variables available for logging',
        method: 'GET',
        path: '/getLogVars/',
        requires_authorizaton: true,
        fn: function(callback, args) {
            var getLoggableVars = Homey.app.api.getLoggableVars;
			var ok = getLoggableVars();
			callback(null, ok);
        }
    },
    {
        description: 'Get OTG configuration',
        method: 'GET',
        path: '/getOtgwConfig/',
        requires_authorizaton: false,
        fn: function(callback, args) {
			var result = Homey.app.api.getGatewayConfig();
			callback(null, result);
        }
    },
    {
        description: 'Get OTG variables and values',
        method: 'GET',
        path: '/getOtgwVars/',
        requires_authorizaton: false,
        fn: function(callback, args) {
			var result = Homey.app.api.getGatewayVariables();
			callback(null, result);
        }
    }
];