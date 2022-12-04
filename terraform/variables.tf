variable "env" {
  type    = string
  default = "dev"
}

variable "apikeys" {
  type = object({
    AbstractAPI = string
    APILayer = string
  })
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "aws_profile" {
  type = string
}

variable "service_name" {
  type    = string
  default = "EmailBlocklist"
}

variable "sentry_dsn" {
  type    = string
  default = ""
}