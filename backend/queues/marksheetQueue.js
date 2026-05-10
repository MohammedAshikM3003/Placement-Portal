const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const QUEUE_DISABLED = true;

if (QUEUE_DISABLED) {
	console.log('⚠️ BullMQ queue disabled for local testing');

	module.exports = {
		addMarksheetJob: async (data) => {
			return {
				id: 'local-test-job',
				data,
			};
		},
	};
} else {
	const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

	const marksheetQueue = new Queue('marksheet-extraction', { connection });

	module.exports = { marksheetQueue, connection };
}
