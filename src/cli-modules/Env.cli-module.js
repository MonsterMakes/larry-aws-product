'use strict';
const _ = require('lodash');
const CliModule = require('@monstermakes/larry-cli').CliModule;
const LarryAwsProduct = require('@monstermakes/larry-aws-product');
const Environment = LarryAwsProduct.lib.environment.Environment;
const CLOUD_FORMATION_TEMPLATES_DIR = __dirname+'/../cloud-formation';
const AWS_PROFILE_PROMPT = {
	type:'String',
	name:'AwsProfile',
	message:'Provide the AWS profile to use => ',
	description:'The AWS profile to use.',
	default: 'default',
	validate: (input)=>{
		let result = true;
		if(!input){
			result = `Invalid format, a value must be supplied.`;
		}
		return result;
	},
};
const ENVIRONMENT_NAME_PROMPT = {
	type:'String',
	name:'EnvironmentName',
	message:'Provide the name of the environment being deployed => ',
	description:'The name of the environment being deployed.',
	validate: (input)=>{
		const allowedPattern = /^[0-9a-z-]*$/;
		let result = true;
		if(input){
			if(!input.match(allowedPattern)){
				result = `Invalid format, must be kebab-case with lower case letters and numbers (${allowedPattern}).`;
			}
		}
		else{
			result = `Invalid format, a value must be supplied.`;
		}
		return result;
	}
};
const REGION_NAME_PROMPT = {
	type: 'list',
	name: 'AwsRegion',
	message: 'Provide the name of the aws region to deploy your environment in => ',
	description: 'The name of the aws region to deploy your environment in.',
	default: 'us-east-1',
	choices: [
		{
			name:'US East (N. Virginia)',
			value:'us-east-1'
		},
		{
			name:'US East (Ohio)',
			value:'us-east-2'
		},
		{
			name:'US West (N. California)',
			value:'us-west-1'
		},
		{
			name:'US West (Oregon)',
			value:'us-west-2'
		},
		{
			name:'Asia Pacific (Hong Kong)',
			value:'ap-east-1'
		},
		{
			name:'Asia Pacific (Mumbai)',
			value:'ap-south-1'
		},
		{
			name:'Asia Pacific (Osaka-Local)',
			value:'ap-northeast-3'
		},
		{
			name:'Asia Pacific (Seoul)',
			value:'ap-northeast-2'
		},
		{
			name:'Asia Pacific (Singapore)',
			value:'ap-southeast-1'
		},
		{
			name:'Asia Pacific (Sydney)',
			value:'ap-southeast-2'
		},
		{
			name:'Asia Pacific (Tokyo)',
			value:'ap-northeast-1'
		},
		{
			name:'Canada (Central)',
			value:'ca-central-1'
		},
		{
			name:'Europe (Frankfurt)',
			value:'eu-central-1'
		},
		{
			name:'Europe (Ireland)',
			value:'eu-west-1'
		},
		{
			name:'Europe (London)',
			value:'eu-west-2'
		},
		{
			name:'Europe (Paris)',
			value:'eu-west-3'
		},
		{
			name:'Europe (Stockholm)',
			value:'eu-north-1'
		},
		{
			name:'Middle East (Bahrain)',
			value:'me-south-1'
		},
		{
			name:'South America (São Paulo)',
			value:'sa-east-1'
		},
	]
};

class EnvironmentCliModule extends CliModule {
	constructor(vorpalInstance){
		super(vorpalInstance);
		this._initialPrompt = undefined;
		this._clearState();	
		this._init();
	}
	_clearState(){
		this._environment = null;
	}
	_createAndLoadNewEnvironmentClass(envName,awsConfig){
		if(this._environment){
			//TODO wait for shutdown???
			this._environment.shutdown();
		}
		//TODO set cloudFormationTemplatePattern to '**/*.@(yml|yaml)'
		this._environment = new Environment(envName,CLOUD_FORMATION_TEMPLATES_DIR,{cloudFormationTemplatePattern: 'platform/vpc.yml',awsConfig});
	}
	/*********************************************************/
	/* START PROMPT HELPER METHODS */
	/*********************************************************/

