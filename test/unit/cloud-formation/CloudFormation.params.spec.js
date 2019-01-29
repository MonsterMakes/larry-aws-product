'use strict';
const chai = require('chai');
const should = chai.should(); // eslint-disable-line 
const expect = chai.expect; // eslint-disable-line 

const TEST_NAME = 'CloudFormation spec';
const CloudFormation = require('../../../src/aws/services/CloudFormation');

const CF_TEMPLATE_STRINGS = {
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
#   - VPC with:
#     - 3 Private Subnets
#     - 3 Private Subnets
#     - 3 NAT Gateways for Private Subnets outbound access
#     - An Internet Gateway (with routes to it for Public Subnets)
#
#----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
# 
# Usage (Create Cloud Formation Stack): https://docs.aws.amazon.com/cli/latest/reference/cloudformation/deploy/index.html
#   aws cloudformation deploy --template-file ./vpc.yml --region <region> --stack-name <stack-name> --parameter-overrides EnvironmentName=<env-name>
#
#----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
#
# Usage (Describe the Stack): https://docs.aws.amazon.com/cli/latest/reference/cloudformation/describe-stacks.html
#   aws cloudformation describe-stacks --stack-name <stackName> --output json
#
#----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Description:
  The vpc which consists of a 3 AZ VPC with 3 public subnets and 3 nat'd private subnets.

Parameters:
  EnvironmentName:
    Description: Environment Name
    Type: String
    AllowedPattern: ^[0-9a-z-]*$
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

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Join [ '-', [!Ref EnvironmentName, 'ig-1' ]]
        - Key: Environment
          Value: !Ref EnvironmentName

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [ 0, !GetAZs '' ]
      CidrBlock: !Select [0, !Cidr [!Ref VpcCIDR, !Ref NumberOfSubnets, !Ref SubnetOffset]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Join [ '-', [!Ref EnvironmentName, 'public-1' ]]
        - Key: Environment
          Value: !Ref EnvironmentName

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [ 1, !GetAZs '' ]
      CidrBlock: !Select [1, !Cidr [!Ref VpcCIDR, !Ref NumberOfSubnets, !Ref SubnetOffset]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Join [ '-', [!Ref EnvironmentName, 'public-2' ]]
        - Key: Environment
          Value: !Ref EnvironmentName

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [ 2, !GetAZs '' ]
      CidrBlock: !Select [2, !Cidr [!Ref VpcCIDR, !Ref NumberOfSubnets, !Ref SubnetOffset]]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Join [ '-', [!Ref EnvironmentName, 'public-3' ]]
        - Key: Environment
          Value: !Ref EnvironmentName

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [ 0, !GetAZs '' ]
      CidrBlock: !Select [3, !Cidr [!Ref VpcCIDR, !Ref NumberOfSubnets, !Ref SubnetOffset]]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Join [ '-', [!Ref EnvironmentName, 'priv-1' ]]
        - Key: Environment
          Value: !Ref EnvironmentName

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [ 1, !GetAZs '' ]
      CidrBlock: !Select [4, !Cidr [!Ref VpcCIDR, !Ref NumberOfSubnets, !Ref SubnetOffset]]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Join [ '-', [!Ref EnvironmentName, 'priv-2' ]]
        - Key: Environment
          Value: !Ref EnvironmentName

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [ 2, !GetAZs '' ]
      CidrBlock: !Select [5, !Cidr [!Ref VpcCIDR, !Ref NumberOfSubnets, !Ref SubnetOffset]]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Join [ '-', [!Ref EnvironmentName, 'priv-3' ]]
        - Key: Environment
          Value: !Ref EnvironmentName

  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
    
  NatGateway3EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Join [ '-', [!Ref EnvironmentName, 'nat-1' ]]
        - Key: Environment
          Value: !Ref EnvironmentName

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Join [ '-', [!Ref EnvironmentName, 'nat-2' ]]
        - Key: Environment
          Value: !Ref EnvironmentName
  
  NatGateway3:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway3EIP.AllocationId
      SubnetId: !Ref PublicSubnet3
      Tags:
        - Key: Name
          Value: !Join [ '-', [!Ref EnvironmentName, 'nat-3' ]]
        - Key: Environment
          Value: !Ref EnvironmentName

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Join [ '-', [!Ref EnvironmentName, 'pub-rt-tbl-1' ]]
        - Key: Environment
          Value: !Ref EnvironmentName

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet2

  PublicSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet3

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Join [ '-', [!Ref EnvironmentName, 'priv-rt-tbl-1' ]]
        - Key: Environment
          Value: !Ref EnvironmentName

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Join [ '-', [!Ref EnvironmentName, 'priv-rt-tbl-2' ]]
        - Key: Environment
          Value: !Ref EnvironmentName

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  PrivateRouteTable3:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Join [ '-', [!Ref EnvironmentName, 'priv-rt-tbl-3' ]]
        - Key: Environment
          Value: !Ref EnvironmentName

  DefaultPrivateRoute3:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway3

  PrivateSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      SubnetId: !Ref PrivateSubnet3

  DefaultSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Join [ '-', [!Ref EnvironmentName, 'dflt-sec-grp' ]]
      GroupDescription: "Default security group allows traffic within the VPC."
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: '-1'
          FromPort: '-1'
          ToPort: '-1'
          CidrIp: !Ref VpcCIDR
      Tags:
        - Key: Name
          Value: !Join [ '-', [!Ref EnvironmentName, 'dflt-sec-grp' ]]
        - Key: Environment
          Value: !Ref EnvironmentName

Outputs:
  PrivateAZ1:
    Description: Describe Availability Zones 1
    Value: !GetAtt  [ "PrivateSubnet1", "AvailabilityZone" ]
    Export:
      Name: !Join [ ':', [ !Ref 'EnvironmentName', 'PrivateAZ1' ] ]
  PrivateAZ2:
    Description: Describe Availability Zones 2
    Value: !GetAtt  [ "PrivateSubnet2", "AvailabilityZone" ]
    Export:
      Name: !Join [ ':', [ !Ref 'EnvironmentName', 'PrivateAZ2' ] ]
  PrivateAZ3:
    Description: Describe Availability Zones 3
    Value: !GetAtt  [ "PrivateSubnet3", "AvailabilityZone" ]
    Export:
      Name: !Join [ ':', [ !Ref 'EnvironmentName', 'PrivateAZ3' ] ]
  Vpc:
    Description: VPC
    Value: !Ref VPC
    Export:
      Name: !Join [ ':', [ !Ref 'EnvironmentName', 'Vpc' ] ]
  VpcCIDR:
    Description: VPC CIDR
    Value: !Ref VpcCIDR
    Export:
      Name: !Join [ ':', [ !Ref 'EnvironmentName', 'VpcCIDR' ] ]
  PublicSubnets:
    Description: Public Subnets
    Value: !Join [ ",", [ !Ref PublicSubnet1, !Ref PublicSubnet2, !Ref PublicSubnet3]]
    Export:
      Name: !Join [ ':', [ !Ref 'EnvironmentName', 'PublicSubnets' ] ]
  PrivateSubnets:
    Description: Private Subnets
    Value: !Join [ ",", [ !Ref PrivateSubnet1, !Ref PrivateSubnet2, !Ref PrivateSubnet3]]
    Export:
      Name: !Join [ ':', [ !Ref 'EnvironmentName', 'PrivateSubnets' ] ]
  PublicSubnet1:
    Description: Public Subnet AZ1
    Value: !Ref PublicSubnet1
    Export:
      Name: !Join [ ':', [ !Ref 'EnvironmentName', 'PublicSubnet1' ] ]
  PublicSubnet1CidrBlock:
    Description: Public Subnet AZ1 Cidr Block
    Value: !Select [0, !Cidr [!Ref VpcCIDR, !Ref NumberOfSubnets, !Ref SubnetOffset]]
    Export:
      Name: !Join [ ':', [ !Ref 'EnvironmentName', 'PublicSubnet1CidrBlock' ] ]
  PublicSubnet2:
    Description: Public Subnet AZ2
    Value: !Ref PublicSubnet2
    Export:
      Name: !Join [ ':', [ !Ref 'EnvironmentName', 'PublicSubnet2' ] ]
  PublicSubnet2CidrBlock:
    Description: Public Subnet AZ2 Cidr Block
    Value: !Select [1, !Cidr [!Ref VpcCIDR, !Ref NumberOfSubnets, !Ref SubnetOffset]]
    Export:
      Name: !Join [ ':', [ !Ref 'EnvironmentName', 'PublicSubnet2CidrBlock' ] ]
  PublicSubnet3:
    Description: Public Subnet AZ3
    Value: !Ref PublicSubnet3
    Export:
      Name: !Join [ ':', [ !Ref 'EnvironmentName', 'PublicSubnet3' ] ]
  PublicSubnet3CidrBlock:
    Description: Public Subnet AZ1 Cidr Block
    Value: !Select [2, !Cidr [!Ref VpcCIDR, !Ref NumberOfSubnets, !Ref SubnetOffset]]
    Export:
      Name: !Join [ ':', [ !Ref 'EnvironmentName', 'PublicSubnet3CidrBlock' ] ]
  PrivateSubnet1:
    Description: Private Subnet AZ1
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Join [ ':', [ !Ref 'EnvironmentName', 'PrivateSubnet1' ] ]
  PrivateSubnet1CidrBlock:
    Description: Private Subnet AZ1 Cidr Block
    Value: !Select [3, !Cidr [!Ref VpcCIDR, !Ref NumberOfSubnets, !Ref SubnetOffset]]
    Export:
      Name: !Join [ ':', [ !Ref 'EnvironmentName', 'PrivateSubnet1CidrBlock' ] ]
  PrivateSubnet2:
    Description: Private Subnet AZ2
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Join [ ':', [ !Ref 'EnvironmentName', 'PrivateSubnet2' ] ]
  PrivateSubnet2CidrBlock:
    Description: Private Subnet AZ2 Cidr Block
    Value: !Select [4, !Cidr [!Ref VpcCIDR, !Ref NumberOfSubnets, !Ref SubnetOffset]]
    Export:
      Name: !Join [ ':', [ !Ref 'EnvironmentName', 'PrivateSubnet2CidrBlock' ] ]
  PrivateSubnet3:
    Description: Private Subnet AZ3
    Value: !Ref PrivateSubnet3
    Export:
      Name: !Join [ ':', [ !Ref 'EnvironmentName', 'PrivateSubnet3' ] ]
  PrivateSubnet3CidrBlock:
    Description: Private Subnet AZ3 Cidr Block
    Value: !Select [5, !Cidr [!Ref VpcCIDR, !Ref NumberOfSubnets, !Ref SubnetOffset]]
    Export:
      Name: !Join [ ':', [ !Ref 'EnvironmentName', 'PrivateSubnet3CidrBlock' ] ]
  DefaultSecurityGroup:
    Description: Allow VPC Traffic only
    Value: !Ref DefaultSecurityGroup
    Export:
      Name: !Join [ ':', [ !Ref 'EnvironmentName', 'DefaultSecurityGroup' ] ]
`
};

describe(TEST_NAME, () => {
	it('should retrieve the parameters from a valid template that has no parameters',() => {
		let cf = new CloudFormation();
		return cf.retrieveParameters(CF_TEMPLATE_STRINGS.VALID_NO_PARAMS)
			.then((params)=>{
				params.should.exist;
				params.should.be.eql([]);
			});
		
	});
	it('should retrieve the parameters from a valid template',() => {
		let cf = new CloudFormation();
		return cf.retrieveParameters(CF_TEMPLATE_STRINGS.VALID_VPC)
			.then((params)=>{
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
	it('should load the parameters from a valid template file',() => {
		let cf = new CloudFormation();
		return cf.loadParamsFromCloudFormationTemplates(__dirname+'/mocks/vpc.yml')
			.then((params)=>{
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
	it('should load the parameters from a valid template file',() => {
		let cf = new CloudFormation();
		return cf.loadParamsFromCloudFormationTemplates(__dirname+'/mocks/vpc.yml')
			.then((params)=>{
				return cf.convertParametersToPrompts(params);
			})
			.then((prompts)=>{
				prompts.should.exist;
				prompts.length.should.be.eql(4);
				prompts[0].name.should.be.eql('VpcCIDR');
				prompts[0].default.should.be.eql('10.10.0.0/16');
				prompts[0].type.should.be.eql('String');

				prompts[1].name.should.be.eql('EnvironmentName');
				expect(prompts[1].default).to.be.undefined;
				prompts[1].type.should.be.eql('String');

				prompts[2].name.should.be.eql('SubnetOffset');
				prompts[2].default.should.be.eql('8');
				prompts[2].type.should.be.eql('String');


				prompts[3].name.should.be.eql('NumberOfSubnets');
				prompts[3].default.should.be.eql('6');
				prompts[3].type.should.be.eql('String');
			});
	});
});