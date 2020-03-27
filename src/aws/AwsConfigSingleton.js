'use strict';

const namespace = 'larry-aws-product.aws-config-singleton';
const SINGLETON_KEY = Symbol.for(namespace);
const globalSpace = global;
const globalSymbols = Object.getOwnPropertySymbols(globalSpace);
const EventEmitter = require('events');

//***NOTE*** This is required before aws-sdk is "required" to pull the config/credentials from the ~/.aws/credentials & ~/.aws/config files.
process.env.AWS_SDK_LOAD_CONFIG=true;
const AWS = require('aws-sdk');

class AwsConfigSingleton extends EventEmitter{
	constructor() {
		super();
		this._awsSdk = AWS;
		this.loadAwsConfig();
	}
	static retreiveAwsConfig(config={profile:undefined,region:undefined,credentials:{accessKeyId:undefined, secretAccessKey:undefined, sessionToken:undefined}}) {
		if(config.profile){
			process.env.AWS_PROFILE=config.profile;
		}
		let credentials = new AWS.SharedIniFileCredentials({profile: config.profile, accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey, sessionToken: config.sessionToken});
		return new AWS.Config({profile: config.profile, credentials, region: config.region});

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
	loadAwsConfig(config={profile:undefined,region:undefined,credentials:{accessKeyId:undefined, secretAccessKey:undefined, sessionToken:undefined}}) {
		this._awsSdk.config = AwsConfigSingleton.retreiveAwsConfig(config);
	}
	getLoadedConfig(){
		return this._awsSdk.config;
	}
	printConnectionDetails(){
		return JSON.stringify({
			profile: this._awsSdk.config.credentials.profile,
			region: this._awsSdk.config.region
		},null,'\t');
	}
	getAwsSdk(){
		return this._awsSdk;
	}
}

//If this is the first time go ahead and create the symbol.
if (globalSymbols.indexOf(SINGLETON_KEY) === -1){
	globalSpace[SINGLETON_KEY] = new AwsConfigSingleton;
}
module.exports= globalSpace[SINGLETON_KEY];