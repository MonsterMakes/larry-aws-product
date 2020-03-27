'use strict';
const chai = require('chai');
const should = chai.should(); // eslint-disable-line 
const expect = chai.expect; // eslint-disable-line 

const TEST_NAME = 'CloudFormation spec';
const CloudFormation = require('../../../src/aws/services/CloudFormation');

const CF_TEMPLATE_STRINGS = {
	ALL_THE_TYPES:
`
Parameters:
  Environment:
    Description: Environment Name
    Type: String
  VpcCIDR:
    Description: VPC CIDR
    Type: String
    Default: 172.19.0.0/16
  DatabaseCount:
    Type: Number
  NodeCount:
    Type: Number
    Default: 1
  Encrypted:
    Type: String
    Default: true
    AllowedValues:
      - true
      - false
  Password:
    Type: String
    NoEcho: true
  Username:
    Type: String
    Default: 'usprod'
    NoEcho: true

Resources:
    InternetGateway:
      Type: AWS::EC2::InternetGateway  
`,
	ALL_THE_SSM_TYPES:
`
Parameters:
  Environment:
    Description: Environment Name
    Type: AWS::SSM::Parameter::Value<String>
  VpcCIDR:
    Description: VPC CIDR
    Type: AWS::SSM::Parameter::Value<String>
    Default: 172.19.0.0/16
  DatabaseCount:
    Type: AWS::SSM::Parameter::Value<Number>
  NodeCount:
    Type: AWS::SSM::Parameter::Value<Number>
    Default: 1
  Encrypted:
    Type: AWS::SSM::Parameter::Value<String>
    Default: true
    AllowedValues:
      - true
      - false
  Password:
    Type: AWS::SSM::Parameter::Value<String>
    NoEcho: true
  Username:
    Type: AWS::SSM::Parameter::Value<String>
    Default: 'usprod'
    NoEcho: true

Resources:
    InternetGateway:
      Type: AWS::EC2::InternetGateway  
`,
	VALID_NO_PARAMS:
`
Description:
  Valid CF Template with no params.

Resources:
  InternetGateway:
    Type: AWS::EC2::InternetGateway
`,
	VALID_VPC:
`
AWSTemplateFormatVersion: 2010-09-09
#----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
# This template will:
#   Create a 
#   - VPC
#----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Description:
  The vpc.

Parameters:
  EnvironmentName:
    Description: Environment Name
    Type: String
    AllowedPattern: ^[0-9a-z-]*$s
  VpcCIDR:
    Description: VPC CIDR
    Type: String
    Default: 10.10.0.0/16
  NumberOfSubnets:
    Description: Number of Subnets to create
    Type: String
    Default: 6
  SubnetOffset:
    Description: Offset of the subnet from the VPC CIDR
    Type: String
    Default: 8

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Join [ '-', [!Ref EnvironmentName, 'vpc' ]]
        - Key: Environment
          Value: !Ref EnvironmentName

Outputs:
  Vpc:
    Description: VPC
    Value: !Ref VPC
    Export:
      Name: !Join [ ':', [ !Ref 'EnvironmentName', 'Vpc' ] ]
`
};

