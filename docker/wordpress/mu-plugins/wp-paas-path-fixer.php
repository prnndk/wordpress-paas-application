<?php
/**
 * Plugin Name: WP PaaS Path Fixer
 * Description: Fixes path handling for WordPress behind Traefik with path stripping
 * Version: 5.0.0
 * 
 * This plugin:
 * 1. Overrides $_SERVER variables so WordPress knows it's at a subpath
 * 2. Disables canonical redirects that can cause loops
 * 
 * Works with Traefik StripPrefix middleware
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Get path prefix from environment variable
$wp_paas_path_prefix = getenv('WP_PAAS_PATH_PREFIX');
if (!empty($wp_paas_path_prefix)) {
    $prefix = rtrim($wp_paas_path_prefix, '/');

    // CRITICAL: Override $_SERVER variables BEFORE WordPress processes them
    // This tells WordPress it's running at the subpath, not at root

    // Fix REQUEST_URI - add prefix back
    if (isset($_SERVER['REQUEST_URI']) && strpos($_SERVER['REQUEST_URI'], $prefix) !== 0) {
        $_SERVER['REQUEST_URI'] = $prefix . $_SERVER['REQUEST_URI'];
    }

    // Fix SCRIPT_NAME
    if (isset($_SERVER['SCRIPT_NAME']) && strpos($_SERVER['SCRIPT_NAME'], $prefix) !== 0) {
        $_SERVER['SCRIPT_NAME'] = $prefix . $_SERVER['SCRIPT_NAME'];
    }

    // Fix PHP_SELF
    if (isset($_SERVER['PHP_SELF']) && strpos($_SERVER['PHP_SELF'], $prefix) !== 0) {
        $_SERVER['PHP_SELF'] = $prefix . $_SERVER['PHP_SELF'];
    }

    // Fix PATH_INFO if set
    if (isset($_SERVER['PATH_INFO']) && strpos($_SERVER['PATH_INFO'], $prefix) !== 0) {
        $_SERVER['PATH_INFO'] = $prefix . $_SERVER['PATH_INFO'];
    }

    // Disable canonical redirects - WordPress tries to redirect to "correct" URL
    // This causes infinite redirects when behind reverse proxy
    add_filter('redirect_canonical', '__return_false');

    // Also disable HTTPS redirect if not using SSL
    if (!is_ssl()) {
        add_filter('wp_redirect', function ($location) use ($prefix) {
            // Ensure redirects keep the prefix
            if (strpos($location, $prefix) === false) {
                $parsed = parse_url($location);
                if (isset($parsed['path']) && strpos($parsed['path'], '/wp-') === 0) {
                    // This is a WordPress internal redirect without prefix
                    $scheme = isset($parsed['scheme']) ? $parsed['scheme'] . '://' : 'http://';
                    $host = isset($parsed['host']) ? $parsed['host'] : $_SERVER['HTTP_HOST'];
                    $port = isset($parsed['port']) ? ':' . $parsed['port'] : '';
                    $query = isset($parsed['query']) ? '?' . $parsed['query'] : '';
                    $location = $scheme . $host . $port . $prefix . $parsed['path'] . $query;
                }
            }
            return $location;
        }, 1);
    }
}
