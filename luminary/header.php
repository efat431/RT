<?php
/**
 * The header for our theme
 *
 * Displays all of the <head> section and everything up till <div id="content">
 *
 * @package Luminary
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="profile" href="https://gmpg.org/xfn/11">
	<?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<div id="page" class="site">
	<a class="skip-link screen-reader-text" href="#primary"><?php esc_html_e( 'Skip to content', 'luminary' ); ?></a>

	<header id="masthead" class="site-header">
		<div class="site-container site-header-inner">
			
			<!-- Zone 1: Brand Mark / Wordmark -->
			<div class="site-branding">
				<?php
				if ( has_custom_logo() ) :
					the_custom_logo();
				else :
					?>
					<a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home" class="site-title-link">
						<span class="site-title"><?php bloginfo( 'name' ); ?></span>
					</a>
					<?php
				endif;
				?>
			</div><!-- .site-branding -->

			<!-- Zone 2: Primary Navigation -->
			<nav id="site-navigation" class="main-navigation" aria-label="<?php esc_attr_e( 'Primary Navigation', 'luminary' ); ?>">
				<?php
				wp_nav_menu(
					array(
						'theme_location' => 'primary',
						'menu_id'        => 'primary-menu',
						'menu_class'     => 'nav-menu',
						'fallback_cb'    => function() {
							echo '<ul id="primary-menu" class="nav-menu">';
							echo '<li class="' . ( is_front_page() ? 'current-menu-item' : '' ) . '"><a href="' . esc_url( home_url( '/' ) ) . '">' . esc_html__( 'Home', 'luminary' ) . '</a></li>';
							echo '<li class="' . ( is_page( 'services' ) ? 'current-menu-item' : '' ) . '"><a href="' . esc_url( home_url( '/#services' ) ) . '">' . esc_html__( 'Capabilities', 'luminary' ) . '</a></li>';
							echo '<li class="' . ( is_page( 'work' ) ? 'current-menu-item' : '' ) . '"><a href="' . esc_url( home_url( '/#work' ) ) . '">' . esc_html__( 'Selected Work', 'luminary' ) . '</a></li>';
							echo '<li class="' . ( is_home() || is_singular( 'post' ) ? 'current-menu-item' : '' ) . '"><a href="' . esc_url( home_url( '/#insights' ) ) . '">' . esc_html__( 'Insights', 'luminary' ) . '</a></li>';
							echo '<li><a href="' . esc_url( home_url( '/#contact' ) ) . '">' . esc_html__( 'Contact', 'luminary' ) . '</a></li>';
							echo '</ul>';
						},
					)
				);
				?>
			</nav><!-- #site-navigation -->

			<!-- Zone 3: Header Actions -->
			<div class="header-actions">
				<a href="<?php echo esc_url( get_theme_mod( 'luminary_hero_cta_link', '#contact' ) ); ?>" class="btn btn-primary">
					<?php echo esc_html( get_theme_mod( 'luminary_hero_cta_text', __( 'Start a Project', 'luminary' ) ) ); ?>
				</a>

				<button class="menu-toggle" aria-controls="site-navigation" aria-expanded="false" aria-label="<?php esc_attr_e( 'Toggle navigation menu', 'luminary' ); ?>">
					<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="3" y1="12" x2="21" y2="12"></line>
						<line x1="3" y1="6" x2="21" y2="6"></line>
						<line x1="3" y1="18" x2="21" y2="18"></line>
					</svg>
				</button>
			</div>

		</div><!-- .site-container -->
	</header><!-- #masthead -->

	<div id="content" class="site-content">
