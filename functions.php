<?php
/**
 * Luminary functions and definitions
 *
 * @package Luminary
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

define( 'LUMINARY_VERSION', '1.0.0' );

/**
 * Sets up theme defaults and registers support for various WordPress features.
 */
function luminary_setup() {
	// Make theme available for translation.
	load_theme_textdomain( 'luminary', get_template_directory() . '/languages' );

	// Add default posts and comments RSS feed links to head.
	add_theme_support( 'automatic-feed-links' );

	// Let WordPress manage the document title.
	add_theme_support( 'title-tag' );

	// Enable support for Post Thumbnails on posts and pages.
	add_theme_support( 'post-thumbnails' );
	set_post_thumbnail_size( 1200, 675, true );
	add_image_size( 'luminary-card', 800, 500, true );
	add_image_size( 'luminary-square', 600, 600, true );

	// Register navigation menus.
	register_nav_menus(
		array(
			'primary' => esc_html__( 'Primary Navigation', 'luminary' ),
			'footer'  => esc_html__( 'Footer Navigation', 'luminary' ),
		)
	);

	// Switch default core markup for search form, comment form, and comments to valid HTML5.
	add_theme_support(
		'html5',
		array(
			'search-form',
			'comment-form',
			'comment-list',
			'gallery',
			'caption',
			'style',
			'script',
		)
	);

	// Set up the WordPress core custom logo feature.
	add_theme_support(
		'custom-logo',
		array(
			'height'      => 80,
			'width'       => 280,
			'flex-width'  => true,
			'flex-height' => true,
		)
	);

	// Add theme support for selective refresh for widgets.
	add_theme_support( 'customize-selective-refresh-widgets' );

	// Add support for Block Styles and wide alignments.
	add_theme_support( 'align-wide' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'editor-styles' );
	add_editor_style( 'assets/css/main.css' );
}
add_action( 'after_setup_theme', 'luminary_setup' );

/**
 * Set the content width in pixels, based on the theme's design and stylesheet.
 */
function luminary_content_width() {
	$GLOBALS['content_width'] = apply_filters( 'luminary_content_width', 1200 );
}
add_action( 'after_setup_theme', 'luminary_content_width', 0 );

/**
 * Register widget areas.
 */
function luminary_widgets_init() {
	register_sidebar(
		array(
			'name'          => esc_html__( 'Primary Sidebar', 'luminary' ),
			'id'            => 'primary-sidebar',
			'description'   => esc_html__( 'Widgets displayed in the primary sidebar for single posts and archives.', 'luminary' ),
			'before_widget' => '<section id="%1$s" class="widget %2$s">',
			'after_widget'  => '</section>',
			'before_title'  => '<h3 class="widget-title">',
			'after_title'   => '</h3>',
		)
	);

	register_sidebar(
		array(
			'name'          => esc_html__( 'Footer Column 1', 'luminary' ),
			'id'            => 'footer-1',
			'description'   => esc_html__( 'First footer widget column.', 'luminary' ),
			'before_widget' => '<div id="%1$s" class="footer-widget %2$s">',
			'after_widget'  => '</div>',
			'before_title'  => '<h4 class="widget-title">',
			'after_title'   => '</h4>',
		)
	);

	register_sidebar(
		array(
			'name'          => esc_html__( 'Footer Column 2', 'luminary' ),
			'id'            => 'footer-2',
			'description'   => esc_html__( 'Second footer widget column.', 'luminary' ),
			'before_widget' => '<div id="%1$s" class="footer-widget %2$s">',
			'after_widget'  => '</div>',
			'before_title'  => '<h4 class="widget-title">',
			'after_title'   => '</h4>',
		)
	);

	register_sidebar(
		array(
			'name'          => esc_html__( 'Footer Column 3', 'luminary' ),
			'id'            => 'footer-3',
			'description'   => esc_html__( 'Third footer widget column.', 'luminary' ),
			'before_widget' => '<div id="%1$s" class="footer-widget %2$s">',
			'after_widget'  => '</div>',
			'before_title'  => '<h4 class="widget-title">',
			'after_title'   => '</h4>',
		)
	);
}
add_action( 'widgets_init', 'luminary_widgets_init' );

/**
 * Enqueue scripts and styles.
 */
function luminary_scripts() {
	// Google Fonts: Syne and Plus Jakarta Sans
	wp_enqueue_style(
		'luminary-google-fonts',
		'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@500;600&display=swap',
		array(),
		null
	);

	// Primary Theme Stylesheet
	wp_enqueue_style(
		'luminary-main',
		get_template_directory_uri() . '/assets/css/main.css',
		array(),
		LUMINARY_VERSION
	);

	// Root style.css
	wp_enqueue_style(
		'luminary-style',
		get_stylesheet_uri(),
		array( 'luminary-main' ),
		LUMINARY_VERSION
	);

	// Vanilla JavaScript
	wp_enqueue_script(
		'luminary-scripts',
		get_template_directory_uri() . '/assets/js/main.js',
		array(),
		LUMINARY_VERSION,
		true
	);

	// Comment reply script for threaded comments
	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 'luminary_scripts' );

