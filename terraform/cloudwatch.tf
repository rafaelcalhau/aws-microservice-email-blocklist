resource "aws_cloudwatch_log_group" "cw_lambdas" {
  for_each = local.lambdas

  name              = "/aws/lambda/${each.value.name}"
  retention_in_days = 3
}

# resource "aws_cloudwatch_log_group" "discord_notifier" {
#   name              = "/aws/lambda/discordNotifier"
#   retention_in_days = 3
# }

# resource "aws_cloudwatch_log_subscription_filter" "discord_notifier" {
#   for_each = local.lambdas

#   depends_on      = [aws_lambda_permission.cloudwatch_discord_notifier]
#   destination_arn = aws_lambda_function.discord_notifier.arn
#   filter_pattern  = "? ERROR"
#   log_group_name  = "/aws/lambda/${each.value.name}"
#   name            = "logfilter_lambda_discord_notifier"
# }