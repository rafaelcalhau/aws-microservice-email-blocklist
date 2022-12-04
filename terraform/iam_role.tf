resource "aws_iam_role" "api_role" {
  name               = replace(title("${local.namespaced_service_name}LambdaRole"), "-", "")
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role" "cloudwatch_role" {
  name               = replace(title("${local.namespaced_service_name}CloudwatchRole"), "-", "")
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_policy" "api_permissions_policy" {
  name   = replace(title("${local.namespaced_service_name}ApiPermissionsPolicy"), "-", "")
  policy = data.aws_iam_policy_document.create_logs_cloudwatch_doc.json
}

resource "aws_iam_role_policy_attachment" "api_permissions_attach" {
  role       = aws_iam_role.api_role.name
  policy_arn = aws_iam_policy.api_permissions_policy.arn
}