/**
 * Custom template tags for this theme.
 */

// Post Publication Date
if ( ! function_exists( 'luminary_posted_on' ) ) :
	function luminary_posted_on() {
		$time_string = '<time class="entry-date published updated" datetime="%1$s">%2$s</time>';
		if ( get_the_time( 'U' ) !== get_the_modified_time( 'U' ) ) {
			$time_string = '<time class="entry-date published" datetime="%1$s">%2$s</time>';
		}

		$time_string = sprintf(
			$time_string,
			esc_attr( get_the_date( DATE_W3C ) ),
			esc_html( get_the_date() )
		);

		echo '<span class="posted-on">' . $time_string . '</span>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	}
endif;

// Post Author
if ( ! function_exists( 'luminary_posted_by' ) ) :
	function luminary_posted_by() {
		echo '<span class="byline">' . esc_html__( 'by', 'luminary' ) . ' <span class="author vcard"><a class="url fn n" href="' . esc_url( get_author_posts_url( get_the_author_meta( 'ID' ) ) ) . '">' . esc_html( get_the_author() ) . '</a></span></span>';
	}
endif;

// Estimated reading time in minutes
if ( ! function_exists( 'luminary_reading_time' ) ) :
	function luminary_reading_time() {
		$content = get_post_field( 'post_content', get_the_ID() );
		$word_count = str_word_count( strip_tags( $content ) );
		$reading_time = ceil( $word_count / 200 );
		return max( 1, $reading_time ) . ' min read';
	}
endif;

// Post footer tags and categories
if ( ! function_exists( 'luminary_entry_footer' ) ) :
	function luminary_entry_footer() {
		if ( 'post' === get_post_type() ) {
			$categories_list = get_the_category_list( esc_html__( ', ', 'luminary' ) );
			if ( $categories_list ) {
				printf( '<span class="cat-links">' . esc_html__( 'Categorized in %1$s', 'luminary' ) . '</span> ', $categories_list ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			}

			$tags_list = get_the_tag_list( '', esc_html_x( ', ', 'list item separator', 'luminary' ) );
			if ( $tags_list ) {
				printf( '<span class="tags-links">' . esc_html__( 'Tagged %1$s', 'luminary' ) . '</span>', $tags_list ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			}
		}
	}
endif;

// Numbered pagination output
if ( ! function_exists( 'luminary_pagination' ) ) :
	function luminary_pagination() {
		the_posts_pagination(
			array(
				'mid_size'           => 2,
				'prev_text'          => esc_html__( '← Previous', 'luminary' ),
				'next_text'          => esc_html__( 'Next →', 'luminary' ),
				'screen_reader_text' => esc_html__( 'Posts navigation', 'luminary' ),
			)
		);
	}
endif;

/**
 * Customizer Additions
 */
function luminary_customize_register( $wp_customize ) {
	$wp_customize->add_section(
		'luminary_theme_options',
		array(
			'title'    => esc_html__( 'Theme Options & Hero', 'luminary' ),
			'priority' => 30,
		)
	);

	// Hero Headline Setting
	$wp_customize->add_setting(
		'luminary_hero_title',
		array(
			'default'           => 'Architecture, strategy & digital experiences engineered for impact.',
			'sanitize_callback' => 'sanitize_text_field',
		)
	);

	$wp_customize->add_control(
		'luminary_hero_title',
		array(
			'label'    => esc_html__( 'Hero Headline', 'luminary' ),
			'section'  => 'luminary_theme_options',
			'type'     => 'textarea',
		)
	);

	// Hero Subtitle Setting
	$wp_customize->add_setting(
		'luminary_hero_subtitle',
		array(
			'default'           => 'We partner with ambitious organizations worldwide to construct enduring digital systems, high-converting platforms, and brand identities.',
			'sanitize_callback' => 'sanitize_textarea_field',
		)
	);

	$wp_customize->add_control(
		'luminary_hero_subtitle',
		array(
			'label'    => esc_html__( 'Hero Subtitle', 'luminary' ),
			'section'  => 'luminary_theme_options',
			'type'     => 'textarea',
		)
	);

	// Primary CTA Text
	$wp_customize->add_setting(
		'luminary_hero_cta_text',
		array(
			'default'           => 'Start a Project',
			'sanitize_callback' => 'sanitize_text_field',
		)
	);

	$wp_customize->add_control(
		'luminary_hero_cta_text',
		array(
			'label'    => esc_html__( 'CTA Button Text', 'luminary' ),
			'section'  => 'luminary_theme_options',
			'type'     => 'text',
		)
	);

	// Primary CTA Link
	$wp_customize->add_setting(
		'luminary_hero_cta_link',
		array(
			'default'           => '#contact',
			'sanitize_callback' => 'esc_url_raw',
		)
	);

	$wp_customize->add_control(
		'luminary_hero_cta_link',
		array(
			'label'    => esc_html__( 'CTA Button URL', 'luminary' ),
			'section'  => 'luminary_theme_options',
			'type'     => 'url',
		)
	);
}
add_action( 'customize_register', 'luminary_customize_register' );
