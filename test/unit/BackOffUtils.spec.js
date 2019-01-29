'use strict';
const chai = require('chai');
const should = chai.should();//eslint-disable-line
const expect = chai.expect;//eslint-disable-line

const TEST_NAME = 'BackOffutils';
const BackOffUtils = require('../../src/util/BackoffUtils');

describe(TEST_NAME, () => {
	it('should print delays', () => {
		return BackOffUtils.printWorstCaseDelays(3000, //use a delay of 3 seconds
			45, //give up after 145 times (this will give up roughly at the hour mark)
			60000 //dont delay any more than 1 minute
		);
	});
	it('should convert ms to time (HH:MM:SS.mmm)', () => {
		BackOffUtils.msToTime(50).should.be.eql('00:00:00.50');
		BackOffUtils.msToTime(1050).should.be.eql('00:00:01.50');
		BackOffUtils.msToTime(60050).should.be.eql('00:01:00.50');
		BackOffUtils.msToTime(1.26e+7).should.be.eql('03:30:00.00');
		BackOffUtils.msToTime(1.728e+8).should.be.eql('48:00:00.00');
	});
});