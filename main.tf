# main.tf - Final Terraform configuration for vathra.gr

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = "europe-west1"
}

# -----------------------------------------------------------------------------
# 1. ENABLE NECESSARY APIS
# -----------------------------------------------------------------------------
resource "google_project_service" "apis" {
  for_each = toset([
    "sqladmin.googleapis.com",
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "iam.googleapis.com",
    "secretmanager.googleapis.com",
    "vpcaccess.googleapis.com"
  ])
  service                    = each.key
  disable_dependent_services = true
}

# -----------------------------------------------------------------------------
# 2. SECRETS (using Google Secret Manager)
# -----------------------------------------------------------------------------
resource "google_secret_manager_secret" "db_password" {
  secret_id = "db-password"
  replication { auto {} }
  depends_on = [google_project_service.apis]
}
resource "google_secret_manager_secret_version" "db_password_v1" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = var.db_password
}

resource "google_secret_manager_secret" "google_client_id" {
  secret_id = "google-client-id"
  replication { auto {} }
  depends_on = [google_project_service.apis]
}
resource "google_secret_manager_secret_version" "google_client_id_v1" {
  secret      = google_secret_manager_secret.google_client_id.id
  secret_data = var.google_client_id
}

resource "google_secret_manager_secret" "google_client_secret" {
  secret_id = "google-client-secret"
  replication { auto {} }
  depends_on = [google_project_service.apis]
}
resource "google_secret_manager_secret_version" "google_client_secret_v1" {
  secret      = google_secret_manager_secret.google_client_secret.id
  secret_data = var.google_client_secret
}

resource "google_secret_manager_secret" "session_secret" {
  secret_id = "session-secret"
  replication { auto {} }
  depends_on = [google_project_service.apis]
}
resource "google_secret_manager_secret_version" "session_secret_v1" {
  secret      = google_secret_manager_secret.session_secret.id
  secret_data = var.session_secret
}

# -----------------------------------------------------------------------------
# 3. DATABASE (Cloud SQL with PostGIS)
# -----------------------------------------------------------------------------
resource "google_sql_database_instance" "vathra_db" {
  name             = "vathra-db"
  database_version = "POSTGRES_16"
  region           = "europe-west1"
  settings {
    tier = "db-f1-micro" # Smallest, cheapest instance
    database_flags {
      name  = "cloudsql.enable_postgis"
      value = "on"
    }
    ip_configuration {
      ipv4_enabled = false
      private_network = "projects/${var.gcp_project_id}/global/networks/default"
    }
  }
  deletion_protection = false
  depends_on = [google_project_service.apis]
}

resource "google_sql_database" "main_db" {
  instance = google_sql_database_instance.vathra_db.name
  name     = "greece_trig_points"
}

resource "google_sql_user" "main_user" {
  instance = google_sql_database_instance.vathra_db.name
  name     = "postgres"
  password = var.db_password
}

# -----------------------------------------------------------------------------
# 4. CONTAINER REPOSITORY (Artifact Registry)
# -----------------------------------------------------------------------------
resource "google_artifact_registry_repository" "vathra_images" {
  location      = "europe-west1"
  repository_id = "vathra-images"
  format        = "DOCKER"
  depends_on = [google_project_service.apis]
}

# -----------------------------------------------------------------------------
# 5. NETWORKING (VPC Connector for secure DB connection)
# -----------------------------------------------------------------------------
resource "google_vpc_access_connector" "serverless" {
  name          = "serverless-connector"
  region        = "europe-west1"
  ip_cidr_range = "10.8.0.0/28"
  depends_on = [google_project_service.apis]
}

# -----------------------------------------------------------------------------
# 6. BACKEND SERVICE (Cloud Run)
# -----------------------------------------------------------------------------
resource "google_cloud_run_v2_service" "trig_points_api" {
  name     = "trig-points-api"
  location = "europe-west1"
  
  template {
    containers {
      image = "europe-west1-docker.pkg.dev/google/cloudrun/hello" # Placeholder image
      ports { container_port = 8080 }

      # --- Environment Variables ---
      env { name = "NODE_ENV", value = "production" }
      env { name = "PORT", value = "8080" }
      env { name = "CORS_ORIGIN", value = var.cors_origin_url }
      env { 
        name = "DATABASE_URL"
        value_source { secret_key_ref { secret = google_secret_manager_secret.db_url.secret_id, version = "1" } }
      }
      env { 
        name = "GOOGLE_CLIENT_ID"
        value_source { secret_key_ref { secret = google_secret_manager_secret.google_client_id.secret_id, version = "1" } }
      }
      env { 
        name = "GOOGLE_CLIENT_SECRET"
        value_source { secret_key_ref { secret = google_secret_manager_secret.google_client_secret.secret_id, version = "1" } }
      }
      env { 
        name = "SESSION_SECRET"
        value_source { secret_key_ref { secret = google_secret_manager_secret.session_secret.secret_id, version = "1" } }
      }
    }
    # Securely connect to the database
    vpc_access {
      connector = google_vpc_access_connector.serverless.id
      egress    = "ALL_TRAFFIC"
    }
  }
  depends_on = [google_project_service.apis, google_vpc_access_connector.serverless]
}