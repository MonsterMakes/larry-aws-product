# larry-aws-product

[![npm version](https://badge.fury.io/js/larry-aws-product.svg)](https://badge.fury.io/js/larry-aws-product)

[![https://nodei.co/npm/larry-aws-product.png?downloads=true&downloadRank=true&stars=true](https://nodei.co/npm/larry-aws-product.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/larry-aws-product)


## Description
This is a collection of utilities built on top of the aws-sdk.


# ENVIRONMENT VARIABLES
## AWS Configurations
export AWS_REGION='REPLACE_ME'
export AWS_ACCESS_KEY_ID='REPLACE_ME'
export AWS_SECRET_ACCESS_KEY='REPLACE_ME'

### This will take precedence over AWS_REGION, AWS_ACCESS_KEY_ID, andAWS_SECRET_ACCESS_KEY
export AWS_PROFILE='REPLACE_ME'

# RELEASE NOTES

## TODOs
1. Add support for Parameters with `AllowedPattern`
	- Currently the AllowedPattern does not come in the response from the getTemplateSummary call
	- I added support issue https://github.com/aws/aws-sdk-js/issues/2519 to the git repo, asking for help
2. 