const Homey = require('homey')

module.exports = [
  {
    description: 'Get OTG configuration',
    method: 'GET',
    path: '/getOtgwConfig/',
    public: true,
    fn: function(args, callback) {
			var result = Homey.app.getGatewayConfiguration();
			callback(null, result);
    }
  },
  {
    description: 'Get OTG variables and values',
    method: 'GET',
    path: '/getOtgwVars/',
    public: true,
    fn: function(args, callback) {
			var result = Homey.app.getGatewayVariables();
			callback(null, result);
    }
  }
];
