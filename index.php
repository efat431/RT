<?php
/**
 * The main template file
 *
 * This is the most generic template file in a WordPress theme
 * and one of the two required files for a theme (the other being style.css).
 *
 * @package Luminary
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
?>

<div class="site-container">
	<div class="content-sidebar-layout">
		
		<main id="primary" class="site-main">
			
			<header class="page-header" style="margin-bottom: 3rem;">
				<h1 class="page-title" style="font-size: clamp(2rem, 3.5vw, 2.75rem); margin-bottom: 0.75rem;">
					<?php
					if ( is_home() && ! is_front_page() ) :
						single_post_title();
					else :
						esc_html_e( 'Journal & Latest Insights', 'luminary' );
					endif;
					?>
				</h1>
				<p style="color: var(--color-text-muted); font-size: 1.05rem;">
					<?php esc_html_e( 'Observations on architecture, systems engineering, design craft, and digital strategy.', 'luminary' ); ?>
				</p>
			</header>

			<?php if ( have_posts() ) : ?>
				
				<div class="posts-grid" style="display: grid; grid-template-columns: 1fr; gap: 2.5rem;">
					<?php
					while ( have_posts() ) :
						the_post();
						?>
						<article id="post-<?php the_ID(); ?>" <?php post_class( 'post-card' ); ?>>
							<?php if ( has_post_thumbnail() ) : ?>
								<div class="post-card-thumb" style="aspect-ratio: 16/9; max-height: 380px;">
									<a href="<?php the_permalink(); ?>">
										<?php the_post_thumbnail( 'luminary-card', array( 'alt' => the_title_attribute( 'echo=0' ) ) ); ?>
									</a>
								</div>
							<?php endif; ?>

							<div class="post-card-body">
								<div class="post-meta-clean">
									<?php
									$categories = get_the_category();
									if ( ! empty( $categories ) ) :
										?>
										<span style="color: var(--color-accent); font-weight: 600; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em;">
											<?php echo esc_html( $categories[0]->name ); ?>
										</span>
										<span class="sep" aria-hidden="true">·</span>
									<?php endif; ?>

									<span><?php luminary_posted_on(); ?></span>
									<span class="sep" aria-hidden="true">·</span>
									<span><?php echo esc_html( luminary_reading_time() ); ?></span>
								</div>

								<h2 class="post-card-title" style="font-size: 1.6rem; margin-bottom: 1rem;">
									<a href="<?php the_permalink(); ?>" style="color: var(--color-text-main);">
										<?php the_title(); ?>
									</a>
								</h2>

								<div class="post-card-excerpt" style="font-size: 0.95rem; line-height: 1.7;">
									<?php the_excerpt(); ?>
								</div>

								<div style="margin-top: 1rem;">
									<a href="<?php the_permalink(); ?>" class="btn btn-secondary" style="font-size: 0.825rem; padding: 0.5rem 1rem;">
										<?php esc_html_e( 'Read Article →', 'luminary' ); ?>
									</a>
								</div>
							</div>
						</article>
					<?php endwhile; ?>
				</div>

				<?php luminary_pagination(); ?>

			<?php else : ?>

				<div class="no-posts-found" style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 3rem; text-align: center;">
					<h3 style="margin-bottom: 1rem;"><?php esc_html_e( 'Nothing Found', 'luminary' ); ?></h3>
					<p style="margin-bottom: 1.5rem;"><?php esc_html_e( 'It seems we cannot find what you are looking for. Perhaps searching can help.', 'luminary' ); ?></p>
					<div style="max-width: 400px; margin: 0 auto;">
						<?php get_search_form(); ?>
					</div>
				</div>

			<?php endif; ?>

		</main><!-- #primary -->

		<?php get_sidebar(); ?>

	</div><!-- .content-sidebar-layout -->
</div><!-- .site-container -->

<?php
get_footer();
