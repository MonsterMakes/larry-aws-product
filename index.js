module.exports.AwsConfigSingleton = require('./src/aws/AwsConfigSingleton');
module.exports.services = {
	CloudFormation: require('./src/aws/services/CloudFormation'),
	ParameterStore: require('./src/aws/services/ParameterStore'),
	Ecs: require('./src/aws/services/Ecs')
};
module.exports.lib = {
	environment: {
		Environment: require('./src/lib/environment/Environment')
	}
};
module.exports.test = {
	utils: {
		InquirerPromptAssertions: require('./test/util/InquirerPromptAssertions')
	}
};
module.exports.cliModules = {
	Environment: require('./src/cli-modules/Environment.cli-module')
};