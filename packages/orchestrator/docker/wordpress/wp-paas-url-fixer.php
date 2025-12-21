<?php
/**
 * Plugin Name: WP-PaaS URL Fixer
 * Description: Forces correct path-based URLs for multi-tenant WordPress instances
 * Version: 1.0.0
 * Author: WP-PaaS
 */

// Get the correct URLs from environment or constants
$wp_home = getenv('WP_HOME') ?: (defined('WP_HOME') ? WP_HOME : '');
$wp_siteurl = getenv('WP_SITEURL') ?: (defined('WP_SITEURL') ? WP_SITEURL : '');

if ($wp_home && $wp_siteurl) {
    // Force home and siteurl options to use correct values
    add_filter('option_home', function() use ($wp_home) {
        return $wp_home;
    }, 1);
    
    add_filter('option_siteurl', function() use ($wp_siteurl) {
        return $wp_siteurl;
    }, 1);
    
    // Force pre_option to prevent database reads
    add_filter('pre_option_home', function() use ($wp_home) {
        return $wp_home;
    }, 1);
    
    add_filter('pre_option_siteurl', function() use ($wp_siteurl) {
        return $wp_siteurl;
    }, 1);
    
    // Force admin_url and site_url functions
    add_filter('admin_url', function($url) use ($wp_siteurl) {
        // Replace any incorrect base URL with correct one
        $parsed = parse_url($url);
        $correct_base = rtrim($wp_siteurl, '/');
        
        // Rebuild URL with correct base
        $path = isset($parsed['path']) ? $parsed['path'] : '';
        $query = isset($parsed['query']) ? '?' . $parsed['query'] : '';
        $fragment = isset($parsed['fragment']) ? '#' . $parsed['fragment'] : '';
        
        // If path doesn't already start with our subdirectory, this is a redirect we need to fix
        return $correct_base . $path . $query . $fragment;
    }, 1);
    
    add_filter('site_url', function($url) use ($wp_siteurl) {
        $parsed = parse_url($url);
        $correct_base = rtrim($wp_siteurl, '/');
        
        $path = isset($parsed['path']) ? $parsed['path'] : '';
        $query = isset($parsed['query']) ? '?' . $parsed['query'] : '';
        $fragment = isset($parsed['fragment']) ? '#' . $parsed['fragment'] : '';
        
        return $correct_base . $path . $query . $fragment;
    }, 1);
    
    add_filter('home_url', function($url) use ($wp_home) {
        $parsed = parse_url($url);
        $correct_base = rtrim($wp_home, '/');
        
        $path = isset($parsed['path']) ? $parsed['path'] : '';
        $query = isset($parsed['query']) ? '?' . $parsed['query'] : '';
        $fragment = isset($parsed['fragment']) ? '#' . $parsed['fragment'] : '';
        
        return $correct_base . $path . $query . $fragment;
    }, 1);
}
