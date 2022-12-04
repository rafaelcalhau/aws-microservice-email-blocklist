# data "archive_file" "discordjs_layer" {
#   output_path = "files/discordjs-layer.zip"
#   source_dir  = "${local.layers_path}/discordjs"
#   type        = "zip"
# }

data "archive_file" "axios_layer" {
  output_path = "files/axios-layer.zip"
  source_dir  = "${local.layers_path}/axios"
  type        = "zip"
}

data "archive_file" "utils_layer" {
  output_path = "files/utils-layer.zip"
  source_dir  = "${local.layers_path}/utils"
  type        = "zip"
}

# resource "aws_lambda_layer_version" "discordjs" {
#   layer_name          = "discordjs-layer"
#   description         = "Discord Agent"
#   filename            = data.archive_file.discordjs_layer.output_path
#   source_code_hash    = data.archive_file.discordjs_layer.output_base64sha256
#   compatible_runtimes = ["nodejs16.x"]
# }

resource "aws_lambda_layer_version" "axios" {
  layer_name          = "axios-layer"
  description         = "Axios Agent"
  filename            = data.archive_file.axios_layer.output_path
  source_code_hash    = data.archive_file.axios_layer.output_base64sha256
  compatible_runtimes = ["nodejs14.x"]
}

resource "aws_lambda_layer_version" "utils" {
  layer_name          = "utils-layer"
  description         = "Utils for response and event normalization"
  filename            = data.archive_file.utils_layer.output_path
  source_code_hash    = data.archive_file.utils_layer.output_base64sha256
  compatible_runtimes = ["nodejs14.x"]
}

data "archive_file" "lambdas" {
  for_each = local.lambdas

  output_path = "files/lambda-${each.key}-artefact.zip"
  source_file = "${local.lambdas_path}/functions/${each.key}.js"
  type        = "zip"
}

# data "archive_file" "discord_notifier" {
#   output_path = "files/discord-notifier-artefact.zip"
#   source_file = "${local.lambdas_path}/discordNotifier.js"
#   type        = "zip"
# }

resource "aws_lambda_function" "lambdas" {
  for_each = local.lambdas

  function_name = each.value["name"]
  handler       = "${each.key}.handler"
  description   = each.value["description"]
  role          = aws_iam_role.api_role.arn
  runtime       = "nodejs14.x"

  filename         = data.archive_file.lambdas[each.key].output_path
  source_code_hash = data.archive_file.lambdas[each.key].output_base64sha256

  timeout     = each.value["timeout"]
  memory_size = each.value["memory"]

  layers = [
    "arn:aws:lambda:us-east-1:943013980633:layer:SentryNodeServerlessSDK:65",
    aws_lambda_layer_version.axios.arn,
    aws_lambda_layer_version.utils.arn
  ]

  // Enabling CloudWatch X-Ray
  tracing_config {
    mode = "Active"
  }

  environment {
    variables = {
      ABSTRACT_API_KEY           = var.apikeys.AbstractAPI
      APILAYER_API_KEY           = var.apikeys.APILayer
      TABLE                      = local.database_name
      DEBUG                      = var.env == "dev"
      SENTRY_DSN                 = var.sentry_dsn
      SENTRY_TRACES_SAMPLE_RATE  = 0.05
      VERIFICATION_PROVIDER_NAME = "APILayer"
      # VERIFICATION_PROVIDER_NAME = "AbstractAPI"
    }
  }
}

# resource "aws_lambda_function" "discord_notifier" {
#   function_name = "discordNotifier"
#   handler       = "discordNotifier.handler"
#   description   = "Sends notification on lambda errors to Discord Channel"
#   role          = aws_iam_role.cloudwatch_role.arn
#   runtime       = "nodejs16.x"

#   filename         = data.archive_file.discord_notifier.output_path
#   source_code_hash = data.archive_file.discord_notifier.output_base64sha256

#   timeout     = 10
#   memory_size = 128

#   layers = [
#     aws_lambda_layer_version.discordjs.arn
#   ]

#   environment {
#     variables = {
#       DEBUG               = var.env == "dev"
#       DISCORD_WEBHOOK_URL = "..."
#     }
#   }
# }

resource "aws_lambda_permission" "api" {
  for_each = local.lambdas

  statement_id  = "InvokeFunctionToAPILambdas"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambdas[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:${var.aws_region}:${data.aws_caller_identity.current.account_id}:*/*"
}

# resource "aws_lambda_permission" "cloudwatch_discord_notifier" {
#   statement_id  = "CloudwatchInvokeFunctionDiscordNotifier"
#   action        = "lambda:InvokeFunction"
#   function_name = aws_lambda_function.discord_notifier.function_name
#   principal     = "logs.${var.aws_region}.amazonaws.com"
#   source_arn    = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:*:*"
# }