resource "aws_dynamodb_table" "db" {
  hash_key     = "email"
  name         = local.database_name
  billing_mode = "PAY_PER_REQUEST" // on-demand mode

  attribute {
    name = "email"
    type = "S"
  }
}

resource "aws_dynamodb_table_item" "first_item" {
  depends_on = [
    aws_dynamodb_table.db
  ]

  hash_key   = aws_dynamodb_table.db.hash_key
  table_name = aws_dynamodb_table.db.name

  item = <<ITEM
{
  "email": {"S": "test@test.com"},
  "createdAt": {"S": "${timestamp()}"}
}
ITEM
}