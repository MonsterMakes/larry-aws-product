'use strict';
const CliModule = require('@monstermakes/larry-cli').CliModule;
const CloudFormation = require('../aws/services/CloudFormation');

class NodeProjectCli extends CliModule {
	constructor(vorpalInstance){
		super(vorpalInstance);
		this._cloudFormation = new CloudFormation();
		this._init();
	}
	_init(){
		let that = this;
		this._vorpalInstance
			.command('ask-for-params <cfTemplates...>', 'Ask for the parameter of a cloudformation template(s).')
			.option('-p, --as-parameter-overrides', 'Output the params in aws cli parameter-overrides format.')
			.action(function (args, callback) {
				this.log(`Please provide the cloud formation parameters for template (${args.cfTemplates})`);
				that._cloudFormation.loadParamsFromCloudFormationTemplates(args.cfTemplates)
					.then((params)=>{
						let prompts = that._cloudFormation.convertParametersToPrompts(params);
						return this.prompt(prompts)
							.then(answers => {
								if(args.options['as-parameter-overrides']){
									let parameterOverrides = '--parameter-overrides';
									for(let answer in answers){
										parameterOverrides += ` ${answer}=${answers[answer]}`;
									}
									callback(parameterOverrides);
								}
								else{
									callback(answers);
								}

							});
					});

			});
	}
}
module.exports = NodeProjectCli;