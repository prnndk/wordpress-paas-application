<?php
/**
 * Plugin Name: WP PaaS Path Fixer
 * Description: Fixes WordPress URL generation for path-based hosting behind reverse proxy
 * Version: 1.0.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Fix $_SERVER variables for path-based routing
 * This runs early to ensure WordPress sees the correct URL
 */
add_action('muplugins_loaded', function () {
    // Get the path prefix from WP_HOME or WP_SITEURL
    $home_url = defined('WP_HOME') ? WP_HOME : get_option('home');
    $parsed = parse_url($home_url);
    $path_prefix = isset($parsed['path']) ? rtrim($parsed['path'], '/') : '';

    if (empty($path_prefix)) {
        return;
    }

    // Fix REQUEST_URI if it doesn't include the prefix
    if (isset($_SERVER['REQUEST_URI']) && strpos($_SERVER['REQUEST_URI'], $path_prefix) !== 0) {
        $_SERVER['REQUEST_URI'] = $path_prefix . $_SERVER['REQUEST_URI'];
    }

    // Also fix SCRIPT_NAME if needed
    if (isset($_SERVER['SCRIPT_NAME']) && strpos($_SERVER['SCRIPT_NAME'], $path_prefix) !== 0) {
        $_SERVER['SCRIPT_NAME'] = $path_prefix . $_SERVER['SCRIPT_NAME'];
    }

    // Fix PHP_SELF
    if (isset($_SERVER['PHP_SELF']) && strpos($_SERVER['PHP_SELF'], $path_prefix) !== 0) {
        $_SERVER['PHP_SELF'] = $path_prefix . $_SERVER['PHP_SELF'];
    }
}, 1);

/**
 * Filter redirect URLs to include path prefix
 */
add_filter('wp_redirect', function ($location) {
    $home_url = defined('WP_HOME') ? WP_HOME : get_option('home');
    $parsed = parse_url($home_url);
    $path_prefix = isset($parsed['path']) ? rtrim($parsed['path'], '/') : '';

    if (empty($path_prefix)) {
        return $location;
    }

    // Parse the redirect location
    $location_parsed = parse_url($location);

    // Only fix relative paths or paths on the same host
    if (!isset($location_parsed['host']) || $location_parsed['host'] === $parsed['host']) {
        $location_path = isset($location_parsed['path']) ? $location_parsed['path'] : '/';

        // If path doesn't start with prefix, add it
        if (strpos($location_path, $path_prefix) !== 0) {
            $location_parsed['path'] = $path_prefix . $location_path;

            // Rebuild URL
            $scheme = isset($location_parsed['scheme']) ? $location_parsed['scheme'] . '://' : '';
            $host = isset($location_parsed['host']) ? $location_parsed['host'] : '';
            $port = isset($location_parsed['port']) ? ':' . $location_parsed['port'] : '';
            $path = $location_parsed['path'];
            $query = isset($location_parsed['query']) ? '?' . $location_parsed['query'] : '';
            $fragment = isset($location_parsed['fragment']) ? '#' . $location_parsed['fragment'] : '';

            $location = $scheme . $host . $port . $path . $query . $fragment;
        }
    }

    return $location;
}, 1);

/**
 * Fix admin URL generation
 */
add_filter('admin_url', function ($url, $path, $blog_id) {
    $home_url = defined('WP_HOME') ? WP_HOME : get_option('home');
    $parsed = parse_url($home_url);
    $path_prefix = isset($parsed['path']) ? rtrim($parsed['path'], '/') : '';

    if (empty($path_prefix)) {
        return $url;
    }

    // Ensure admin URL includes path prefix
    $url_parsed = parse_url($url);
    if (isset($url_parsed['path']) && strpos($url_parsed['path'], $path_prefix) !== 0) {
        // URL doesn't have prefix, we need to add it
        $url = str_replace($url_parsed['path'], $path_prefix . $url_parsed['path'], $url);
    }

    return $url;
}, 1, 3);
