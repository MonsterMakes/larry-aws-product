'use strict';
const _ = require('lodash');
const AwsParameterStore = require('../aws-raw-services/AwsSystemsManager');
const BackoffUtils = require('../../util/BackoffUtils');

class ParameterStore extends AwsParameterStore {
	constructor(awsConfig) {
		super(awsConfig);
	}
	_getAwsTagsFromPlainObject(tagsObj){
		let awsTags = [];
		if(_.isObject(tagsObj)){
			Object.keys(tagsObj).forEach((tagName)=>{
				awsTags.push({
					Key: tagName,
					Value: tagsObj[tagName]
				});
			});
		}
		return awsTags;
	}
	_getAwsParamsFromDefinition(paramsDefinition,opts={overwrite:true,tags:undefined}){
		let awsParams = {};
		
		if(_.isObject(paramsDefinition)){
			Object.keys(paramsDefinition).forEach((pDef)=>{
				if(_.isPlainObject(paramsDefinition[pDef])){
					let tags = this._getAwsTagsFromPlainObject(_.merge({},opts.tags,paramsDefinition[pDef].tags));
					awsParams[pDef] = _.merge(
						{},
						{
							Type: paramsDefinition[pDef].type || 'String',
							Name: paramsDefinition[pDef].name || pDef,  //hidden feature for complex names
							Overwrite: paramsDefinition[pDef].overwrite || opts.overwrite, //hidden feature for complex use cases
							Description: paramsDefinition[pDef].description || '',
							Tags: tags //hidden feature for param specific tags (dont see a use case at this point but supported as a hidden feature)
						},
						paramsDefinition[pDef]
					);
				}
				else if(_.isString(paramsDefinition[pDef])){
					awsParams[pDef] = {
						Type: 'String',
						Name: pDef,
						Value: paramsDefinition[pDef],
						Overwrite: opts.overwrite,
						Tags: this._getAwsTagsFromPlainObject(opts.tags)
					};
				}
				else{
					throw new Error(`Invalid Parameter Definition (${pDef}) must be either a string or an object defining the AWS parameter.`);
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
	 * Create parameters
	 * @param {Object<String,ParamsObjectDefinition|String} paramsDefinition - An object where the keys are the parameter names and the values can either be a string or a complex object describing parameter attributes in addition to just value.
	 * @param {Object<String,String>} [tags={}] - A set of tags to apply to all parameters. Each property/value in the object will create a tag where the property name is used as the tag name and the value will be used as the tag value.
	 */
	create(paramsDefinition,tags={}){
		//TODO would it be better to do an all or nothing (in the case that some of these parameters already exist)
		// more specifically this code will leave params around maybe they should be cleaned up
		let awsParamsDef = this._getAwsParamsFromDefinition(paramsDefinition,{tags,overwrite:false});
		let prom = Promise.resolve();
		Object.keys(awsParamsDef).forEach((paramName)=>{
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
									if(e){
										return false; //backoff and try again
									}
								});
						},
						500, //use a delay of 0.5 seconds
						50, //give up after 50 times
						30000 //dont delay any more than 30 seconds
					);
				})
				.catch(e=>{
					if(e.code === 'ParameterAlreadyExists'){
						let err = new Error(`Parameter (${paramName}) already exists and cannot be created, try using update() instead.`);
						err.originalError = e;
						return Promise.reject(err);
					}
					else{
						return Promise.reject(e);
					}
				});
		});
		return prom;
	}
	/**
	 * Create or update parameters
	 * @param {Object<String,ParamsObjectDefinition|String} paramsDefinition - An object where the keys are the parameter names and the values can either be a string or a complex object describing parameter attributes in addition to just value.
	 * @param {Object<String,String>} [tags={}] - A set of tags to apply to all parameters. Each property/value in the object will create a tag where the property name is used as the tag name and the value will be used as the tag value.
	 */
	upsert(paramsDefinition,tags={}){
		let awsParamsDef = this._getAwsParamsFromDefinition(paramsDefinition,{tags,overwrite:true});
		let prom = Promise.resolve();
		Object.keys(awsParamsDef).forEach((paramName)=>{
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
									if(e){
										return false; //backoff and try again
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
	//TODO
	//upsertParameter
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
		return this.getParameters({Names: paramNames});
	}
	retrieveAllByPath(path){
		let nextToken = undefined;
		let found = [];
		let retrieveNext = ()=>{
			return Promise.resolve()
				.then(()=>{
					return this.getParametersByPath({Path: path, NextToken: nextToken});
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