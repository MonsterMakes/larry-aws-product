'use strict';
const _ = require('lodash');
const AwsParameterStore = require('../aws-raw-services/AwsSystemsManager');
const BackoffUtils = require('../../util/BackoffUtils');

class ParameterStore extends AwsParameterStore {
	constructor() {
		super();
	}
	_getAwsTagsFromPlainObject(tagsObj){
		let awsTags = [];
		if(_.isObject(tagsObj)){
			Object.getOwnPropertyNames(tagsObj).forEach((tagName)=>{
				awsTags.push({
					Key: tagName,
					Value: tagsObj[tagName]
				});
			});
		}
		return awsTags;
	}
	_getAwsParamFromDefinition(paramDef,opts={overwrite:true,tags:undefined}){
		let awsParam = {};
		
		return awsParam;
	}
	_getAwsParamsFromDefinition(paramsDefinition,opts={overwrite:true,tags:undefined}){
		let awsParams = {};

		if(_.isPlainObject(paramsDefinition)){
			//Decided to only support crawling own properties (when running in chai it adds the extra 'should' property)
			Object.getOwnPropertyNames(paramsDefinition).forEach((pName)=>{
				let paramDef = paramsDefinition[pName];
				if(_.isPlainObject(paramDef)){
					let tags = this._getAwsTagsFromPlainObject(_.merge({},opts.tags || opts.Tags,paramDef.tags));
					awsParams[pName] = _.merge(
						{},
						{
							Type: paramDef.type || paramDef.Type || 'String',
							Name: paramDef.name || paramDef.Name || paramDef,  //hidden feature for complex names
							Value: paramDef.value || paramDef.Value || '',
							Overwrite: paramDef.overwrite || opts.overwrite, //hidden feature for complex use cases
							Description: paramDef.description || paramDef.Description || '',
							Tags: tags //hidden feature for param specific tags (dont see a use case at this point but supported as a hidden feature)
						},
						paramDef
					);
				}
				else if(_.isString(paramDef)){
					awsParams[pName] = {
						Type: 'String',
						Name: pName,
						Value: paramDef,
						Overwrite: opts.overwrite,
						Tags: this._getAwsTagsFromPlainObject(opts.tags)
					};
				}
				else{
					throw new Error(`Invalid Parameter Definition (${paramDef}) must be either a string or an object defining the AWS parameter.`);
				}
			});
		}
		else if(_.isArray(paramsDefinition)){
			paramsDefinition.forEach((paramDef)=>{
				if(_.isPlainObject(paramDef)){
					let tags = this._getAwsTagsFromPlainObject(_.merge({},opts.tags || opts.Tags,paramDef.tags));
					let awsParam = _.merge(
						{},
						{
							Type: paramDef.type || paramDef.Type || 'String',
							Name: paramDef.name || paramDef.Name || paramDef,  //hidden feature for complex names
							Overwrite: paramDef.overwrite || opts.overwrite, //hidden feature for complex use cases
							Description: paramDef.description || paramDef.Description || '',
							Tags: tags //hidden feature for param specific tags (dont see a use case at this point but supported as a hidden feature)
						},
						paramDef
					);
					awsParams[awsParam.Name] = awsParam;
				}
				else{
					throw new Error(`Invalid Parameter Definition (${paramDef}) must be either a string or an object defining the AWS parameter.`);
				}
			});
		}
		return awsParams;
	}
	/**
	 * @typedef ParamsObjectDefinition
	 * @type Object
	 * @property {String} value - The value of the parameter
	 * @property {String} [type=String] - The AWS Parameter type, valid options are 'String' | 'StringList' | 'SecureString'
	 * @property {String} [description] - A user friendly description of this parameter.
	 */
	/**
	 * 
	 * Create parameters in the Parameter Store
	 * TODO this will short circuit if one fails, should we do best effort?
	 * @param {Object<String,ParamsObjectDefinition|String} paramsDefinition - An object where the keys are the parameter names and the values can either be a string or a complex object describing parameter attributes in addition to just value.
	 * @param {Object<String,String>} [tags={}] - A set of tags to apply to all parameters. Each property/value in the object will create a tag where the property name is used as the tag name and the value will be used as the tag value.
	 */
	create(paramsDefinition,tags={}){
		//TODO would it be better to do an all or nothing (in the case that some of these parameters already exist)
		// more specifically this code will leave params around maybe they should be cleaned up
		let awsParamsDef = this._getAwsParamsFromDefinition(paramsDefinition,{tags,overwrite:false});
		let prom = Promise.resolve();
		Object.getOwnPropertyNames(awsParamsDef).forEach((paramName)=>{
			prom = prom
				.then(()=>{
					return BackoffUtils.exponentialBackoff(
						//backoff function
						(opts)=>{//eslint-disable-line
							return this.putParameter(awsParamsDef[paramName])
								.then(createResponse=>{
									return createResponse;
								})
								.catch(e=>{
									if(e.code === 'ThrottlingException'){
										return false; //backoff and try again
									}
									else if(e.code === 'ParameterAlreadyExists'){
										let err = new Error(`Parameter (${paramName}) already exists and cannot be created, try using update() instead.`);
										err.originalError = e;
										return Promise.reject(err);
									}
									else{
										return Promise.reject(e);
									}
								});
						},
						500, //use a delay of 0.5 seconds
						50, //give up after 50 times
						30000 //dont delay any more than 30 seconds
					);
				});
		});
		return prom;
	}
	/**
	 * Create or update parameters
	 * @param {Object<String,ParamsObjectDefinition|String} paramsDefinition - An object where the keys are the parameter names and the values can either be a string or a complex object describing parameter attributes in addition to just value.
	 */
	update(paramsDefinition){
		let awsParamsDef = this._getAwsParamsFromDefinition(paramsDefinition,{overwrite:true});
		let prom = Promise.resolve();
		Object.getOwnPropertyNames(awsParamsDef).forEach((paramName)=>{
			prom = prom
				.then(()=>{
					return BackoffUtils.exponentialBackoff(
						//backoff function
						(opts)=>{//eslint-disable-line
							return this.putParameter(awsParamsDef[paramName])
								.then(createResponse=>{
									return createResponse;
								})
								.catch(e=>{
									if(e.code === 'ThrottlingException'){
										return false; //backoff and try again
									}
									else{
										return Promise.reject(e);
									}
								});
						},
						500, //use a delay of 0.5 seconds
						50, //give up after 50 times
						30000 //dont delay any more than 30 seconds
					);
				});
		});
		return prom;
	}
	/**
	 * Delete one or more parameters
	 * @param {String} paramName - A parameter name to be deleted.
	 */
	delete(paramName){
		if(_.isString(paramName)){
			return this.deleteParameter({Name: paramName});
		}
	}
	/**
	 * Delete multiple parameters
	 * @param {Array.<String>} paramNames - An array of parameter names to be deleted.
	 */
	deleteMultiple(paramNames){
		if(_.isArray(paramNames)){
			// the aws SDK limits the bulk delete to 10
			let chunksOfTen = paramNames.reduce((chunks, el, i) => {
				if (i % 10 === 0) {
					chunks.push([el]);
				} 
				else {
					chunks[chunks.length - 1].push(el);
				}
				return chunks;
			}, []);

			let deleted = [];

			let prom = Promise.resolve();
			chunksOfTen.forEach((chunk)=>{
				prom = prom
					.then(()=>{
						return BackoffUtils.exponentialBackoff(
							//backoff function
							(opts)=>{//eslint-disable-line
								return this.deleteParameters({Names: chunk})
									.then((deleteResponse)=>{
										deleted = deleted.concat(deleteResponse.DeletedParameters);
										return deleted;
									});
							},
							500, //use a delay of 0.5 seconds
							50, //give up after 50 times
							30000 //dont delay any more than 30 seconds
						);
					});
			});
			return prom;
		}
	}
	/**
	 * Retireve the parameter or reject if not found.
	 * @param {String} paramName - A parameter name to be retrieved.
	 */
	retrieve(paramName){
		return this.getParameter({Name: paramName})
			.then((getResponse)=>{
				return getResponse.Parameter;
			});
	}
	/**
	 * Retrieve as many of these parameters as possible "Best Effort".
	 * @param {Array.<String>} paramNames - An array of parameter names to be retrieved.
	 */
	retrieveMultiple(paramNames){
		return this.getParameters({Names: paramNames})
			.then((getResponse)=>{
				return getResponse.Parameters;
			});
	}
	retrieveAllByPath(path,opts={recursive:false, withDecryption:false}){
		let nextToken = undefined;
		let found = [];
		let retrieveNext = ()=>{
			return Promise.resolve()
				.then(()=>{
					return this.getParametersByPath({Path: path, Recursive: opts.recursive, WithDecryption: opts.withDecryption, NextToken: nextToken});
				})
				.then((result)=>{
					found = found.concat(result.Parameters);
					if(result.NextToken){
						nextToken = result.NextToken;
						return retrieveNext();
					}
					else{
						return found;
					}
				});
		};
		return retrieveNext();
	}
}
module.exports=ParameterStore;