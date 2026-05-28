variable "folder_id" {
  type = string
}

variable "network_id" {
  type = string
}

variable "subnet_id" {
  type = string
}

variable "zone" {
  type    = string
  default = "ru-central1-a"
}

variable "project_name" {
  type    = string
  default = "book-api-lab17"
}

variable "db_password" {
  type      = string
  sensitive = true
}

