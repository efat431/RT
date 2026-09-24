<?php
/**
 * The template for displaying all single posts
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

			<?php
			while ( have_posts() ) :
				the_post();
				?>

				<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
					
					<header class="single-post-header">
						<!-- Category Label -->
						<div class="post-meta-clean" style="margin-bottom: 1rem;">
							<?php
							$categories = get_the_category();
							if ( ! empty( $categories ) ) :
								?>
								<a href="<?php echo esc_url( get_category_link( $categories[0]->term_id ) ); ?>" style="color: var(--color-accent); font-weight: 700; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.06em;">
									<?php echo esc_html( $categories[0]->name ); ?>
								</a>
								<span class="sep" aria-hidden="true">·</span>
							<?php endif; ?>

							<span><?php luminary_posted_on(); ?></span>
							<span class="sep" aria-hidden="true">·</span>
							<span><?php echo esc_html( luminary_reading_time() ); ?></span>
						</div>

						<h1 class="entry-title" style="margin-bottom: 1.5rem; line-height: 1.2;">
							<?php the_title(); ?>
						</h1>

						<!-- Author Byline -->
						<div style="display: flex; align-items: center; gap: 0.85rem; padding-bottom: 2rem; border-bottom: 1px solid var(--color-border-subtle);">
							<div style="width: 44px; height: 44px; border-radius: 50%; overflow: hidden; border: 1px solid var(--color-border);">
								<?php echo get_avatar( get_the_author_meta( 'ID' ), 88 ); ?>
							</div>
							<div>
								<div style="font-weight: 600; font-size: 0.95rem; color: var(--color-text-main);">
									<?php the_author_posts_link(); ?>
								</div>
								<div style="font-size: 0.8rem; color: var(--color-text-faint);">
									<?php echo esc_html( get_the_author_meta( 'nickname' ) ); ?>
								</div>
							</div>
						</div>
					</header><!-- .single-post-header -->

					<?php if ( has_post_thumbnail() ) : ?>
						<div class="post-featured-image">
							<?php the_post_thumbnail( 'full', array( 'alt' => the_title_attribute( 'echo=0' ) ) ); ?>
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

					<!-- Tags List -->
					<footer class="entry-footer" style="margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid var(--color-border-subtle);">
						<?php luminary_entry_footer(); ?>
					</footer>

					<!-- Author Bio Box -->
					<div class="author-box">
						<div class="author-avatar">
							<?php echo get_avatar( get_the_author_meta( 'ID' ), 144 ); ?>
						</div>
						<div class="author-info">
							<h3 class="author-title">
								<?php
								/* translators: %s: Author name */
								printf( esc_html__( 'Written by %s', 'luminary' ), esc_html( get_the_author() ) );
								?>
							</h3>
							<p class="author-description">
								<?php
								$author_description = get_the_author_meta( 'description' );
								if ( ! empty( $author_description ) ) {
									echo esc_html( $author_description );
								} else {
									esc_html_e( 'Principal engineer and digital architect specializing in modular content systems, high-speed delivery networks, and resilient brand applications.', 'luminary' );
								}
								?>
							</p>
						</div>
					</div><!-- .author-box -->

					<!-- Prev / Next Post Navigation -->
					<div class="post-navigation">
						<?php
						$prev_post = get_previous_post();
						if ( ! empty( $prev_post ) ) :
							?>
							<div class="nav-previous">
								<span class="nav-subtitle"><?php esc_html_e( '← Previous Article', 'luminary' ); ?></span>
								<a href="<?php echo esc_url( get_permalink( $prev_post->ID ) ); ?>" class="nav-title" style="color: var(--color-text-main);">
									<?php echo esc_html( get_the_title( $prev_post->ID ) ); ?>
								</a>
							</div>
						<?php else : ?>
							<div></div>
						<?php endif; ?>

						<?php
						$next_post = get_next_post();
						if ( ! empty( $next_post ) ) :
							?>
							<div class="nav-next" style="text-align: right;">
								<span class="nav-subtitle"><?php esc_html_e( 'Next Article →', 'luminary' ); ?></span>
								<a href="<?php echo esc_url( get_permalink( $next_post->ID ) ); ?>" class="nav-title" style="color: var(--color-text-main);">
									<?php echo esc_html( get_the_title( $next_post->ID ) ); ?>
								</a>
							</div>
						<?php endif; ?>
					</div><!-- .post-navigation -->

					<!-- Comments Template -->
					<?php
					if ( comments_open() || get_comments_number() ) :
						comments_template();
					endif;
					?>

				</article><!-- #post-<?php the_ID(); ?> -->

			<?php endwhile; // End of the loop. ?>

		</main><!-- #primary -->

		<?php get_sidebar(); ?>

	</div><!-- .content-sidebar-layout -->
</div><!-- .site-container -->

<?php
get_footer();
