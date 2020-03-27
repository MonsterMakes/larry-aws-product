'use strict';
//This is required before aws-sdk is "required" to pull the config/credentials from the ~/.aws/credentials & ~/.aws/config files.
process.env.AWS_SDK_LOAD_CONFIG=true;
const AWS = require('aws-sdk');

const EventEmitter = require('events');
const _ = require('lodash');

class AwsBase extends EventEmitter{
	constructor(awsConfig={profile:undefined,region:undefined,credentials:{accessKeyId:undefined, secretAccessKey:undefined, sessionToken:undefined}}) {
		super();
		this._awsSdk = AWS;
		
		//load the aws config
		this.loadAwsConfig(awsConfig);
	}
	static retreiveAwsConfig(config={profile:undefined,region:undefined,credentials:{accessKeyId:undefined, secretAccessKey:undefined, sessionToken:undefined}}) {
		if(config.profile){
			process.env.AWS_PROFILE=config.profile;
		}
		let credentials = new AWS.SharedIniFileCredentials({profile: config.profile, accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey, sessionToken: config.sessionToken});
		return new AWS.Config({profile: config.profile, credentials, region: config.region});

	}
	/*************************************************************/
	/* START AWS CONFIG METHODS */
	/*************************************************************/
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
	loadAwsConfig(config={profile:undefined,region:undefined,credentials:{accessKeyId:undefined, secretAccessKey:undefined, sessionToken:undefined}}) {
		this._awsSdk.config = AwsBase.retreiveAwsConfig(config);
		// if(config.region){
		// 	this._awsSdk.config.region = config.region;
		// }
	}
	getLoadedConfig(){
		return this._awsSdk.config;
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