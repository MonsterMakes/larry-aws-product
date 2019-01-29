#!/usr/bin/env node
const LarryCli = require('@monstermakes/larry-cli').LarryCli;
const LarryIndex = require('../index');
const AwsCliModule = LarryIndex.cliModules.Aws;

let registy = {
	aws: AwsCliModule
};
let cli = new LarryCli(registy,{prompt: 'larry-aws-product>'});

//Use Scafolds CliModule
cli.run();
if(cli.interactiveMode){
	cli.launchSubCli('aws');
}