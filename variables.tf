variable "gcp_project_id" {
  description = "The Google Cloud project ID."
  type        = string
}

variable "db_password" {
  description = "The password for the Cloud SQL postgres user."
  type        = string
  sensitive   = true
}

variable "google_client_id" {
  description = "Google OAuth Client ID"
  type        = string
  sensitive   = true
}

variable "google_client_secret" {
  description = "Google OAuth Client Secret"
  type        = string
  sensitive   = true
}

variable "session_secret" {
  description = "Secret key for session signing"
  type        = string
  sensitive   = true
}

variable "cors_origin_url" {
  description = "The frontend URL for CORS policy"
  type        = string
}