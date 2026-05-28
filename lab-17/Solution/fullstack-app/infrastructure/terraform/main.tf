terraform {
  required_version = ">= 1.5.0"
  required_providers {
    yandex = {
      source  = "yandex-cloud/yandex"
      version = "~> 0.140"
    }
  }
}

provider "yandex" {
  folder_id = var.folder_id
  zone      = var.zone
}

resource "yandex_iam_service_account" "deployer" {
  name        = "${var.project_name}-deployer"
  description = "Service account for CI/CD deployment"
}

resource "yandex_container_registry" "registry" {
  name = "${var.project_name}-registry"
}

resource "yandex_mdb_postgresql_cluster" "postgres" {
  name        = "${var.project_name}-postgres"
  environment = "PRESTABLE"
  network_id  = var.network_id

  config {
    version = "16"
    resources {
      resource_preset_id = "s2.micro"
      disk_type_id       = "network-hdd"
      disk_size          = 10
    }
  }

  host {
    zone      = var.zone
    subnet_id = var.subnet_id
  }
}

resource "yandex_mdb_postgresql_user" "book_user" {
  cluster_id = yandex_mdb_postgresql_cluster.postgres.id
  name       = "book_user"
  password   = var.db_password
}

resource "yandex_mdb_postgresql_database" "books" {
  cluster_id = yandex_mdb_postgresql_cluster.postgres.id
  name       = "books"
  owner      = yandex_mdb_postgresql_user.book_user.name
}

output "registry_id" {
  value = yandex_container_registry.registry.id
}

output "postgres_cluster_id" {
  value = yandex_mdb_postgresql_cluster.postgres.id
}

