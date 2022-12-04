output "api" {
  value = {
    arn            = aws_api_gateway_rest_api.api.arn
    name           = aws_api_gateway_rest_api.api.name
    api_key_source = aws_api_gateway_rest_api.api.api_key_source
    execution_arn  = aws_api_gateway_rest_api.api.execution_arn
  }
}