describe(TEST_NAME, () => {
	it('should retrieve the parameters from a valid template that has no parameters', () => {
		let cf = new CloudFormation();
		return cf.retrieveParameters(CF_TEMPLATE_STRINGS.VALID_NO_PARAMS)
			.then((params) => {
				params.should.exist;
				params.should.be.eql([]);
			});

	});
	it('should retrieve the parameters from a valid template', () => {
		let cf = new CloudFormation();
		return cf.retrieveParameters(CF_TEMPLATE_STRINGS.VALID_VPC)
			.then((params) => {
				params.should.exist;	
				params.should.be.eql([
					{
						'ParameterKey': 'VpcCIDR',
						'DefaultValue': '10.10.0.0/16',
						'NoEcho': false,
						'Description': 'VPC CIDR',
						'ParameterConstraints': {},
						'ParameterType': 'String'
					},
					{
						'ParameterKey': 'EnvironmentName',
						'NoEcho': false,
						'Description': 'Environment Name',
						'ParameterConstraints': {},
						'ParameterType': 'String'
					},
					{
						'ParameterKey': 'SubnetOffset',
						'DefaultValue': '8',
						'NoEcho': false,
						'Description': 'Offset of the subnet from the VPC CIDR',
						'ParameterConstraints': {},
						'ParameterType': 'String'
					},
					{
						'ParameterKey': 'NumberOfSubnets',
						'DefaultValue': '6',
						'NoEcho': false,
						'Description': 'Number of Subnets to create',
						'ParameterConstraints': {},
						'ParameterType': 'String'
					}
				]);
			});
	});
	it('should load the parameters from a valid template file', () => {
		let cf = new CloudFormation();
		return cf.loadParamsFromCloudFormationTemplates(__dirname + '/mocks/vpc.yml')
			.then((params) => {
				params.should.exist;
				params.should.be.eql([
					{
						'ParameterKey': 'VpcCIDR',
						'DefaultValue': '10.10.0.0/16',
						'NoEcho': false,
						'Description': 'VPC CIDR',
						'ParameterConstraints': {},
						'ParameterType': 'String'
					},
					{
						'ParameterKey': 'EnvironmentName',
						'NoEcho': false,
						'Description': 'Environment Name',
						'ParameterConstraints': {},
						'ParameterType': 'String'
					},
					{
						'ParameterKey': 'SubnetOffset',
						'DefaultValue': '8',
						'NoEcho': false,
						'Description': 'Offset of the subnet from the VPC CIDR',
						'ParameterConstraints': {},
						'ParameterType': 'String'
					},
					{
						'ParameterKey': 'NumberOfSubnets',
						'DefaultValue': '6',
						'NoEcho': false,
						'Description': 'Number of Subnets to create',
						'ParameterConstraints': {},
						'ParameterType': 'String'
					}
				]);
			});
	});
	it('should load the parameters from multiple valid template files', () => {
		let cf = new CloudFormation();
		return cf.loadParamsFromCloudFormationTemplates(__dirname + '/mocks/vpc.yml',__dirname + '/mocks/simple-vpc.yml')
			.then((params) => {
				params.should.exist;
				params.should.be.eql([
					{
						'ParameterKey': 'VpcCIDR',
						'DefaultValue': '10.10.0.0/16',
						'NoEcho': false,
						'Description': 'VPC CIDR',
						'ParameterConstraints': {},
						'ParameterType': 'String'
					},
					{
						'ParameterKey': 'EnvironmentName',
						'NoEcho': false,
						'Description': 'Environment Name',
						'ParameterConstraints': {},
						'ParameterType': 'String'
					},
					{
						'ParameterKey': 'SubnetOffset',
						'DefaultValue': '8',
						'NoEcho': false,
						'Description': 'Offset of the subnet from the VPC CIDR',
						'ParameterConstraints': {},
						'ParameterType': 'String'
					},
					{
						'ParameterKey': 'NumberOfSubnets',
						'DefaultValue': '6',
						'NoEcho': false,
						'Description': 'Number of Subnets to create',
						'ParameterConstraints': {},
						'ParameterType': 'String'
					},
					{
						'ParameterKey': 'VpcCIDR',
						'DefaultValue': '10.10.0.0/16',
						'NoEcho': false,
						'Description': 'VPC CIDR',
						'ParameterConstraints': {},
						'ParameterType': 'String'
					},
					{
						'ParameterKey': 'EnvironmentName',
						'NoEcho': false,
						'Description': 'Environment Name',
						'ParameterConstraints': {},
						'ParameterType': 'String'
					},
					{
						'ParameterKey': 'NumberOfSubnets',
						'DefaultValue': '6',
						'NoEcho': false,
						'Description': 'Number of Subnets to create',
						'ParameterConstraints': {},
						'ParameterType': 'String'
					}
				]);
			});
	});
	it('should load all the parameter types', () => {
		let cf = new CloudFormation();
		return cf.retrieveParameters(CF_TEMPLATE_STRINGS.ALL_THE_TYPES)
			.then((params) => {
				params.should.exist;
				params.should.be.eql([
					{'ParameterKey':'VpcCIDR','DefaultValue':'172.19.0.0/16','ParameterType':'String','NoEcho':false,'Description':'VPC CIDR','ParameterConstraints':{}},
					{'ParameterKey':'NodeCount','DefaultValue':'1','ParameterType':'Number','NoEcho':false,'ParameterConstraints':{}},
					{'ParameterKey':'DatabaseCount','ParameterType':'Number','NoEcho':false,'ParameterConstraints':{}},
					{'ParameterKey':'Username','DefaultValue':'usprod','ParameterType':'String','NoEcho':true,'ParameterConstraints':{}},
					{'ParameterKey':'Encrypted','DefaultValue':'true','ParameterType':'String','NoEcho':false,'ParameterConstraints':{'AllowedValues':['true','false']}},
					{'ParameterKey':'Environment','ParameterType':'String','NoEcho':false,'Description':'Environment Name','ParameterConstraints':{}},
					{'ParameterKey':'Password','ParameterType':'String','NoEcho':true,'ParameterConstraints':{}}
				]);
			});
	});
});