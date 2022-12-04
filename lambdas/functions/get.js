const AWS = require('aws-sdk');
const Sentry = require("@sentry/serverless");
const dynamo = new AWS.DynamoDB.DocumentClient();

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
    if (process.env.DEBUG) {
        console.log({
            message: 'Received event',
            data: JSON.stringify(event),
            sentry: { tracesSampleRate }
        });
    }

    const responseResult = {
        status: 200,
        body: {}
    };

    try {
        const { pathParameters } = normalizeEvent(event);
        const params = { TableName: TABLE };
        let data = {};

        if (pathParameters && pathParameters['id']) {
            data = await dynamo
                .get({
                    ...params,
                    Key: {
                        id: parseInt(pathParameters['id'], 10),
                    },
                })
                .promise();
        } else {
            data = await dynamo.scan(params).promise();
        }

        console.log({
            message: 'Records found',
            data: JSON.stringify(data),
        });

        responseResult.body = data;
    } catch (err) {
        console.error('@main', err);
        responseResult.status = 500;
        responseResult.body = {
            msg: 'Somenthing went wrong',
            error: err.message,
            event,
        }
    }

    return response(responseResult.status, responseResult.body);
});