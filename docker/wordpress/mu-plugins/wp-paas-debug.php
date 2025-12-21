<?php
/**
 * Plugin Name: WP PaaS Debug
 * Description: Debug path-based routing issues
 * Version: 1.0.0
 */

// Log request info to file for debugging
$debug_file = '/tmp/wp-paas-debug.log';
$debug_info = date('Y-m-d H:i:s') . " | ";
$debug_info .= "REQUEST_URI: " . ($_SERVER['REQUEST_URI'] ?? 'N/A') . " | ";
$debug_info .= "ORIGINAL_REQUEST_URI: " . ($_SERVER['ORIGINAL_REQUEST_URI'] ?? 'N/A') . " | ";
$debug_info .= "SCRIPT_NAME: " . ($_SERVER['SCRIPT_NAME'] ?? 'N/A') . " | ";
$debug_info .= "PHP_SELF: " . ($_SERVER['PHP_SELF'] ?? 'N/A') . " | ";
$debug_info .= "WP_HOME: " . (defined('WP_HOME') ? WP_HOME : 'N/A') . "\n";

file_put_contents($debug_file, $debug_info, FILE_APPEND);

// Also output to error log
error_log("[WP-PaaS Debug] " . $debug_info);
