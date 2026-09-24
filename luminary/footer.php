<?php
/**
 * The template for displaying the footer
 *
 * Contains the closing of the #content div and all content after.
 *
 * @package Luminary
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>

	</div><!-- #content -->

	<footer id="colophon" class="site-footer">
		<div class="site-container">
			
			<div class="footer-widgets">
				<!-- Footer Col 1 -->
				<div class="footer-column">
					<?php if ( is_active_sidebar( 'footer-1' ) ) : ?>
						<?php dynamic_sidebar( 'footer-1' ); ?>
					<?php else : ?>
						<h4 class="widget-title"><?php bloginfo( 'name' ); ?></h4>
						<p class="footer-desc" style="color: var(--color-text-muted); font-size: 0.9rem; max-width: 300px; margin-bottom: 1.5rem;">
							<?php bloginfo( 'description' ); ?>
						</p>
						<p style="font-size: 0.85rem; color: var(--color-text-faint);">
							hello@example.com<br>
							+1 (555) 234-8900
						</p>
					<?php endif; ?>
				</div>

				<!-- Footer Col 2 -->
				<div class="footer-column">
					<?php if ( is_active_sidebar( 'footer-2' ) ) : ?>
						<?php dynamic_sidebar( 'footer-2' ); ?>
					<?php else : ?>
						<h4 class="widget-title"><?php esc_html_e( 'Navigation', 'luminary' ); ?></h4>
						<ul style="list-style: none; display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.9rem;">
							<li><a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php esc_html_e( 'Home', 'luminary' ); ?></a></li>
							<li><a href="<?php echo esc_url( home_url( '/#services' ) ); ?>"><?php esc_html_e( 'Capabilities', 'luminary' ); ?></a></li>
							<li><a href="<?php echo esc_url( home_url( '/#work' ) ); ?>"><?php esc_html_e( 'Selected Work', 'luminary' ); ?></a></li>
							<li><a href="<?php echo esc_url( home_url( '/#insights' ) ); ?>"><?php esc_html_e( 'Insights & Journal', 'luminary' ); ?></a></li>
						</ul>
					<?php endif; ?>
				</div>

				<!-- Footer Col 3 -->
				<div class="footer-column">
					<?php if ( is_active_sidebar( 'footer-3' ) ) : ?>
						<?php dynamic_sidebar( 'footer-3' ); ?>
					<?php else : ?>
						<h4 class="widget-title"><?php esc_html_e( 'Capabilities', 'luminary' ); ?></h4>
						<ul style="list-style: none; display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.9rem; color: var(--color-text-muted);">
							<li><?php esc_html_e( 'Full-Stack Engineering', 'luminary' ); ?></li>
							<li><?php esc_html_e( 'Brand System Architecture', 'luminary' ); ?></li>
							<li><?php esc_html_e( 'Design Systems & UI/UX', 'luminary' ); ?></li>
							<li><?php esc_html_e( 'Headless WordPress & APIs', 'luminary' ); ?></li>
						</ul>
					<?php endif; ?>
				</div>
			</div><!-- .footer-widgets -->

			<div class="footer-bottom">
				<div class="site-info">
					&copy; <?php echo esc_html( date( 'Y' ) ); ?> <a href="<?php echo esc_url( home_url( '/' ) ); ?>"><?php bloginfo( 'name' ); ?></a>. <?php esc_html_e( 'All rights reserved.', 'luminary' ); ?>
				</div>

				<div class="footer-credits">
					<span style="color: var(--color-text-faint); font-size: 0.825rem;">
						<?php
						/* translators: 1: Theme name, 2: WordPress link */
						printf( esc_html__( 'Crafted with %1$s for %2$s', 'luminary' ), '<a href="https://example.com/luminary" rel="designer">Luminary</a>', '<a href="https://wordpress.org/">WordPress</a>' );
						?>
					</span>
				</div>
			</div><!-- .footer-bottom -->

		</div><!-- .site-container -->
	</footer><!-- #colophon -->

	<!-- Back to Top Button -->
	<button class="back-to-top" aria-label="<?php esc_attr_e( 'Scroll back to top', 'luminary' ); ?>" style="position: fixed; bottom: 2rem; right: 2rem; background: var(--color-surface-elevated); border: 1px solid var(--color-border); color: var(--color-text-main); width: 44px; height: 44px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 99; transition: all 0.2s; opacity: 0; pointer-events: none;">
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<polyline points="18 15 12 9 6 15"></polyline>
		</svg>
	</button>

</div><!-- #page -->

<style>
.back-to-top.is-visible {
	opacity: 1 !important;
	pointer-events: auto !important;
}
.back-to-top:hover {
	background: var(--color-accent) !important;
	color: #000 !important;
	border-color: var(--color-accent) !important;
}
</style>

<?php wp_footer(); ?>

</body>
</html>
