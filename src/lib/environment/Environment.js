'use strict';
const _ = require('lodash');
const glob = require('glob');
const pathUtils = require('path');
const LarryAwsProduct = require('../../../index');
const CloudFormation = LarryAwsProduct.services.CloudFormation;
//const Automaton = require('@monstermakes/larry-automata').Automaton;
const CF_TEMP_PATTERN = '**/*.@(yml|yaml)';


class Environment{
	constructor(environmentName,cloudFormationDir,opts={cloudFormationTemplatePattern: CF_TEMP_PATTERN,awsConfig: undefined}){
		this._environmentName = environmentName;
		this._cloudFormationDir = cloudFormationDir;
		this._cloudFormationTemplatePattern = _.get(opts,'cloudFormationTemplatePattern',CF_TEMP_PATTERN);
		//setup aws config
		this.setAwsConfig(opts.awsConfig);
		this._cloudFormation = new CloudFormation();
		this._clearState();
	}
	_clearState(){
		this._parameterValues = null;
		this._cloudFormationTemplatePaths = null;
		this._cloudFormationParams = null;
		this._environmentParameterValues = null;
	}
	/*********************************************************/
	/* START INQUIRER PROMPT METHODS */
	/*********************************************************/
	/**
	 * Convert AWS cloud formation params into an array of inquirer (https://www.npmjs.com/package/inquirer) prompts.
	 */
	_convertParametersToPrompts(cloudFormationParams){
		let prompts = [];
		this._cloudFormationParams.forEach((param)=>{
			let type = 'String';
			let dflt = param.DefaultValue;
			let description = param.Description;
			let name = param.ParameterKey;
			let validate = null;

			//Check for Parameters that correspond to existing parameters in Systems Manager Parameter Store. 
			//You specify a Systems Manager parameter key as the value of the SSM parameter, and AWS CloudFormation fetches the latest value from Parameter Store to use for the stack. 
			//For more information, see SSM Parameter Types (https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/parameters-section-structure.html#aws-ssm-parameter-types).
			if(param.ParameterType.startsWith('AWS::SSM::Parameter::Value')){
				let matchResults = param.ParameterType.match(/AWS::SSM::Parameter::Value<(.*)>/);
				type = matchResults[1];
			}
			else{
				type = param.ParameterType;
			}
			switch(type){
			case 'String':
				validate = (input)=>{
					let result = true;
					if(param.hasOwnProperty('AllowedPattern')){
						if(!input.match(param.AllowedPattern)){
							result = `Invalid format, must be of type ${param.AllowedPattern}.`;
						}
					}
					return result;
				};
				break;
			//An integer or float. AWS CloudFormation validates the parameter value as a number; however, when you use the parameter elsewhere in your template (for example, by using the Ref intrinsic function), the parameter value becomes a string.
			case 'Number':
				type = 'Number';
				if(!Number.isNaN(dflt) && dflt !== null && dflt !== undefined){
					dflt = (new Number(dflt)).valueOf();
				}
				else{
					dflt = undefined;
				}
				validate = (input)=>{
					if(Number.isNaN(+input)){
						return 'You must supply a number.';
					}
					else{
						return true;
					}
				};
				break;
			//An array of integers or floats that are separated by commas. AWS CloudFormation validates the parameter value as numbers; however, when you use the parameter elsewhere in your template (for example, by using the Ref intrinsic function), the parameter value becomes a list of strings.
			//For example, users could specify "80,20", and a Ref would result in ["80","20"].
			case 'List<Number>': 
				throw new Error(`ParameterType (${param.ParameterType}) not yet supported!`);
				break;
			//An array of literal strings that are separated by commas. The total number of strings should be one more than the total number of commas. Also, each member string is space trimmed.
			//For example, users could specify "test,dev,prod", and a Ref would result in ["test","dev","prod"].
			case 'CommaDelimitedList':
				throw new Error(`ParameterType (${param.ParameterType}) not yet supported!`);
				break;
			default:
				// The Last supported type that could end up here are AWS-Specific Parameter Types, values such as Amazon EC2 key pair names and VPC IDs. 
				//For more information, see AWS-Specific Parameter Types (https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/parameters-section-structure.html#aws-specific-parameter-types).
				throw new Error(`ParameterType (${param.ParameterType}) not yet supported!`);
				break;
			}
			
			let message = `Please enter a ${type} for ${name}` + ' => ';

			let prompt = {
				_meta: {
					_param: param
				},
				type: type,
				name: name,
				default: dflt,
				validate: (input)=>{
					let result = true;
					if(input === ''){
						return 'A value must be supplied';
					}
					else{
						if(param.ParameterConstraints.hasOwnProperty('AllowedValues')){
							result = param.ParameterConstraints.AllowedValues.includes(input);
						}
						return result && validate(input);
					}
				},
				message: message,
				description: description || `${name} is a ${type}.`
			};
			prompts.push(prompt);
		});
		return prompts;
	}
	/*********************************************************/
	/* END INQUIRER PROMPT METHODS */
	/* START CLOUD FORMATION METHODS */
	/*********************************************************/
	_loadAllEnvironmentCloudFormationTemplates(){
		return Promise.resolve()
			.then(()=>{
				return new Promise((resolve,reject)=>{
					glob(this._cloudFormationTemplatePattern, {cwd: this._cloudFormationDir, absolute: false}, function (err, files) {
						if (err) {
							reject(err);
						}
						else {
							resolve(files);
						}
					});
				});
			})
			.then((files)=>{
				this._cloudFormationTemplatePaths = files;
				return this._cloudFormationTemplatePaths;
			});
	}
	_loadCloudFormationParams(){
		if(this._cloudFormationParams){
			return Promise.resolve(this._cloudFormationParams);
		}
		else {
			return Promise.resolve()
				.then(()=>{
					if(!this._cloudFormationTemplatePaths){
						return this._loadAllEnvironmentCloudFormationTemplates();
					}
					else{
						return this._cloudFormationTemplatePaths;
					}
				})
				.then((cloudFormationTemplatePaths)=>{
					let parameters = [];
					let prom = Promise.resolve();
					//loop through all the cloud formation templates and load up all the parameters
					for(let relCFPath of cloudFormationTemplatePaths) {
						const path = pathUtils.join(this._cloudFormationDir,relCFPath);
						prom = prom.then(()=>{
							return this._cloudFormation.loadParamsFromCloudFormationTemplates(path)
								.then((retrievedParams)=>{
									retrievedParams.forEach((rp)=>{
										rp._meta = {
											_retrievedFrom: pathUtils.relative(this._cloudFormationDir,path)
										};
									});
									parameters = parameters.concat(retrievedParams);
								});
						});
					}
					return prom.then(()=>{
						return parameters;
					});
				})
				//dedupe the params
				.then((params)=>{
					let foundPreviously = {};
					//first parameter wins based on ParameterKey value
					let deDupedParams = params.filter((param) => {
						if(foundPreviously.hasOwnProperty(param.ParameterKey)){
							return false;
						}
						else{
							foundPreviously[param.ParameterKey]=true;
							return true;
						}
					});
					params = deDupedParams;
					return params;
				})
				.then((dedupedParams)=>{
					this._cloudFormationParams = dedupedParams;
					return this._cloudFormationParams;
				});
		}
	}
	_getNamespacedCloudFormationName(pathToTemplate){
		let pathToTemplateNoExtension = pathToTemplate.split('.').slice(0, -1).join('.');
		let kebabCaseNamespaced = pathToTemplateNoExtension.replace(new RegExp(pathUtils.sep,'g'),'-');
		kebabCaseNamespaced = kebabCaseNamespaced.replace(/^-/,'');
		return `env-${this._environmentName}-${kebabCaseNamespaced}`;
	}
	_getValuesFromCloudFormationParams(cfParams){
		const values = {};
		cfParams.forEach((cfParam)=>{
			let val = undefined;
			if(cfParam.hasOwnProperty('ResolvedValue')){
				val = cfParam.ResolvedValue;
			}
			else if(cfParam.hasOwnProperty('ParameterValue')){
				val = cfParam.ParameterValue;
			}
			else if(cfParam.hasOwnProperty('DefaultValue')){
				val = cfParam.DefaultValue;
			}
			//special cases
			else if(cfParam.ParameterKey.toLowerCase() === 'environmentname'){
				val = this.getEnvironmentName();
			}
			values[cfParam.ParameterKey] = val;
		});
		return values;
	}
	/*********************************************************/
	/* END CLOUD FORMATION METHODS */
	/* START STATE & GETTER SETTER METHODS */
	/*********************************************************/
	getAwsConfig(){
		return LarryAwsProduct.AwsConfigSingleton.getLoadedConfig();
	}
	setAwsConfig(config){
		LarryAwsProduct.AwsConfigSingleton.loadAwsConfig(config);
	}
	getAwsProfile(){
		let awsCfg = this.getAwsConfig();
		return awsCfg.credentials.profile;
	}
	getEnvironmentName(){
		return this._environmentName;
	}
	getEnvironmentRegion(){
		let awsCfg = this.getAwsConfig();
		return awsCfg.region;
	}
	loadEnvironmentParameters(){
		return Promise.resolve()
			.then(()=>{
				return this._loadCloudFormationParams();
			})
			.then(()=>{
				return this._getValuesFromCloudFormationParams(this._cloudFormationParams);
			})
			.then((defaultValues)=>{
				this._environmentParameterValues = defaultValues;
				//TODO go get details from Deployed Stacks
			})
			.then(()=>{
				return this._environmentParameterValues;
			});
	}
	getEnvironmentParameterValues(){
		return this._environmentParameterValues;
	}
	setEnvironmentParameterValues(values){
		this._environmentParameterValues = values;
	}
	getEnvironmentParametersAsPrompts(){
		return Promise.resolve()
			.then(()=>{
				return this._loadCloudFormationParams();
			})
			.then(()=>{
				return this._convertParametersToPrompts(this._cloudFormationParams);
			});
	}
	/*********************************************************/
	/* END STATE & GETTER SETTER METHODS */
	/* START ENVIRONMENT ACTIONS */
	/*********************************************************/
	deployTemplate(pathToTemplate,opts={capabilities:undefined,tags:{}}){
		const ABS_PATH_TO_TEMPLATE = pathUtils.join(this._cloudFormationDir,pathToTemplate);
		//always include environment tags
		opts.tags.EnvironmentName = this._environmentName;

		//TODO add logging
		return Promise.resolve()
			.then(()=>{
				return this._cloudFormation.deployTemplateFile(
					ABS_PATH_TO_TEMPLATE,
					this._getNamespacedCloudFormationName(pathToTemplate),
					this._parameterValues,
					{
						capabilities: opts.capabilities,
						tags: opts.tags
					}
				);
			});
	}
	shutdown(){
		//TODO teardown
		this._clearState();
	}
	/*********************************************************/
	/* END ENVIRONMENT ACTIONS */
	/*********************************************************/


//TODO SHOULD THESE BE DELETED
XXXconvertDirectoryOfCloudFormationTemplatesParametersIntoPrompts(cfDirectory,cfTemplatePattern='**/*.@(yml|yaml)',ignoreParams=[]){
	return this.loadParamsFromCloudFormationDirectory(cfDirectory,true,cfTemplatePattern)
		.then((params)=>{
			return this.convertParametersToPrompts(params,true);
		})
		//remove any prompts that should be ignored
		.then((prompts)=>{
			ignoreParams.forEach((paramNameToIgnore)=>{
				prompts = prompts.filter((prompt)=>{
					return prompt.name !== paramNameToIgnore;
				});
			});
			return prompts;
		});
}

XXX_getNamespacedParamNameFromPrompt(prompt){
	//Note: these _meta properties on exist on prompts loaded using _cloudFormation.convertParametersToPrompts() with includeParams being true.
	let param = _.get(prompt,'_meta._param');
	return this._getNamespacedParamNameFromCloudformationParameter(param);
}
XXX_getNamespacedParamNameFromCloudformationParameter(param){
	let basePath = _.get(param,'_meta._retrievedFrom','/');
	let paramName = pathUtils.join('/environments',this._environmentName,pathUtils.dirname(basePath),param.ParameterKey);
	return paramName;
}
}
module.exports=Environment;