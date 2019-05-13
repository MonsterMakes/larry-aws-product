'use strict';

const AwsEcs = require('../aws-raw-services/AwsEcs');
const _ = require('lodash');
// const BackoffUtils = require('../../util/BackoffUtils');

class Ecs extends AwsEcs {
	constructor(awsConfig) {
		super(awsConfig);
	}
	/**
	 * Retireve the service or reject if not found.
	 * @param {String} clusterName - The name of the cluster the service to be retrieved belongs to.
	 * @param {String} serviceName - The name of the service to be retrieved.
	 */
	_retrieveService(clusterName,serviceName){
		return Promise.resolve()
			.then(()=>{
				return this._describeServices({
					services: [ serviceName ],
					cluster: clusterName
				});
			})
			.then((response)=>{
				if(_.isEmpty(response.failures)){
					return response.services[0];
				}
				else{
					return Promise.reject(response.failures[0]);
				}
			});
	}
	/**
	 * Mutates the taskDefinition's containerDefinitions 
	 * @param {TaskDefinition} taskDefinition - the actual taskDefinition object to be mutated
	 * @param {Object} upgradeDetails = Object where the keys are the container name to alter. If the value is a string that is used as the new container image version. If value is an object it will be merged into the definition.
	 */
	_mutateTaskDefinitionsContainerDetails(taskDefinition,upgradeDetails){
		let containerDefinitions = [];
		//Lop through the container definitions and update them
		taskDefinition.containerDefinitions.forEach(containerDef => {
			if(upgradeDetails.hasOwnProperty(containerDef.name)){
				let containerDefinitionUpgradeDetails = upgradeDetails[containerDef.name];
				//allows for string (just changing the version) or object changing other settings like cpu/mem
				if(_.isString(containerDefinitionUpgradeDetails)){
					containerDefinitionUpgradeDetails = {version: containerDefinitionUpgradeDetails};
				}
				let newContainerDef = _.cloneDeep(containerDef);
				//if we are upgrading the version
				if(containerDefinitionUpgradeDetails.version){
					let image = containerDef.image;
					let repo = image.split(':')[0];
					let newContainerImageAndVersion = repo + ':' + containerDefinitionUpgradeDetails.version;
					newContainerDef.image = newContainerImageAndVersion;
				}
				//merge any other settings
				_.merge(newContainerDef,containerDefinitionUpgradeDetails);
				//remove version this is not apart of the
				delete newContainerDef.version;
				
				containerDefinitions.push(newContainerDef);
			}
			else{
				containerDefinitions.push(containerDef);
			}
		});
		taskDefinition.containerDefinitions = containerDefinitions;
		return taskDefinition;
	}
	/**
	 * Mutates the taskDefinition's cpu and mem 
	 * @param {TaskDefinition} taskDefinition - the actual taskDefinition object to be mutated
	 * @param {integer} cpu - The number of cpu units to use for the task see https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html#task_size
	 * @param {integer} mem - The amount of memory in MiB to use for the task, see https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html#task_size
	 */
	_mutateTaskDefinitionsCpuMem(taskDefinition,cpu,mem){
		taskDefinition.cpu = cpu.toString();
		taskDefinition.memory = mem.toString();
		return taskDefinition;
	}
	_retrieveUpdatedTaskDefinition(taskDefinition,updateDetails={}){
		let newTaskDef = _.cloneDeep(taskDefinition);
		if(updateDetails.containerDetails){
			this._mutateTaskDefinitionsContainerDetails(newTaskDef,updateDetails.containerDetails);
		}
		if(updateDetails.taskCpu || updateDetails.taskMem){
			this._mutateTaskDefinitionsCpuMem(newTaskDef,updateDetails.taskCpu,updateDetails.taskMem);
		}
		return newTaskDef;
	}
	upgradeService(clusterName,serviceName,upgradeDetails={},opts={}){
		let service = null;

		return Promise.resolve()
			.then(()=>{
				return this._retrieveService(clusterName,serviceName);
			})
			.then((serviceResponse)=>{
				service = serviceResponse;
				return this._describeTaskDefinition({
					taskDefinition: serviceResponse.taskDefinition
				});
			})
			.then((taskDefinitionResponse)=>{
				return this._retrieveUpdatedTaskDefinition(taskDefinitionResponse.taskDefinition,upgradeDetails.taskDefinition);
			})
			.then((newTaskDefinition)=>{
				delete newTaskDefinition.taskDefinitionArn;
				delete newTaskDefinition.revision;
				delete newTaskDefinition.status;
				delete newTaskDefinition.requiresAttributes;
				delete newTaskDefinition.compatibilities;
				return this._registerTaskDefinition(newTaskDefinition);
			})
			//update service
			.then((registrationResults)=>{
				//if a new desiredCount is specified use it otherwise use the existing value.
				let desiredCount = _.get(upgradeDetails,'desiredTaskCount',service.desiredCount);
				return this._updateService({
					forceNewDeployment: opts.forceNewDeployment,
					cluster: clusterName,
					service: serviceName,
					taskDefinition: registrationResults.taskDefinition.taskDefinitionArn,
					networkConfiguration: service.networkConfiguration,
					platformVersion: service.platformVersion,
					healthCheckGracePeriodSeconds: service.healthCheckGracePeriodSeconds,
					desiredCount: desiredCount
				});
			});
	}
	bumpServiceContainerVersions(clusterName,serviceName,containerUpgradeDetails,forceNewDeployment=true){
		return this.upgradeService(clusterName,serviceName,{taskDefinition:{containerDetails:containerUpgradeDetails}},{forceNewDeployment});
	}
	bumpServiceTaskCpuMem(clusterName,serviceName,cpu,mem,forceNewDeployment=true){
		return this.upgradeService(clusterName,serviceName,{taskDefinition:{taskCpu:cpu,taskMem:mem}},{forceNewDeployment});
	}
	bumpServiceDesiredTaskCount(clusterName,serviceName,desiredTaskCount,forceNewDeployment=true){
		return this.upgradeService(clusterName,serviceName,{desiredTaskCount},{forceNewDeployment});
	}
}
module.exports = Ecs;