<?php
/**
 * Plugin Name: WP PaaS Path Fixer
 * Description: Fixes WordPress URL generation for path-based hosting behind reverse proxy
 * Version: 1.1.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Get path prefix from WP_HOME
function wp_paas_get_path_prefix()
{
    static $prefix = null;
    if ($prefix === null) {
        $home_url = defined('WP_HOME') ? WP_HOME : get_option('home');
        $parsed = parse_url($home_url);
        $prefix = isset($parsed['path']) ? rtrim($parsed['path'], '/') : '';
    }
    return $prefix;
}

/**
 * Fix $_SERVER variables EARLY - before WordPress processes them
 */
add_action('muplugins_loaded', function () {
    $path_prefix = wp_paas_get_path_prefix();
    if (empty($path_prefix))
        return;

    // Fix REQUEST_URI
    if (isset($_SERVER['REQUEST_URI']) && strpos($_SERVER['REQUEST_URI'], $path_prefix) !== 0) {
        $_SERVER['REQUEST_URI'] = $path_prefix . $_SERVER['REQUEST_URI'];
    }

    // Fix SCRIPT_NAME
    if (isset($_SERVER['SCRIPT_NAME']) && strpos($_SERVER['SCRIPT_NAME'], $path_prefix) !== 0) {
        $_SERVER['SCRIPT_NAME'] = $path_prefix . $_SERVER['SCRIPT_NAME'];
    }

    // Fix PHP_SELF
    if (isset($_SERVER['PHP_SELF']) && strpos($_SERVER['PHP_SELF'], $path_prefix) !== 0) {
        $_SERVER['PHP_SELF'] = $path_prefix . $_SERVER['PHP_SELF'];
    }
}, 1);

/**
 * Fix ALL redirects - this is the main fix for wp-admin
 */
add_filter('wp_redirect', function ($location, $status = 302) {
    $path_prefix = wp_paas_get_path_prefix();
    if (empty($path_prefix))
        return $location;

    // Parse the redirect location
    $parsed = parse_url($location);
    if (!isset($parsed['path']))
        return $location;

    // Get home URL for comparison
    $home = defined('WP_HOME') ? WP_HOME : get_option('home');
    $home_parsed = parse_url($home);
    $home_host = isset($home_parsed['host']) ? $home_parsed['host'] : '';

    // Check if this is a local redirect (no host or same host)
    $location_host = isset($parsed['host']) ? $parsed['host'] : '';
    $is_local = empty($location_host) || $location_host === $home_host;

    if ($is_local) {
        $path = $parsed['path'];

        // If path doesn't start with prefix, add it
        if (strpos($path, $path_prefix) !== 0) {
            // Build new URL with prefix
            $scheme = isset($parsed['scheme']) ? $parsed['scheme'] . '://' : '';
            $host = isset($parsed['host']) ? $parsed['host'] : '';
            $port = isset($parsed['port']) ? ':' . $parsed['port'] : '';
            $query = isset($parsed['query']) ? '?' . $parsed['query'] : '';
            $fragment = isset($parsed['fragment']) ? '#' . $parsed['fragment'] : '';

            $location = $scheme . $host . $port . $path_prefix . $path . $query . $fragment;
        }
    }

    return $location;
}, 1, 2);

/**
 * Fix admin_url - critical for wp-admin links
 */
add_filter('admin_url', function ($url, $path = '', $blog_id = null) {
    $path_prefix = wp_paas_get_path_prefix();
    if (empty($path_prefix))
        return $url;

    // Parse URL
    $parsed = parse_url($url);
    if (!isset($parsed['path']))
        return $url;

    // Check if path already has prefix
    if (strpos($parsed['path'], $path_prefix) === 0)
        return $url;

    // Add prefix to path
    $scheme = isset($parsed['scheme']) ? $parsed['scheme'] . '://' : '';
    $host = isset($parsed['host']) ? $parsed['host'] : '';
    $port = isset($parsed['port']) ? ':' . $parsed['port'] : '';
    $query = isset($parsed['query']) ? '?' . $parsed['query'] : '';

    return $scheme . $host . $port . $path_prefix . $parsed['path'] . $query;
}, 1, 3);

/**
 * Fix login_url
 */
add_filter('login_url', function ($url, $redirect = '', $force_reauth = false) {
    $path_prefix = wp_paas_get_path_prefix();
    if (empty($path_prefix))
        return $url;

    $parsed = parse_url($url);
    if (!isset($parsed['path']))
        return $url;

    if (strpos($parsed['path'], $path_prefix) === 0)
        return $url;

    $scheme = isset($parsed['scheme']) ? $parsed['scheme'] . '://' : '';
    $host = isset($parsed['host']) ? $parsed['host'] : '';
    $port = isset($parsed['port']) ? ':' . $parsed['port'] : '';
    $query = isset($parsed['query']) ? '?' . $parsed['query'] : '';

    return $scheme . $host . $port . $path_prefix . $parsed['path'] . $query;
}, 1, 3);

/**
 * Fix logout_url
 */
add_filter('logout_url', function ($url, $redirect = '') {
    $path_prefix = wp_paas_get_path_prefix();
    if (empty($path_prefix))
        return $url;

    $parsed = parse_url($url);
    if (!isset($parsed['path']))
        return $url;

    if (strpos($parsed['path'], $path_prefix) === 0)
        return $url;

    $scheme = isset($parsed['scheme']) ? $parsed['scheme'] . '://' : '';
    $host = isset($parsed['host']) ? $parsed['host'] : '';
    $port = isset($parsed['port']) ? ':' . $parsed['port'] : '';
    $query = isset($parsed['query']) ? '?' . $parsed['query'] : '';

    return $scheme . $host . $port . $path_prefix . $parsed['path'] . $query;
}, 1, 2);

/**
 * Fix network_admin_url
 */
add_filter('network_admin_url', function ($url, $path = '') {
    $path_prefix = wp_paas_get_path_prefix();
    if (empty($path_prefix))
        return $url;

    $parsed = parse_url($url);
    if (!isset($parsed['path']))
        return $url;

    if (strpos($parsed['path'], $path_prefix) === 0)
        return $url;

    $scheme = isset($parsed['scheme']) ? $parsed['scheme'] . '://' : '';
    $host = isset($parsed['host']) ? $parsed['host'] : '';
    $port = isset($parsed['port']) ? ':' . $parsed['port'] : '';
    $query = isset($parsed['query']) ? '?' . $parsed['query'] : '';

    return $scheme . $host . $port . $path_prefix . $parsed['path'] . $query;
}, 1, 2);

/**
 * Fix self_admin_url
 */
add_filter('self_admin_url', function ($url, $path = '') {
    $path_prefix = wp_paas_get_path_prefix();
    if (empty($path_prefix))
        return $url;

    $parsed = parse_url($url);
    if (!isset($parsed['path']))
        return $url;

    if (strpos($parsed['path'], $path_prefix) === 0)
        return $url;

    $scheme = isset($parsed['scheme']) ? $parsed['scheme'] . '://' : '';
    $host = isset($parsed['host']) ? $parsed['host'] : '';
    $port = isset($parsed['port']) ? ':' . $parsed['port'] : '';
    $query = isset($parsed['query']) ? '?' . $parsed['query'] : '';

    return $scheme . $host . $port . $path_prefix . $parsed['path'] . $query;
}, 1, 2);
