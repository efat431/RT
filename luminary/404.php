<?php
/**
 * The template for displaying 404 pages (not found)
 *
 * @package Luminary
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
?>

<div class="site-container-narrow">
	<main id="primary" class="site-main full-width-layout">

		<section class="error-404 not-found" style="text-align: center; padding: 4rem 0;">
			
			<div style="font-family: var(--font-mono); font-size: clamp(4rem, 10vw, 8rem); font-weight: 800; line-height: 1; color: var(--color-accent); margin-bottom: 1rem; opacity: 0.9;">
				404
			</div>

			<header class="page-header" style="margin-bottom: 2rem;">
				<h1 class="page-title" style="margin-bottom: 1rem;">
					<?php esc_html_e( 'Page Not Found', 'luminary' ); ?>
				</h1>
				<p style="color: var(--color-text-muted); font-size: 1.15rem; max-width: 500px; margin: 0 auto;">
					<?php esc_html_e( 'The resource you requested may have moved, been deleted, or never existed in this domain structure.', 'luminary' ); ?>
				</p>
			</header><!-- .page-header -->

			<div class="page-content" style="max-width: 480px; margin: 0 auto;">
				<div style="margin-bottom: 2.5rem;">
					<?php get_search_form(); ?>
				</div>

				<div style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
					<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="btn btn-primary">
						<?php esc_html_e( 'Return to Homepage', 'luminary' ); ?>
					</a>
					<a href="<?php echo esc_url( home_url( '/#insights' ) ); ?>" class="btn btn-secondary">
						<?php esc_html_e( 'Browse Recent Articles', 'luminary' ); ?>
					</a>
				</div>
			</div><!-- .page-content -->

		</section><!-- .error-404 -->

	</main><!-- #primary -->
</div><!-- .site-container-narrow -->

<?php
get_footer();
