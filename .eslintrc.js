module.exports = {
	"plugins": [
	],
	"parserOptions": {
		"sourceType": "module"
	},
	"env": {
		"es6": true,
		"node": true,
		"mocha": true
	},
	"extends": "eslint:recommended",
	"rules": {
		"no-console": ["error"],
		"indent": [
			"warn",
			"tab"
		],
		"linebreak-style": [
			"error",
			"unix"
		],
		"quotes": [
			"warn",
			"single"
		],
		"semi": [
			"error",
			"always"
		]
	}
};

// module.exports = {
//     "env": {
//         "commonjs": true,
//         "es6": true,
//         "node": true
//     },
//     "extends": [
//         "eslint:recommended",
//         "airbnb-base"
//     ],
//     "globals": {
//         "Atomics": "readonly",
//         "SharedArrayBuffer": "readonly"
//     },
//     "parserOptions": {
//         "ecmaVersion": 2018
//     },
//     "rules": {
//         "indent": ["error", 4],
//         "max-classes-per-file": ["error", 3]
//     }
// };