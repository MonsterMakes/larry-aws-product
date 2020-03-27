'use strict';
const _ = require('lodash');

class AwsUtils{
	/**
	 * @typedef {TagObject}
	 * @type {object}
	 * @property {string} Key - The tag name
	 * @property {string} Value - The tag value
	 */
	/**
	 * Normalize the Tags to be used with AWS APIs.
	 * @param {Array.<TagObject>|Object} tagsIn - Either an array of objects with Key and Value properties or an Object where the property is the key and the property value is the key value.
	 * @returns {Array.<TagObject>} The normalized tag array.
	 */
	static normalizeTags(tagsIn){
		let tagsArray = [];
		if(_.isPlainObject(tagsIn)){
			Object.keys(tagsIn).forEach((key)=>{
				let tagObj = {
					Key: key,
					Value: tagsIn[key]
				};
				tagsArray.push(tagObj);
			});
		}
		else if(_.isArray(tagsIn)){
			let valid = tagsIn.every((tagObj)=>{
				if(_.isPlainObject(tagObj) && tagObj.hasOwnProperty('Key') && tagObj.hasOwnProperty('Value')){
					return true;
				}
				else{
					return false;
				}
			});
			if(!valid){
				let err = new Error('A malformed tags object was provided');
				err.malformedTagsObject = tagsIn;
				throw err;
			}
			else{
				tagsArray = tagsIn;
			}
		}
		else{
			let err = new Error('A tags object was provided of an unknown type');
			err.malformedTagsObject = tagsIn;
			throw err;
		}
		return tagsArray;
	}
}
module.exports=AwsUtils;