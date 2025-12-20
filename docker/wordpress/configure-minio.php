<?php
/**
 * MinIO/S3 Configuration for WordPress
 * This script configures WordPress to use MinIO for media storage
 */

// This file is used to add S3/MinIO configuration constants to wp-config.php
// The configuration is added via WORDPRESS_CONFIG_EXTRA environment variable

// Usage: The WordPress service sets these environment variables:
// - S3_UPLOADS_ENDPOINT: MinIO server URL (e.g., http://minio:9000)
// - S3_UPLOADS_BUCKET: Bucket name (e.g., wp-uploads)
// - S3_UPLOADS_KEY: MinIO access key
// - S3_UPLOADS_SECRET: MinIO secret key
// - S3_UPLOADS_REGION: Region (default: us-east-1)
// - S3_UPLOADS_USE_PATH_STYLE: Use path style URLs (true for MinIO)

// The human made S3 Uploads plugin reads these environment variables directly
// No additional configuration is needed if the plugin is installed

// Alternative: WP Offload Media Lite configuration
// define('AS3CF_SETTINGS', serialize(array(
//     'provider' => 'aws',
//     'access-key-id' => getenv('S3_UPLOADS_KEY'),
//     'secret-access-key' => getenv('S3_UPLOADS_SECRET'),
// )));

echo "MinIO configuration loaded from environment variables.\n";
echo "S3_UPLOADS_ENDPOINT: " . getenv('S3_UPLOADS_ENDPOINT') . "\n";
echo "S3_UPLOADS_BUCKET: " . getenv('S3_UPLOADS_BUCKET') . "\n";
