module.exports.cliActions = {
	aws: {
		aws: require('./src/cli-actions/Aws.cli-action')
	}
};
module.exports.cliModules = {
	Aws: require('./src/cli-modules/Aws.cli-module')
};
module.exports.services = {
	CloudFormation: require('./src/aws/services/CloudFormation'),
	ParameterStore: require('./src/aws/services/ParameterStore'),
	Ecs: require('./src/aws/services/Ecs')
};