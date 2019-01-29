'use strict';
//This is required before aws-sdk is "required" to pull the config/credentials from the ~/.aws/credentials & ~/.aws/config files.
process.env.AWS_SDK_LOAD_CONFIG = true;
const AWS = require('aws-sdk');

const EventEmitter = require('events');
const _ = require('lodash');
const uuid = require('uuid');

class AwsBase extends EventEmitter{
	constructor(awsConfig) {
		super();
		this._awsSdk = AWS;
		this._uuid = uuid;
		
		//load the aws config
		this.loadAwsConfig(awsConfig);
	}
	/*************************************************************/
	/* START AWS CONFIG METHODS */
	/*************************************************************/
	_getDefaultConfig() {
		let defaultConfig = {
			region: undefined,
			credentials: {
				accessKeyId: undefined,
				secretAccessKey: undefined
			}
		};
		return defaultConfig;
	}
	_loadConfigFromAwsUserConfig() {
		if(!this._defaultAwsUserConfig){
			var credentials = new AWS.SharedIniFileCredentials();
			AWS.config.credentials = credentials;
			this._defaultAwsUserConfig = {
				region: this._awsSdk.config.region,
				credentials: {
					accessKeyId: credentials.accessKeyId,
					secretAccessKey: credentials.secretAccessKey
				}
			};
		}
		return this._defaultAwsUserConfig;
	}
	_loadConfigFromEnvironment() {
		let configFromEnv = {
			region: process.env.AWS_REGION,
			credentials: {
				accessKeyId: process.env.AWS_ACCESS_KEY_ID,
				secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
			}
		};
		return configFromEnv;
	}
	/**
	 * @typedef AwsServiceConfiguration
	 * @type Object
	 * @property region {String} - The aws region that will be affected.
	 */
	/**
	 * Load all the aws configuration and credentials.
	 * @param config {AwsServiceConfiguration} - The aws sdk service configuration object.
	 * @returns {AwsServiceConfiguration} the fully loaded aws sdk service configuration object.
	 */
	loadAwsConfig(config) {
		let defaultConfig = this._getDefaultConfig();
		let configFromEnvironment = this._loadConfigFromEnvironment();
		let awsUserConfig =this._loadConfigFromAwsUserConfig();
		this._loadedAwsConfig = _.merge({},defaultConfig, awsUserConfig, configFromEnvironment, config);
		//load the AWS config
		this._awsSdk.config.update(this._loadedAwsConfig);
		return this._loadedAwsConfig;
	}
	getLoadedConfig(){
		return this._loadedAwsConfig;
	}
	/*************************************************************/
	/* END AWS CONFIG METHODS */
	/* START MISC UTILS */
	/*************************************************************/
	/**
	 * @typedef {TagObject}
	 * @type {object}
	 * @property {string} Key - The tag name
	 * @property {string} Value - The tag value
	 */
	/**
	 * Normalize the Tags to be used with AWS APIs.
	 * @param {Array.<TagObject>|Object} tagsIn - Either an array of objects with Key and Value properties or an Object where the property is the key and the property value is the key value.
	 * @returns {Array.<TagObject>} The normalized tag array.
	 */
	normalizeTags(tagsIn){
		let tagsArray = [];
		if(_.isPlainObject(tagsIn)){
			Object.keys(tagsIn).forEach((key)=>{
				let tagObj = {
					Key: key,
					Value: tagsIn[key]
				};
				tagsArray.push(tagObj);
			});
		}
		else if(_.isArray(tagsIn)){
			let valid = tagsIn.every((tagObj)=>{
				if(_.isPlainObject(tagObj) && tagObj.hasOwnProperty('Key') && tagObj.hasOwnProperty('Value')){
					return true;
				}
				else{
					return false;
				}
			});
			if(!valid){
				let err = new Error('A malformed tags object was provided');
				err.malformedTagsObject = tagsIn;
				throw err;
			}
			else{
				tagsArray = tagsIn;
			}
		}
		else{
			let err = new Error('A tags object was provided of an unknown type');
			err.malformedTagsObject = tagsIn;
			throw err;
		}
		return tagsArray;
	}
	/*************************************************************/
	/* END MISC UTILS */
	/*************************************************************/
}
module.exports = AwsBase;