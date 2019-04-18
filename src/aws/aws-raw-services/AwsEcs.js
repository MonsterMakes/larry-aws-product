'use strict';

const AwsBase = require('../AwsBase');

class AwsEcs extends AwsBase {
	constructor(awsConfig) {
		super(awsConfig);
		this._awsEcsSdk = new this._awsSdk.ECS();
	}
	/**
	 * For more information see the aws SDK docs https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ECS.html#registerTaskDefinition-property.
	 * @param {Object} request - A request object see above link for more info.
	 */
	_registerTaskDefinition(request={}){
		return new Promise((resolve, reject) => {
			this._awsEcsSdk.registerTaskDefinition(request, (err, data) => {
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
	 * For more information see the aws SDK docs https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ECS.html#describeTaskDefinition-property.
	 * @param {Object} request - A request object see above link for more info.
	 */
	_describeTaskDefinition(request={}){
		return new Promise((resolve, reject) => {
			this._awsEcsSdk.describeTaskDefinition(request, (err, data) => {
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
	 * For more information see the aws SDK docs https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ECS.html#stopTask-property.
	 * @param {Object} request - A request object see above link for more info.
	 */
	_stopTask(request={}){
		return new Promise((resolve, reject) => {
			this._awsEcsSdk.stopTask(request, (err, data) => {
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
	 * For more information see the aws SDK docs https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ECS.html#describeServices-property.
	 * @param {Object} request - A request object see above link for more info.
	 */
	_describeServices(request={}){
		return new Promise((resolve, reject) => {
			this._awsEcsSdk.describeServices(request, (err, data) => {
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
	 * For more information see the aws SDK docs https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ECS.html#updateService-property
	 * @param {Object} request - A request object see above link for more info.
	 */
	_updateService(request={}){
		return new Promise((resolve, reject) => {
			this._awsEcsSdk.updateService(request, (err, data) => {
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
module.exports = AwsEcs;