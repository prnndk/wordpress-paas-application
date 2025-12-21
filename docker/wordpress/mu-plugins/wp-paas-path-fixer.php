<?php
/**
 * Plugin Name: WP PaaS Path Fixer
 * Description: Fixes path handling for WordPress behind Traefik with path stripping
 * Version: 6.0.0
 * 
 * This plugin:
 * 1. Overrides $_SERVER variables so WordPress knows it's at a subpath
 * 2. Fixes cookie paths to prevent login redirect loops
 * 3. Disables canonical redirects that can cause loops
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

    // ===========================================================================
    // CRITICAL FIX: Set cookie paths BEFORE WordPress defines them
    // This prevents login redirect loops when using path-based routing
    // 
    // Without this, WordPress sets cookies with path '/' but browser accesses
    // via '/subdomain/' causing cookie mismatch and authentication failures.
    // ===========================================================================

    // Cookie paths must include the prefix for the browser to send them correctly
    if (!defined('COOKIEPATH')) {
        define('COOKIEPATH', $prefix . '/');
    }
    if (!defined('SITECOOKIEPATH')) {
        define('SITECOOKIEPATH', $prefix . '/');
    }
    if (!defined('ADMIN_COOKIE_PATH')) {
        define('ADMIN_COOKIE_PATH', $prefix . '/wp-admin');
    }
    if (!defined('PLUGINS_COOKIE_PATH')) {
        define('PLUGINS_COOKIE_PATH', $prefix . '/wp-content/plugins');
    }

    // Disable canonical redirects - WordPress tries to redirect to "correct" URL
    // This causes infinite redirects when behind reverse proxy
    add_filter('redirect_canonical', '__return_false');

    // Fix login redirect URL to include prefix
    add_filter('login_redirect', function ($redirect_to, $requested_redirect_to, $user) use ($prefix) {
        // If redirect_to doesn't have the prefix, add it
        if (!empty($redirect_to) && strpos($redirect_to, $prefix) === false) {
            $parsed = parse_url($redirect_to);
            if (isset($parsed['path'])) {
                $scheme = isset($parsed['scheme']) ? $parsed['scheme'] . '://' : '';
                $host = isset($parsed['host']) ? $parsed['host'] : '';
                $port = isset($parsed['port']) ? ':' . $parsed['port'] : '';
                $query = isset($parsed['query']) ? '?' . $parsed['query'] : '';
                $redirect_to = $scheme . $host . $port . $prefix . $parsed['path'] . $query;
            }
        }
        return $redirect_to;
    }, 10, 3);

    // Also disable HTTPS redirect if not using SSL
    if (!is_ssl()) {
        add_filter('wp_redirect', function ($location) use ($prefix) {
            // Ensure redirects keep the prefix
            if (strpos($location, $prefix) === false) {
                $parsed = parse_url($location);
                // Catch all WP-related paths: /wp-admin, /wp-login.php, /wp-content, etc.
                if (isset($parsed['path']) && (
                    strpos($parsed['path'], '/wp-admin') === 0 ||
                    strpos($parsed['path'], '/wp-login') === 0 ||
                    strpos($parsed['path'], '/wp-content') === 0 ||
                    strpos($parsed['path'], '/wp-includes') === 0
                )) {
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

    // Fix logout URL to include prefix
    add_filter('logout_url', function ($logout_url, $redirect) use ($prefix) {
        if (strpos($logout_url, $prefix) === false) {
            $parsed = parse_url($logout_url);
            if (isset($parsed['path'])) {
                $scheme = isset($parsed['scheme']) ? $parsed['scheme'] . '://' : '';
                $host = isset($parsed['host']) ? $parsed['host'] : '';
                $port = isset($parsed['port']) ? ':' . $parsed['port'] : '';
                $query = isset($parsed['query']) ? '?' . $parsed['query'] : '';
                $logout_url = $scheme . $host . $port . $prefix . $parsed['path'] . $query;
            }
        }
        return $logout_url;
    }, 10, 2);
}