	/*********************************************************/
	/* END PROMPT HELPER METHODS */
	/* START CLI ACTION DEFINITION METHODS */
	/*********************************************************/
	_init(){	
		this._initSetProfileAction();
		this._initSetRegionAction();
		this._initSetEnvironmentAction();
		this._initLoadAction();
		this._initDeployAction();
	}
	_initSetProfileAction(){
		this._vorpalInstance
			.command('set-profile <profileName>', 'Set the aws Profile.')
			.action((args, callback) => {
				return Promise.resolve()
					.then(()=>{
						if(this._environment){
							//If there is no region associated with this aws Profile grab the one from the current env
							let region = LarryAwsProduct.AwsBase.retreiveAwsConfig({profile: args.profileName}).region;
							if(!region){
								region = this._environment.getEnvironmentRegion();
								this._vorpalInstance.log(`[${args.profileName}] does not include a region using currently loaded region (${region})`);
							}
							return Promise.resolve()
								.then(()=>{
									return this._createAndLoadNewEnvironmentClass(this._environment.getEnvironmentName(),{profile: args.profileName,region});
								})
								.then(()=>{
									return this._setEnvironmentPrompt();
								});
						}
						else{
							return this._setupEnvironmentDetails({profile: args.profileName});
						}
					})
					.then(callback)
					.catch(callback);
			});
	}
	_initSetRegionAction(){
		this._vorpalInstance
			.command('set-region [region]', 'Set the aws region.')
			.action((args, callback) => {
				return Promise.resolve(args.region)
					.then((region)=>{
						if(!region){
							return Promise.resolve()
								.then(()=>{
									return this._vorpalInstance.activeCommand.prompt([REGION_NAME_PROMPT]);
								})
								.then((regionPromptVals)=>{
									return regionPromptVals.AwsRegion;
								});
						}
						else{
							return region;
						}
					})
					.then((region)=>{
						if(this._environment){
							let environmentName = this._environment.getEnvironmentName();
							let profile = this._environment.getAwsProfile();
							return Promise.resolve()
								.then(()=>{
									return this._createAndLoadNewEnvironmentClass(environmentName,{profile, region});
								})
								.then(()=>{
									return this._setEnvironmentPrompt();
								});
						}
						else{
							return this._setupEnvironmentDetails({region});
						}
					})
					.then(callback)
					.catch(callback);
			});
	}
	_initSetEnvironmentAction(){
		this._vorpalInstance
			.command('set-environment <envName>', 'Set the aws Profile.')
			.action((args, callback) => {
				return Promise.resolve()
					.then(()=>{
						if(this._environment){
							const region = this._environment.getEnvironmentRegion();
							let profile = this._environment.getAwsProfile();
							return Promise.resolve()
								.then(()=>{
									return this._createAndLoadNewEnvironmentClass(args.envName,{profile,region});
								})
								.then(()=>{
									return this._setEnvironmentPrompt();
								});
						}
						else{
							return this._setupEnvironmentDetails({environmentName: args.envName});
						}
					})
					.then(callback)
					.catch(callback);
			});
	}
	_initLoadAction(){
		this._vorpalInstance
			.command('load-params', 'Loads environment parameters from defaults or existing parameters.')
			.action((args, callback) => {
				return Promise.resolve()
					.then(()=>{
						return this._setupEnvironmentDetails();
					})
					.then(()=>{
						return this._environment.loadEnvironmentParameters();
					})
					.then(()=>{
						return this._printEnvironmentDetails();
					})
					.then(callback)
					.catch(callback);
			});
	}
	_initAlterParamsAction(){
		this._vorpalInstance
			.command('alter-params', 'Create environment parameters or update existing parameters.')
			.action((args, callback) => {
				return Promise.resolve()
					.then(()=>{
						return this._setupEnvironmentDetails();
					})
					.then(()=>{
						return this._environment.retrieveEnvironmentPrompts(['EnvironmentName','region']);
					})
					.then((prompts)=>{
						//TODO load params from Cloud Formation
						return this._vorpalInstance.activeCommand.prompt(prompts);
					})
					.then((values)=>{
						return this._environment.setEnvironmentParameterValues(values);
					})
					.then(callback)
					.catch(callback);
			});
	}
	_initDeployAction(){
		this._vorpalInstance
			.command('deploy-template', 'Create, update, or inspect environment parameters.')
			.action((args, callback) => {
				return Promise.resolve()
					.then(()=>{
						return this._setupEnvironmentDetails();
					})
					.then(()=>{
						return this._environment.retrieveEnvironmentPrompts(['EnvironmentName','region']);
					})
					.then((prompts)=>{
						//TODO load params from Cloud Formation
						return this._vorpalInstance.activeCommand.prompt(prompts);
					})
					.then((values)=>{
						return this._environment.setEnvironmentParameterValues(values);
					})
					.then(callback)
					.catch(callback);
			});
	}
	/*********************************************************/
	/* END CLI ACTION DEFINITION METHODS */
	/* START CLI ACTION HELPER METHODS */
	/*********************************************************/
	_setEnvironmentPrompt(){
		if(!this._initialPrompt){
			this._initialPrompt = this._vorpalInstance._delimiter.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');//eslint-disable-line
		}
		const promptStr = 
			this._vorpalInstance.chalk.bgCyan(
				this._vorpalInstance.chalk.black(
					`${this._initialPrompt} [${this._environment.getAwsProfile()}] : ${this._environment.getEnvironmentRegion()} : ${this._environment.getEnvironmentName()} `
				)
			);
		this._vorpalInstance.delimiter(promptStr);
	}
	_setupEnvironmentDetails(opts={environmentName: undefined, profile:undefined, region: undefined}){
		return Promise.resolve()
			.then(()=>{
				return Promise.resolve()
					// load AWS_PROFILE, region, and env if none are set
					.then(()=>{
						if(!this._environment){
							const prompts = [];
							if(!opts.environmentName){
								prompts.push(ENVIRONMENT_NAME_PROMPT);
							}
							if(!opts.profile && !process.env.AWS_PROFILE){
								prompts.push(AWS_PROFILE_PROMPT);
							}
							this._vorpalInstance.log('****************************************');
							this._vorpalInstance.log('Prompting for Environment details...');
							this._vorpalInstance.log('****************************************');
							return this._vorpalInstance.activeCommand.prompt(prompts)
								.then((envProfileVals)=>{
									const awsConfig = _.defaults({},
										{region: _.get(opts,'region'), profile: _.get(opts,'profile')},
										{profile: _.get(envProfileVals,'AwsProfile')}
									);
									
									return Promise.resolve()
										.then(()=>{
											let defaultRegionForProfile = LarryAwsProduct.AwsBase.retreiveAwsConfig({profile: _.get(envProfileVals,'AwsProfile')}).region;
											if(!defaultRegionForProfile){
												return this._vorpalInstance.activeCommand.prompt([REGION_NAME_PROMPT]);
											}
										})
										.then((regionVals)=>{
											const mutatedAwsConfig = _.defaults({},awsConfig,{region:_.get(regionVals,'AwsRegion')});
											return this._createAndLoadNewEnvironmentClass(_.get(opts, 'environmentName', envProfileVals.EnvironmentName),mutatedAwsConfig);
										});
								});
						}
					});
			})
			.then(()=>{
				return this._setEnvironmentPrompt();
			});
	}
	_printEnvironmentDetails(){
		this._vorpalInstance.log('');
		this._vorpalInstance.log('*********************************************************************');
		this._vorpalInstance.log(`Loaded Environment Parameters for ${this._environment.getEnvironmentName()} (${this._environment.getEnvironmentRegion()})`);
		this._vorpalInstance.log('*********************************************************************');
		this._vorpalInstance.log('');
		const vals = this._environment.getEnvironmentParameterValues();
		Object.keys(vals).forEach(valName=>{
			this._vorpalInstance.log(`${valName} => ${vals[valName]}`);
		});
		this._vorpalInstance.log('');
	}
	/*********************************************************/
	/* END CLI ACTION HELPER METHODS */
	/*********************************************************/
}
module.exports=EnvironmentCliModule;