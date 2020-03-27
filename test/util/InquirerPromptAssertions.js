'use strict';
const chai = require('chai');
const should = chai.should(); // eslint-disable-line 
const expect = chai.expect; // eslint-disable-line 

class InquirerPromptAssertions{
	static sames (actualPrompts,expectedPrompts){
		let sortOnNameFn = (a, b) => (a.name > b.name) ? 1 : -1;
		let expectedPromptsSorted = expectedPrompts.sort(sortOnNameFn);
		let actualPromptsSorted = actualPrompts.sort(sortOnNameFn);
		expectedPromptsSorted.forEach((expectedObj,index)=>{
			try{
				expect(actualPromptsSorted[index].type).to.be.eql(expectedObj.type);
				expect(actualPromptsSorted[index].name).to.be.eql(expectedObj.name);
				expect(actualPromptsSorted[index].default).to.be.eql(expectedObj.default);
				expect(actualPromptsSorted[index].message).to.be.eql(expectedObj.message);
				expect(actualPromptsSorted[index].description).to.be.eql(expectedObj.description);
			}
			catch(e){
				debugger;//eslint-disable-line
				throw e;
			}
		});
	}
}
module.exports=InquirerPromptAssertions;