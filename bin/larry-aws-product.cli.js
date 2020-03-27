#!/usr/bin/env node
const LarryCli = require('@monstermakes/larry-cli').LarryCli;
const LarryIndex = require('../index');
const EnvironmentCliModule = LarryIndex.cliModules.Environment;

let registy = {
	'larry-env': EnvironmentCliModule
};
let cli = new LarryCli(registy,{prompt: 'larry-aws-product>'});

//Use Scafolds CliModule
cli.run();
if(cli.interactiveMode){
	cli.launchSubCli('larry-env');
}