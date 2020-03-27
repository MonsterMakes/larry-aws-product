'use strict';
const _ = require('lodash');
const fs = require('fs');
const AwsCloudFormation = require('../aws-raw-services/AwsCloudFormation');
const BackoffUtils = require('../../util/BackoffUtils');

class CloudFormation extends AwsCloudFormation {
	constructor(awsConfig) {
		super(awsConfig);
	}
	loadParamsFromCloudFormationTemplates(...filePaths){
		let paths = _.flattenDeep(filePaths);
		let parameters = [];
		let prom = Promise.resolve();
		//loop through all the cloud formation templates and load up all the parameters
		for(let path of paths) {
			prom = prom.then(()=>{
				return this.retrieveParametersFromFile(path)
					.then((retrievedParams)=>{
						parameters = parameters.concat(retrievedParams);
					});
			});
		}
		return prom.then(()=>{
			return parameters;
		});
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
	_createAwsRequestArrayFromObj(params,usePrevious=false){
		const paramsArr = [];
		Object.keys(params).forEach((prmName)=>{
			paramsArr.push({
				ParameterKey: prmName,
				ParameterValue: String(params[prmName]),
				UsePreviousValue: usePrevious
			});
		});
		return paramsArr;
	}
	deployTemplate(name,cfTemplate,params,opts={capabilities:undefined,tags:undefined}){
		let paramsReq = params;
		if(_.isPlainObject(params)){
			paramsReq = this._createAwsRequestArrayFromObj(params);
		}
		return Promise.resolve()
			.then(()=>{
				//TODO normalize params
				return this.createStack({
					TemplateBody: cfTemplate,
					StackName: name,
					Parameters: paramsReq,
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
				return this.awaitStackStatus(stackId,['CREATE_COMPLETE','CREATE_FAILED','ROLLBACK_COMPLETE','ROLLBACK_FAILED','UPDATE_COMPLETE','UPDATE_FAILED','UPDATE_ROLLBACK_COMPLETE','UPDATE_ROLLBACK_FAILED'])
					.then((lastUpdatedStatus)=>{
						if((lastUpdatedStatus.StackStatus === 'CREATE_FAILED') || (lastUpdatedStatus.StackStatus === 'UPDATE_FAILED') ){
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