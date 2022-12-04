const APIs = {
  AbstractAPI: {
    params: 'api_key=[apiKey]&email=[email]',
    url: 'https://emailvalidation.abstractapi.com/v1/',
    isDeliverable: ({ data }) => data.deliverability === 'DELIVERABLE' && data.is_smtp_valid.value === true,
  },
  APILayer: {
    params: 'email=[email]',
    url: 'https://api.apilayer.com/email_verification/check',
    isDeliverable: ({ data }) => data.format_valid === true && data.smtp_check === true,
  },
}

function emailVerificationProviders(providerName, apiKey, email) {
  if (!APIs[providerName]) {
    throw new Error('Email verification Provider not found.');
  }

  const params = APIs[providerName].params.replace('[apiKey]', apiKey).replace('[email]', email);
  const url = `${APIs[providerName].url}?${params}`;
  return { url, isDeliverable: APIs[providerName].isDeliverable }
}

module.exports = emailVerificationProviders;
