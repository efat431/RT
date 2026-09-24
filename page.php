<?php
/**
 * The template for displaying all static pages
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

		<?php
		while ( have_posts() ) :
			the_post();
			?>

			<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
				
				<header class="entry-header" style="margin-bottom: 2.5rem; text-align: center;">
					<h1 class="entry-title" style="font-size: clamp(2.25rem, 4vw, 3.5rem); margin-bottom: 1rem;">
						<?php the_title(); ?>
					</h1>
					<?php if ( has_excerpt() ) : ?>
						<p class="entry-lead" style="font-size: 1.2rem; color: var(--color-text-muted); max-width: 650px; margin: 0 auto;">
							<?php echo get_the_excerpt(); ?>
						</p>
					<?php endif; ?>
				</header><!-- .entry-header -->

				<?php if ( has_post_thumbnail() ) : ?>
					<div class="post-featured-image" style="margin-bottom: 3rem;">
						<?php the_post_thumbnail( 'full' ); ?>
					</div>
				<?php endif; ?>

				<div class="entry-content">
					<?php
					the_content();

					wp_link_pages(
						array(
							'before' => '<div class="page-links">' . esc_html__( 'Pages:', 'luminary' ),
							'after'  => '</div>',
						)
					);
					?>
				</div><!-- .entry-content -->

				<?php if ( get_edit_post_link() ) : ?>
					<footer class="entry-footer" style="margin-top: 3rem; padding-top: 1rem; border-top: 1px solid var(--color-border-subtle); font-size: 0.85rem;">
						<?php
						edit_post_link(
							sprintf(
								wp_kses(
									/* translators: %s: Name of current post. Only visible to screen readers */
									__( 'Edit <span class="screen-reader-text">%s</span>', 'luminary' ),
									array(
										'span' => array(
											'class' => array(),
										),
									)
								),
								wp_kses_post( get_the_title() )
							),
							'<span class="edit-link">',
							'</span>'
						);
						?>
					</footer><!-- .entry-footer -->
				<?php endif; ?>

			</article><!-- #post-<?php the_ID(); ?> -->

			<?php
			// If comments are open or we have at least one comment, load up the comment template.
			if ( comments_open() || get_comments_number() ) :
				comments_template();
			endif;

		endwhile; // End of the loop.
		?>

	</main><!-- #primary -->
</div><!-- .site-container-narrow -->

<?php
get_footer();
