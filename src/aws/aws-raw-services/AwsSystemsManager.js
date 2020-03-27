'use strict';

const AwsBase = require('../AwsBase');

class AwsSystemsManager extends AwsBase {
	constructor(awsConfig) {
		super(awsConfig);
		this._awsSystemsManagerSdk = new this._awsSdk.SSM();
	}
	/**
	 * For more information see the aws SDK docs https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SSM.html#putParameter-property
	 * @param {Object} params - The params request object
	 * @param {String} params.Name - The fully qualified name of the parameter that you want to add to the system
	 * @param {('String' | 'StringList' | 'SecureString')} params.Type - The type of parameter that you want to add to the system.
	 * @param {String} params.Description - Information about the parameter that you want to add to the system. Optional but recommended.
	 * @param {String} params.Value - The parameter value that you want to add to the system.
	 * @param {Boolean} [params.Overwrite=false] - Overwrite an existing parameter. If not specified, will default to "false".
	 * @param {Array.<{Key: String, Value: String}>} Tags - Tags enable you to categorize a resource in different ways, using name/value pairs
	 */
	putParameter(params={}){
		return new Promise((resolve, reject) => {
			this._awsSystemsManagerSdk.putParameter(params, (err, data) => {
				if (err) {
					reject(err);
				}
				else {
					resolve(data);
				}
			});
		});
	}
	/**
	 * For more information see the aws SDK docs https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SSM.html#deleteParameter-property
	 * @param {Object} params - The params request object
	 * @param {String} params.Name - The name of the parameter to be deleted
	 */
	deleteParameter(params={}){
		return new Promise((resolve, reject) => {
			this._awsSystemsManagerSdk.deleteParameter(params, (err, data) => {
				if (err) {
					reject(err);
				}
				else {
					resolve(data);
				}
			});
		});
	}
	/**
	 * For more information see the aws SDK docs https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SSM.html#deleteParameters-property
	 * @param {Object} params - The params request object
	 * @param {Array.<String>} params.Name - The name of the parameter to retrieve
	 */
	deleteParameters(params={}){
		return new Promise((resolve, reject) => {
			this._awsSystemsManagerSdk.deleteParameters(params, (err, data) => {
				if (err) {
					reject(err);
				}
				else {
					resolve(data);
				}
			});
		});
	}
	/**
	 * For more information see the aws SDK docs https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SSM.html#deleteParameters-property
	 * @param {Object} params - The params request object
	 * @param {Array.<String>} params.Name - The names of parameter to retrieve
	 */
	getParameter(params={}){
		return new Promise((resolve, reject) => {
			this._awsSystemsManagerSdk.getParameter(params, (err, data) => {
				if (err) {
					reject(err);
				}
				else {
					resolve(data);
				}
			});
		});
	}
	/**
	 * For more information see the aws SDK docs https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SSM.html#deleteParameters-property
	 * @param {Object} params - The params request object
	 * @param {Array.<String>} params.Names - An array of the names of parameters to be deleted
	 */
	getParameters(params={}){
		return new Promise((resolve, reject) => {
			this._awsSystemsManagerSdk.getParameters(params, (err, data) => {
				if (err) {
					reject(err);
				}
				else {
					resolve(data);
				}
			});
		});
	}
	/**
	 * For more information see the aws SDK docs https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SSM.html#getParametersByPath-property
	 * @param {Object} params - The params request object
	 * @param {Array.<String>} params.Path - Root path of the parameters to be retrieved.
	 * @param {String} params.NextToken - A token to start the list. Use this token to get the next set of results.
	 */
	getParametersByPath(params={}){
		return new Promise((resolve, reject) => {
			this._awsSystemsManagerSdk.getParametersByPath(params, (err, data) => {
				if (err) {
					reject(err);
				}
				else {
					resolve(data);
				}
			});
		});
	}
}
module.exports = AwsSystemsManager;