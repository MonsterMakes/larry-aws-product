'use strict';
const _ = require('lodash');
const fs = require('fs');
const AwsCloudFormation = require('../aws-raw-services/AwsCloudFormation');
const BackoffUtils = require('../../util/BackoffUtils');

class CloudFormation extends AwsCloudFormation {
	constructor(awsConfig) {
		super(awsConfig);
	}
	/**
	 * Convert AWS cloud formation params into an array of inquirer (https://www.npmjs.com/package/inquirer) prompts.
	 * @param {*} params 
	 */
	convertParametersToPrompts(params){
		let prompts = [];
		params.forEach((param)=>{
			let type = 'String';
			let dflt = param.DefaultValue;
			let description = param.Description;
			let name = param.ParameterKey;
			let validate = undefined;

			switch(param.ParameterType){
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
			//An array of integers or floats that are separated by commas. AWS CloudFormation validates the parameter value as numbers; however, when you use the parameter elsewhere in your template (for example, by using the Ref intrinsic function), the parameter value becomes a list of strings.
			//For example, users could specify "80,20", and a Ref would result in ["80","20"].
			case 'List<Number>': // eslint-disable-line
			//An array of literal strings that are separated by commas. The total number of strings should be one more than the total number of commas. Also, each member string is space trimmed.
			//For example, users could specify "test,dev,prod", and a Ref would result in ["test","dev","prod"].
			case 'CommaDelimitedList':// eslint-disable-line
			//AWS values such as Amazon EC2 key pair names and VPC IDs. For more information, see AWS-Specific Parameter Types (https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/parameters-section-structure.html#aws-specific-parameter-types).
			case 'AWS-Specific Parameter Types':// eslint-disable-line
			//Parameters that correspond to existing parameters in Systems Manager Parameter Store. You specify a Systems Manager parameter key as the value of the SSM parameter, and AWS CloudFormation fetches the latest value from Parameter Store to use for the stack. For more information, see SSM Parameter Types (https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/parameters-section-structure.html#aws-ssm-parameter-types).
			case 'SSM Parameter Types':// eslint-disable-line
				throw new Error(`ParameterType (${param.ParameterType}) not yet supported!`);
			}

			let message = description + ' => ' || `Please enter a ${type} for ${name} => `;

			let prompt = {
				type: type,
				name: name,
				default: dflt,
				validate: (input)=>{
					let result = true;
					if(param.ParameterConstraints.hasOwnProperty('AllowedValues')){
						result = param.ParameterConstraints.AllowedValues.includes(input);
					}
					return result && validate();
				},
				message: message,
				description: description
			};
			prompts.push(prompt);
		});
		return prompts;
	}
	loadParamsFromCloudFormationTemplates(...filePaths){
		let paths = _.flattenDeep(filePaths);
		let parameters = [];
		let prom = Promise.resolve();
		//loop through all the cloud formation templates and load up all the parameters
		for(let path of paths) {
			prom = prom.then(()=>{
				return this.retrieveParametersFromFile(path)
					.then((data)=>{
						parameters = parameters.concat(data);
						return parameters;
					});
			});
		}
		return prom;
	}
	retrieveParametersFromFile(fileUrl){
		return Promise.resolve()
			.then(()=>{
				return new Promise((resolve,reject)=>{
					fs.readFile(fileUrl,'utf8', (err, data) => {
						if (err) {
							reject(err);
						}
						else{
							resolve(data);
						}
					});
				});

			})
			.then((cfTemplate)=>{
				return this.retrieveParameters(cfTemplate);
			});
	}
	retrieveParameters(cfTemplate){
		return this.getTemplateSummary(
			{
				TemplateBody: cfTemplate
			})
			.then((data)=>{
				return data.Parameters;
			});
	}
	deployTemplateFile(fileUrl,name,params,opts={capabilities:undefined,tags:undefined}){
		return Promise.resolve()
			.then(()=>{
				return new Promise((resolve,reject)=>{
					fs.readFile(fileUrl,'utf8', (err, data) => {
						if (err) {
							reject(err);
						}
						else{
							resolve(data);
						}
					});
				});

			})
			.then((cfTemplate)=>{
				return this.deployTemplate(name,cfTemplate,params,opts);
			});
	}
	awaitStackStatus(stackIdOrName,statusesIn=[]){
		let statuses = _.flattenDeep([statusesIn]);//make sure this is an array
		return BackoffUtils.exponentialBackoff(
			//backoff function
			(opts)=>{
				console.info(`Attempting to retrieve stack (${stackIdOrName}) status after delaying, (HH:MM:SS.mmm) ${BackoffUtils.msToTime(opts.delayAmounts[opts.currentIndex])}`);
				return this.retrieveStackStatus(stackIdOrName)
					.then((status)=>{
						/* eslint-disable no-fallthrough */
						return new Promise((resolve,reject)=>{
							try{
								switch(status.StackStatus){
								case 'CREATE_COMPLETE': //Successful creation of one or more stacks.
								case 'CREATE_IN_PROGRESS': //Ongoing creation of one or more stacks.
								case 'CREATE_FAILED': //Unsuccessful creation of one or more stacks. View the stack events to see any associated error messages. Possible reasons for a failed creation include insufficient permissions to work with all resources in the stack, parameter values rejected by an AWS service, or a timeout during resource creation.
								case 'DELETE_COMPLETE': //Successful deletion of one or more stacks. Deleted stacks are retained and viewable for 90 days.
								case 'DELETE_FAILED': //Unsuccessful deletion of one or more stacks. Because the delete failed, you might have some resources that are still running; however, you cannot work with or update the stack. Delete the stack again or view the stack events to see any associated error messages.
								case 'DELETE_IN_PROGRESS': //Ongoing removal of one or more stacks.
								case 'REVIEW_IN_PROGRESS': //ngoing creation of one or more stacks with an expected StackId but without any templates or resources. *Important* A stack with this status code counts against the maximum possible number of stacks.
								case 'ROLLBACK_COMPLETE': //Successful removal of one or more stacks after a failed stack creation or after an explicitly canceled stack creation. Any resources that were created during the create stack action are deleted. This status exists only after a failed stack creation. It signifies that all operations from the partially created stack have been appropriately cleaned up. When in this state, only a delete operation can be performed.
								case 'ROLLBACK_FAILED': //Unsuccessful removal of one or more stacks after a failed stack creation or after an explicitly canceled stack creation. Delete the stack or view the stack events to see any associated error messages.
								case 'ROLLBACK_IN_PROGRESS': //Ongoing removal of one or more stacks after a failed stack creation or after an explicitly cancelled stack creation.
								case 'UPDATE_COMPLETE': //Successful update of one or more stacks.								
								case 'UPDATE_COMPLETE_CLEANUP_IN_PROGRESS': //Ongoing removal of old resources for one or more stacks after a successful stack update. For stack updates that require resources to be replaced, AWS CloudFormation creates the new resources first and then deletes the old resources to help reduce any interruptions with your stack. In this state, the stack has been updated and is usable, but AWS CloudFormation is still deleting the old resources.
								case 'UPDATE_IN_PROGRESS': //Ongoing update of one or more stacks.
								case 'UPDATE_ROLLBACK_COMPLETE': //Successful return of one or more stacks to a previous working state after a failed stack update.
								case 'UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS': //Ongoing removal of new resources for one or more stacks after a failed stack update. In this state, the stack has been rolled back to its previous working state and is usable, but AWS CloudFormation is still deleting any new resources it created during the stack update.
								case 'UPDATE_ROLLBACK_FAILED': //Unsuccessful return of one or more stacks to a previous working state after a failed stack update. When in this state, you can delete the stack or continue rollback. You might need to fix errors before your stack can return to a working state. Or, you can contact customer support to restore the stack to a usable state.
								case 'UPDATE_ROLLBACK_IN_PROGRESS': //Ongoing return of one or more stacks to the previous working state after failed stack update.
								default:
									if(statuses.includes(status.StackStatus)){
										resolve(status);
									}
									else{
										resolve(false);
									}
									break;
								}
							}
							catch(e){
								reject(e);
							}
						});
					});
			},
			3000, //use a delay of 3 seconds
			45, //give up after 16 times (this will give up roughly at the hour mark)
			60000 //dont delay any more than 5 minutes
		);
	}
	deployTemplate(name,cfTemplate,params,opts={capabilities:undefined,tags:undefined}){
		return Promise.resolve()
			.then(()=>{
				//TODO normalize params
				return this.createStack({
					TemplateBody: cfTemplate,
					StackName: name,
					Parameters: params,
					Capabilities: opts.capabilities,
					Tags: opts.tags
				});
			})
			//Capturing Create Failure reason to run stack update for Existing stack
			.catch((createError)=>{
				if ('AlreadyExistsException' == createError.code){
					return this.updateStack({
						TemplateBody: cfTemplate,
						StackName: name,
						Parameters: params,
						Capabilities: opts.capabilities,
						Tags: opts.tags
					});
				}
				else{
					return Promise.reject(createError);
				}
			})
			.then((createResponse)=>{
				let stackId = createResponse.StackId;
				//use DescribeStacks API to test for completion (use exponential back off)
				return this.awaitStackStatus(stackId,['CREATE_COMPLETE','CREATE_FAILED','ROLLBACK_COMPLETE','ROLLBACK_FAILED'])
					.then((lastUpdatedStatus)=>{
						if(lastUpdatedStatus.StackStatus === 'CREATE_FAILED'){
							let error = new Error(`Failed to deploy template, please see stack (${stackId}).`);
							error.errorDetails = {
								createResponse: createResponse,
								lastUpdatedStatus: lastUpdatedStatus
							};
							return Promise.reject(error);
						}
						else{
							return Promise.resolve({
								createResponse: createResponse,
								lastUpdatedStatus: lastUpdatedStatus
							});
						}
						
					});
			})
			.then((createResults)=>{
				return createResults;
			});
	}
	retrieveStackStatus(nameOrId){
		return Promise.resolve()
			.then(()=>{
				return this.describeStacks({
					StackName: nameOrId
				});
			})
			.then((stackStatus)=>{
				return stackStatus.Stacks.find((elem)=>{
					if(elem.StackId === nameOrId || elem.StackName === nameOrId){
						return true;
					}
					else{
						return false;
					}
				});
			});
	}
	teardownStack(nameOrId){
		return Promise.resolve()
			.then(()=>{
				return this.deleteStack({
					StackName: nameOrId
				});
			})
			.then((deleteResponse)=>{
				//use DescribeStacks API to test for completion (use exponential back off)
				return this.awaitStackStatus(nameOrId,['DELETE_COMPLETE','DELETE_FAILED'])
					.then((lastUpdatedStatus)=>{
						if(lastUpdatedStatus.StackStatus === 'DELETE_FAILED'){
							let error = new Error(`Failed to delete stack, please see stack (${nameOrId}).`);
							error.errorDetails = {
								deleteResponse: deleteResponse,
								lastUpdatedStatus: lastUpdatedStatus
							};
							return Promise.reject(error);
						}
						else{
							return Promise.resolve({
								deleteResponse: deleteResponse,
								lastUpdatedStatus: lastUpdatedStatus
							});
						}
						
					})
					.catch(e=>{
						//TODO if the stack is no longer visible it is obviously is deleted
						Promise.reject(e);
					});
			})
			.then((createResults)=>{
				return createResults;
			});
	}
}
module.exports = CloudFormation;