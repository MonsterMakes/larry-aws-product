'use strict';
const CliModule = require('@monstermakes/larry-cli').CliModule;

class AwsCliModule extends CliModule {
	constructor(vorpalInstance){
		super(vorpalInstance);
		this._init();
	}
	_init(){
		this.$prompt = this._vorpalInstance.chalk.blue('larry-aws>');
		for (const [actionName, actionClass] of Object.entries(LarryScaffoldsIndex.cliActions.aws)) { //eslint-disable-line
			this._vorpalInstance.use((vi) => {
				let inst = new actionClass(vi); // eslint-disable-line
			});
		}
	}
}
module.exports=AwsCliModule;
const LarryScaffoldsIndex = require('../../index');