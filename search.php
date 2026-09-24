<?php
/**
 * The template for displaying search results pages
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

			<?php if ( have_posts() ) : ?>

				<header class="page-header" style="margin-bottom: 3rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--color-border-subtle);">
					<span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--color-accent); text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 0.5rem;">
						<?php esc_html_e( 'Search Query', 'luminary' ); ?>
					</span>
					
					<h1 class="page-title">
						<?php
						/* translators: %s: search query. */
						printf( esc_html__( 'Search Results for: %s', 'luminary' ), '<span style="color: var(--color-accent);">&ldquo;' . get_search_query() . '&rdquo;</span>' );
						?>
					</h1>
				</header><!-- .page-header -->

				<div class="posts-grid" style="display: grid; grid-template-columns: 1fr; gap: 2.5rem;">
					<?php
					while ( have_posts() ) :
						the_post();
						?>
						<article id="post-<?php the_ID(); ?>" <?php post_class( 'post-card' ); ?>>
							<div class="post-card-body">
								<div class="post-meta-clean">
									<span><?php luminary_posted_on(); ?></span>
									<span class="sep" aria-hidden="true">·</span>
									<span><?php echo esc_html( luminary_reading_time() ); ?></span>
								</div>

								<h2 class="post-card-title" style="font-size: 1.5rem; margin-bottom: 0.75rem;">
									<a href="<?php the_permalink(); ?>" style="color: var(--color-text-main);">
										<?php the_title(); ?>
									</a>
								</h2>

								<div class="post-card-excerpt" style="font-size: 0.95rem; line-height: 1.6;">
									<?php the_excerpt(); ?>
								</div>

								<div>
									<a href="<?php the_permalink(); ?>" class="btn btn-secondary" style="font-size: 0.825rem; padding: 0.5rem 1rem;">
										<?php esc_html_e( 'Read More →', 'luminary' ); ?>
									</a>
								</div>
							</div>
						</article>
					<?php endwhile; ?>
				</div>

				<?php luminary_pagination(); ?>

			<?php else : ?>

				<div class="no-posts-found" style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 3rem; text-align: center;">
					<h2 style="margin-bottom: 1rem; font-size: 1.8rem;"><?php esc_html_e( 'No Matches Found', 'luminary' ); ?></h2>
					<p style="margin-bottom: 2rem; color: var(--color-text-muted);">
						<?php esc_html_e( 'Sorry, but nothing matched your search terms. Please try again with some different keywords.', 'luminary' ); ?>
					</p>
					<div style="max-width: 450px; margin: 0 auto;">
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
