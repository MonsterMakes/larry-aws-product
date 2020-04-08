# THIS PROJECT IS NOW BEING MAINTAINED IN THE LARRY (https://github.com/MonsterMakes/larry) MONOREPO

# larry-aws-product

[![npm version](https://badge.fury.io/js/larry-aws-product.svg)](https://badge.fury.io/js/larry-aws-product)

[![https://nodei.co/npm/larry-aws-product.png?downloads=true&downloadRank=true&stars=true](https://nodei.co/npm/larry-aws-product.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/larry-aws-product)


## Description
***Update This*** Add the intent of your package here...


# ENVIRONMENT VARIABLES
## AWS Configurations
export AWS_REGION='REPLACE_ME'
export AWS_ACCESS_KEY_ID='REPLACE_ME'
export AWS_SECRET_ACCESS_KEY='REPLACE_ME'

# RELEASE NOTES

## TODOs
1. Add support for storing SSM Parameters in the Parameter store
2. Add support for reading SSM Parameters from the Parameter store
	- https://github.com/Droplr/aws-env
3. Add support for Parameters with `AllowedPattern`
	- Currently the AllowedPattern does not come in the response from the getTemplateSummary call
	- I added support issue https://github.com/aws/aws-sdk-js/issues/2519 to the git repo, asking for help
