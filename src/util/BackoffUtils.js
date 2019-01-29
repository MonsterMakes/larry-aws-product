'use strict';
const ALGORITHMS = {
	RANDOM_LINEAR: 'RANDOM_LINEAR',
	LINEAR: 'LINEAR',
	RANDOM_EXPONENTIAL: 'RANDOM_EXPONENTIAL',
	EXPONENTIAL: 'EXPONENTIAL'
};
Object.freeze(ALGORITHMS);
class BackoffUtils {
	static msToTime(duration) {
		let milliseconds = parseInt((duration % 1000));
		let seconds = parseInt((duration / 1000) % 60);
		let minutes = parseInt((duration / (1000 * 60)) % 60);
		let hours = parseInt((duration / (1000 * 60 * 60)));
	
		hours = (hours < 10) ? '0' + hours : hours;
		minutes = (minutes < 10) ? '0' + minutes : minutes;
		seconds = (seconds < 10) ? '0' + seconds : seconds;
		milliseconds = (milliseconds < 10) ? '0' + milliseconds : milliseconds;
		return hours + ':' + minutes + ':' + seconds + '.' + milliseconds;
	}
	static randIntInclusive(min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}
	static getDelay(algo,delay,count,maxDelay){
		let result = delay;
		let exponentialDelay = delay * (Math.pow(2, count) - 1);
		switch(algo){
		case ALGORITHMS.RANDOM_LINEAR:
			result = BackoffUtils.randIntInclusive(delay, delay * count);
			break;
		case ALGORITHMS.LINEAR:
			result = delay * count;
			break;
		case ALGORITHMS.RANDOM_EXPONENTIAL:
			result = BackoffUtils.randIntInclusive(delay, exponentialDelay);
			break;
		case ALGORITHMS.EXPONENTIAL:
			result = exponentialDelay;
			break;
		}
		if(maxDelay){
			result = Math.min(maxDelay,result);
		}
		return result;
	}
	static getDelays(algo, opts={delay: 50, maxAttempts: 16, maxDelay: undefined}){
		let delays = [];
		let delay = opts.delay || 50;
		let maxAttempts = opts.maxAttempts || 16;
		let maxDelay = opts.maxDelay;
		let count = 0;
		while(count < maxAttempts){
			++count;
			let delayAmount = BackoffUtils.getDelay(algo,delay,count,maxDelay);
			delays.push(delayAmount);
		}
		return delays;
	}
	static printWorstCaseDelays(delay=50, maxAttempts=16, maxDelay=undefined){
		let delays = [];
		Object.keys(ALGORITHMS).forEach((algo)=>{
			let algoDelays = BackoffUtils.getDelays(algo,{delay, maxAttempts, maxDelay});
			for(let i=0; i<maxAttempts; i++){
				if(!delays[i]){
					delays[i] = {};
				}
				delays[i][algo] = BackoffUtils.msToTime(algoDelays[i]);
			}
		});
		
		console.log(`Here are the delays for all the algorithms.`);//eslint-disable-line
		console.table(delays);//eslint-disable-line
	}
	static backoff(algorithm,fnToBackoff,opts={delay: 50, maxAttempts: 16, maxDelay: undefined, delayAmounts: undefined, currentIndex: 0}) {
		opts.delayAmounts = opts.delayAmounts || BackoffUtils.getDelays(algorithm,opts);
		opts.currentIndex = opts.currentIndex || 0;
		
		return Promise.resolve()
			.then(() => {
				return new Promise((resolve,reject)=>{
					let delayAmount = opts.delayAmounts[opts.currentIndex];
					setTimeout(() => {
						fnToBackoff(opts)
							.then(resolve,reject);
					}, delayAmount);
				});
			})
			//back off'd function results
			.then((result) => {
				if (result) {
					return Promise.resolve(result);
				}
				else {
					if (opts.currentIndex <= (opts.delayAmounts.length - 1)) {
						opts.currentIndex = opts.currentIndex + 1;
						return BackoffUtils.backoff(algorithm,fnToBackoff,opts);
					}
					else {
						return Promise.reject(new Error(`${algorithm} backoff failed, max attempts reached.`));
					}
				}
			});
	}
	/**
	 * Linear backoff give up after a number of iterations. 
	 * @param {function} fnToBackoff - If this returns truthy the backoff will stop, otherwise it will back off until Max tries is reached.
	 * @param {int} [delay=50] - The number of ms to delay.
	 * @param {int} [maxAttempts=16] - The max number of backoffs to attempt.
	 * @param {maxDelay} [maxDelay] - The maximum amount of delay to backoff.
	 */
	static linearBackoff(fnToBackoff, delay = 50, maxAttempts = 16, maxDelay=undefined) {
		return BackoffUtils.backoff(ALGORITHMS.LINEAR,fnToBackoff,{delay, maxAttempts, maxDelay});
	}
	/**
	 * Linear backoff give up after a number of iterations. 
	 * @param {function} fnToBackoff - If this returns truthy the backoff will stop, otherwise it will back off until Max tries is reached.
	 * @param {int} [delay=50] - The number of ms to delay.
	 * @param {int} [maxAttempts=16] - The max number of backoffs to attempt.
	 * @param {maxDelay} [maxDelay] - The maximum amount of delay to backoff.
	 */
	static randomLinearBackoff(fnToBackoff, delay = 50, maxAttempts = 16, maxDelay=undefined) {
		return BackoffUtils.backoff(ALGORITHMS.RANDOM_LINEAR,fnToBackoff,{delay, maxAttempts, maxDelay});
	}
	/**
	 * Exponential backoff give up after a number of iterations. 
	 * @param {function} fnToBackoff - If this returns truthy the backoff will stop, otherwise it will back off until Max tries is reached.
	 * @param {int} [delay=50] - The number of ms to delay.
	 * @param {int} [maxAttempts=16] - The max number of backoffs to attempt.
	 * @param {maxDelay} [maxDelay] - The maximum amount of delay to backoff.
	 */
	static exponentialBackoff(fnToBackoff, delay = 50, maxAttempts = 16, maxDelay=undefined) {
		return BackoffUtils.backoff(ALGORITHMS.EXPONENTIAL,fnToBackoff,{delay, maxAttempts, maxDelay});
	}
	/**
	 * Random exponential backoff method. This will randomly exponentially back off, and give up after a number of iterations.
	 * @param {function} fnToBackoff - If this returns truthy the backoff will stop, otherwise it will back off until Max tries is reached.
	 * @param {int} [delay=50] - The number of ms to delay.
	 * @param {int} [maxAttempts=16] - The max number of backoffs to attempt.
	 * @param {maxDelay} [maxDelay] - The maximum amount of delay to backoff.
	 */
	static randomExponentialBackoff(fnToBackoff, delay = 50, maxAttempts = 16, maxDelay=undefined) {
		return BackoffUtils.backoff(ALGORITHMS.RANDOM_EXPONENTIAL,fnToBackoff,{delay, maxAttempts, maxDelay});
	}
}
module.exports = BackoffUtils;