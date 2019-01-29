'use strict';

const AwsBase = require('../AwsBase');

class AwsCloudFormation extends AwsBase {
	constructor(awsConfig) {
		super(awsConfig);
		this._awsCloudFormationSdk = new this._awsSdk.CloudFormation();
	}
	/**
	 * For more information see the aws SDK docs https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CloudFormation.html#validateTemplate-property.
	 * @param {Object} params - An object that defines the cloudformation template to be validated.
	 * @param {String} params.TemplateBody - Structure containing the template body with a minimum length of 1 byte and a maximum length of 51,200 bytes. For more information, go to Template Anatomy in the AWS CloudFormation User Guide.
	 * @param {String} params.TemplateURL - Location of file containing the template body. The URL must point to a template (max size: 460,800 bytes) that is located in an Amazon S3 bucket. For more information, go to Template Anatomy in the AWS CloudFormation User Guide.
	 */
	validateTemplate(params={}){
		return new Promise((resolve, reject) => {
			this._awsCloudFormationSdk.validateTemplate(params, (err, data) => {
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
	 * For more information see the aws SDK docs https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CloudFormation.html#getTemplateSummary-property.
	 * @param {Object} params - An object that defines the cloudformation template to be validated.
	 * @param {String} params.TemplateBody - Structure containing the template body with a minimum length of 1 byte and a maximum length of 51,200 bytes. For more information, go to Template Anatomy in the AWS CloudFormation User Guide.
	 * @param {String} params.TemplateURL - Location of file containing the template body. The URL must point to a template (max size: 460,800 bytes) that is located in an Amazon S3 bucket. For more information, go to Template Anatomy in the AWS CloudFormation User Guide.
	 * @param {String} params.StackName - The name or the stack ID that is associated with the stack, which are not always interchangeable. For running stacks, you can specify either the stack's name or its unique stack ID. For deleted stack, you must specify the unique stack ID.
	 * @param {String} params.StackSetName — The name or unique ID of the stack set from which the stack was created.
	 */
	getTemplateSummary(params={}){
		return new Promise((resolve, reject) => {
			this._awsCloudFormationSdk.getTemplateSummary(params, (err, data) => {
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
	 * @typedef CfTag
	 * @type {Object}
	 * @property {String} Key - A string used to identify this tag. You can specify a maximum of 128 characters for a tag key. Tags owned by Amazon Web Services (AWS) have the reserved prefix: aws:.
	 * @property {String} Value - A string containing the value for this tag. You can specify a maximum of 256 characters for a tag value.
	 */
	/**
	 * @typedef CfParameter
	 * @type {Object}
	 * @property {String} ParameterKey - The key associated with the parameter. If you don't specify a key and value for a particular parameter, AWS CloudFormation uses the default value that is specified in your template.
	 * @property {String} ParameterValue - The input value associated with the parameter
	 */
	/**
	 * For more information see the aws SDK docs https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CloudFormation.html#createStack-property.
	 * @param {Object} params - An object that defines the cloudformation template to be validated.
	 * @param {String} params.TemplateBody - Structure containing the template body with a minimum length of 1 byte and a maximum length of 51,200 bytes. For more information, go to Template Anatomy in the AWS CloudFormation User Guide.
	 * @param {String} params.TemplateURL - Location of file containing the template body. The URL must point to a template (max size: 460,800 bytes) that is located in an Amazon S3 bucket. For more information, go to Template Anatomy in the AWS CloudFormation User Guide.
	 * @param {String} params.StackName - The name that is associated with the stack. The name must be unique in the region in which you are creating the stack.
	 * @param {Array.<CfParameter>} params.Parameters - A list of Parameter structures that specify input parameters for the stack. For more information, see the Parameter data type.
	 * @param {Array.<String>} params.Capabilities - In some cases, you must explicity acknowledge that your stack template contains certain capabilities in order for AWS CloudFormation to create the stack. Example (CAPABILITY_IAM or CAPABILITY_NAMED_IAM) 
	 * @param {Array.<CfTag>} Tags - Key-value pairs to associate with this stack. AWS CloudFormation also propagates these tags to the resources created in the stack. A maximum number of 50 tags can be specified.
	 */
	createStack(params={}){
		return new Promise((resolve, reject) => {
			this._awsCloudFormationSdk.createStack(params, (err, data) => {
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
	 * For more information see the aws SDK docs https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CloudFormation.html#describeStacks-property.
	 * @param {Object} params - An object that defines the cloudformation template to be validated.
	 * @param {String} params.StackName - The name or the unique stack ID that is associated with the stack, which are not always interchangeable:
	 * 		Running stacks: You can specify either the stack's name or its unique stack ID.
	 * 		Deleted stacks: You must specify the unique stack ID.
	 * @param {String} params.NextToken - A string that identifies the next page of stacks that you want to retrieve.
	 */
	describeStacks(params={}){
		return new Promise((resolve, reject) => {
			this._awsCloudFormationSdk.describeStacks(params, (err, data) => {
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
	 * For more information see the aws SDK docs https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CloudFormation.html#deleteStack-property.
	 * @param {Object} params - An object that defines the cloudformation template to be validated.
	 * @param {String} params.StackName - The name or the unique stack ID that is associated with the stack, which are not always interchangeable:
	 * @param {String} params.RetainResources - For stacks in the DELETE_FAILED state, a list of resource logical IDs that are associated with the resources you want to retain. During deletion, AWS CloudFormation deletes the stack but does not delete the retained resources. Retaining resources is useful when you cannot delete a resource, such as a non-empty S3 bucket, but you want to delete the stack.
	 */
	deleteStack(params={}){
		return new Promise((resolve, reject) => {
			this._awsCloudFormationSdk.deleteStack(params, (err, data) => {
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
module.exports = AwsCloudFormation;