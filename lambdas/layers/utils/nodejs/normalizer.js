const normalizeEvent = event => ({
  data: event['body'] ? JSON.parse(event['body']) : {},
  headers: event['headers'] || {},
  pathParameters: event['pathParameters'] || {},
  querystring: event['queryStringParameters'] || {},
});

module.exports = normalizeEvent;