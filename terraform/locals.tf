locals {
  database_name = "EmailBlocklist"

  namespaced_service_name           = "${var.service_name}-${var.env}"
  namespaced_service_name_fn_prefix = replace("${var.service_name}-${title(var.env)}", "-", "")

  lambdas_path = "${path.module}/../lambdas"
  layers_path  = "${path.module}/../lambdas/layers"

  lambdas = {
    delete = {
      name        = "${local.namespaced_service_name_fn_prefix}DeleteItem"
      description = "Delete given email"
      memory      = 128
      timeout     = 5
    }
    get = {
      name        = "${local.namespaced_service_name_fn_prefix}GetItem"
      description = "Get all emails"
      memory      = 256
      timeout     = 10
    }
    validate = {
      name        = "${local.namespaced_service_name_fn_prefix}ValidateItem"
      description = "Validate an email"
      memory      = 128
      timeout     = 15
    }
  }
}