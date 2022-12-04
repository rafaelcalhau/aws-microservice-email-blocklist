const AWS = require('aws-sdk');
const Sentry = require("@sentry/serverless");
const axios = require('axios');
const emailVerificationProviders = require('/opt/nodejs/emailVerificationProviders');
const normalizeEvent = require('/opt/nodejs/normalizer');
const response = require('/opt/nodejs/response');
const isValidEmail = require('/opt/nodejs/isValidEmail');

const VERIFICATION_PROVIDERS = {
    AbstractAPI: 'AbstractAPI',
    APILayer: 'APILayer'
}
const dynamo = new AWS.DynamoDB.DocumentClient();

const {
    ABSTRACT_API_KEY,
    APILAYER_API_KEY,
    DEBUG,
    SENTRY_DSN,
    SENTRY_TRACES_SAMPLE_RATE,
    TABLE,
    VERIFICATION_PROVIDER_NAME
} = process.env;
const tracesSampleRate = typeof SENTRY_TRACES_SAMPLE_RATE === 'string'
    ? Number(SENTRY_TRACES_SAMPLE_RATE)
    : 0;

Sentry.AWSLambda.init({
    dsn: SENTRY_DSN,
    
    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate,
    timeoutWarningLimit: 50,
});

Sentry.configureScope(scope => scope.setTransactionName("EmailBlocklistPost"));

exports.handler = Sentry.AWSLambda.wrapHandler(async (event, context) => {
    if (DEBUG === 'true') {
        console.log({
            message: 'Received event',
            data: JSON.stringify(event),
            event,
        });
    }
    
    try {
        const { querystring } = normalizeEvent(event);
        const email = querystring.email ? querystring.email.toLowerCase() : null;

        if (!email || !isValidEmail(email)) {
            const msg = 'Email address not informed.';
            Sentry.AWSLambda.captureMessage(msg, 'info');
            return response(400, msg);
        }

        const params = { TableName: TABLE };
        const row = await dynamo.get({ ...params, Key: { email } }).promise();

        if (row.Item) {
            return response(201, { idValid: false, email });
        }

        const verificationProviderName = VERIFICATION_PROVIDER_NAME
            && VERIFICATION_PROVIDERS[VERIFICATION_PROVIDER_NAME]
                ? VERIFICATION_PROVIDER_NAME
                : VERIFICATION_PROVIDERS.AbstractAPI;

        const APIKEYS = {
            [VERIFICATION_PROVIDERS.AbstractAPI]: ABSTRACT_API_KEY,
            [VERIFICATION_PROVIDERS.APILayer]: APILAYER_API_KEY
        }
        const apikey = APIKEYS[verificationProviderName];
        const { url, isDeliverable } = emailVerificationProviders(verificationProviderName, APIKEYS[verificationProviderName], email);
        const isEmailDeliverable = await axios.get(url, { headers: { apikey } }).then(isDeliverable);
        
        console.log({
            email,
            verificationProviderName,
            isEmailDeliverable,
        });

        if (!isEmailDeliverable) {
            await dynamo.put({
                ...params,
                Item: {
                    email,
                    createdAt: new Date().toISOString(),
                }
            }).promise();
    
            console.log({
                message: 'Record has been created',
                data: JSON.stringify(params)
            });
        }

        return response(200, { idValid: isEmailDeliverable });
    } catch (err) {
        console.error(err);
        return response(500, {
            msg: 'Somenthing went wrong',
            error: err.message,
            event,
        });
    }
});