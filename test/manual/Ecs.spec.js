'use strict';
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const should = chai.should();//eslint-disable-line
const expect = chai.expect;//eslint-disable-line

const TEST_NAME = 'Test ECS Service';
const Ecs = require('../../src/aws/services/Ecs');


/***********************************************************/
/***********************************************************/
/* CHANGE THESE SETTINGS IN YOUR ENVIRONMENT*/
/***********************************************************/
/***********************************************************/
const CLUSTER_NAME = process.env.CLUSTER_NAME;
const REGION = process.env.REGION;
const SERVICE_NAME = process.env.SERVICE_NAME;
const CONTAINER_NAME = process.env.CONTAINER_NAME;
const CONTAINER_VERSION = process.env.CONTAINER_VERSION;
/***********************************************************/
/***********************************************************/
/***********************************************************/

const ecs = new Ecs({region:REGION});

describe(TEST_NAME, () => {
	before(() => {
		console.log('-------------------------------------------------------');//eslint-disable-line
		console.log('TESTS RUNNING USING:');//eslint-disable-line
		console.log(JSON.stringify(ecs.getLoadedConfig()));//eslint-disable-line
		console.log('-------------------------------------------------------');//eslint-disable-line
	});
	it('should retrieve running service', ()=>{
		return ecs._retrieveService(CLUSTER_NAME,SERVICE_NAME)
			.then((results)=>{
				results.should.exist;
			});
	});
	it('should reject retrieval of missing service', ()=>{
		let prom = ecs._retrieveService(CLUSTER_NAME,'not-here-bro');

		return prom.should.be.rejected;
	});
	it('should retrieve running service\'s taskDefinition and update the container versions', ()=>{
		let containerVersions = {};
		let newTask, task = null;
		containerVersions[CONTAINER_NAME] = CONTAINER_VERSION;
		return Promise.resolve()
			.then(()=>{
				return ecs._retrieveService(CLUSTER_NAME,SERVICE_NAME);
			})
			.then((serviceResponse)=>{
				return ecs._describeTaskDefinition({
					taskDefinition: serviceResponse.taskDefinition
				});
			})
			.then((taskDefinitionResponse)=>{
				task = taskDefinitionResponse.taskDefinition;
				return ecs._retrieveTaskDefinitionWithUpdatedContainerVersions(task,containerVersions);
			})
			.then((newTaskDefinition)=>{
				newTask = newTaskDefinition;
				task.should.exist;
				newTask.should.exist;
				task.should.not.eql(newTask);
			});
	});
	it('should bump the versions',()=>{
		let containerVersions = {};
		containerVersions[CONTAINER_NAME] = CONTAINER_VERSION;
		return Promise.resolve()
			.then(()=>{
				return ecs.bumpServiceContainerVersions(CLUSTER_NAME,SERVICE_NAME,containerVersions);
			});
			
	});
	it('should bump the task cpu and mem',()=>{
		let containerVersions = {};
		containerVersions[CONTAINER_NAME] = CONTAINER_VERSION;
		return Promise.resolve()
			.then(()=>{
				return ecs.bumpServiceTaskCpuMem(CLUSTER_NAME,SERVICE_NAME,1024,2048);
			});
			
	});
	it.only('should bump the desired Task Count',()=>{
		let containerVersions = {};
		containerVersions[CONTAINER_NAME] = CONTAINER_VERSION;
		return Promise.resolve()
			.then(()=>{
				return ecs.bumpServiceDesiredTaskCount(CLUSTER_NAME,SERVICE_NAME,3);
			});
			
	});
});