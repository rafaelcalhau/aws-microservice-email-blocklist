const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

const Sentry = require("@sentry/serverless");
const normalizeEvent = require('/opt/nodejs/normalizer');
const response = require('/opt/nodejs/response');

const { SENTRY_DSN, SENTRY_TRACES_SAMPLE_RATE, TABLE } = process.env
const tracesSampleRate = typeof SENTRY_TRACES_SAMPLE_RATE === 'string'
    ? Number(SENTRY_TRACES_SAMPLE_RATE)
    : 0

Sentry.AWSLambda.init({
    dsn: SENTRY_DSN,
    
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate,
    timeoutWarningLimit: 50,
});  

exports.handler = Sentry.AWSLambda.wrapHandler(async (event, context) => {
    const { DEBUG, TABLE } = process.env;

    if (DEBUG === 'true') {
        console.log({
            message: 'Received event',
            data: JSON.stringify(event),
            event,
        });
    }

    try {
        const { pathParameters: { id } } = normalizeEvent(event);
        const params = {
            TableName: TABLE,
            Key: {
                id: parseInt(id, 10),
            },
        };

        await dynamo.delete(params).promise();

        console.log({
            message: 'Record has been deleted',
            data: JSON.stringify(params),
        });

        return response(200, `Record ${id} has been deleted`);
    } catch (err) {
        console.error(err);
        return response(500, {
            msg: 'Somenthing went wrong',
            error: err.message,
            event,
        });
    }
});