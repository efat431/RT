<?php
/**
 * The sidebar containing the main widget area
 *
 * @package Luminary
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>

<aside id="secondary" class="widget-area" aria-label="<?php esc_attr_e( 'Primary Sidebar', 'luminary' ); ?>">
	
	<?php if ( is_active_sidebar( 'primary-sidebar' ) ) : ?>
		<?php dynamic_sidebar( 'primary-sidebar' ); ?>
	<?php else : ?>
		
		<!-- Default Search Widget -->
		<section class="widget widget_search">
			<h3 class="widget-title"><?php esc_html_e( 'Search Insights', 'luminary' ); ?></h3>
			<?php get_search_form(); ?>
		</section>

		<!-- Default Recent Posts Widget -->
		<section class="widget widget_recent_entries">
			<h3 class="widget-title"><?php esc_html_e( 'Recent Articles', 'luminary' ); ?></h3>
			<ul>
				<?php
				$recent = new WP_Query(
					array(
						'posts_per_page'      => 4,
						'post_status'         => 'publish',
						'ignore_sticky_posts' => 1,
					)
				);

				if ( $recent->have_posts() ) :
					while ( $recent->have_posts() ) :
						$recent->the_post();
						?>
						<li>
							<a href="<?php the_permalink(); ?>" style="font-weight: 600; display: block; margin-bottom: 0.25rem;">
								<?php the_title(); ?>
							</a>
							<span style="font-size: 0.775rem; color: var(--color-text-faint);">
								<?php echo esc_html( get_the_date() ); ?>
							</span>
						</li>
						<?php
					endwhile;
					wp_reset_postdata();
				else :
					?>
					<li>
						<a href="#" style="font-weight: 600; display: block; margin-bottom: 0.25rem;">Modern WordPress Theme Architecture</a>
						<span style="font-size: 0.775rem; color: var(--color-text-faint);">March 2026</span>
					</li>
					<li>
						<a href="#" style="font-weight: 600; display: block; margin-bottom: 0.25rem;">WCAG 2.1 AA Color Contrast Guidelines</a>
						<span style="font-size: 0.775rem; color: var(--color-text-faint);">February 2026</span>
					</li>
					<li>
						<a href="#" style="font-weight: 600; display: block; margin-bottom: 0.25rem;">Headless Decoupling vs Monolithic Themes</a>
						<span style="font-size: 0.775rem; color: var(--color-text-faint);">January 2026</span>
					</li>
				<?php endif; ?>
			</ul>
		</section>

		<!-- Default Categories Widget -->
		<section class="widget widget_categories">
			<h3 class="widget-title"><?php esc_html_e( 'Categories', 'luminary' ); ?></h3>
			<ul>
				<?php
				$categories = get_categories();
				if ( ! empty( $categories ) ) :
					foreach ( $categories as $category ) :
						?>
						<li style="display: flex; justify-content: space-between; align-items: center;">
							<a href="<?php echo esc_url( get_category_link( $category->term_id ) ); ?>">
								<?php echo esc_html( $category->name ); ?>
							</a>
							<span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-text-faint); font-variant-numeric: tabular-nums;">
								(<?php echo esc_html( $category->count ); ?>)
							</span>
						</li>
						<?php
					endforeach;
				else :
					?>
					<li style="display: flex; justify-content: space-between; align-items: center;">
						<a href="#"><?php esc_html_e( 'Architecture & Systems', 'luminary' ); ?></a>
						<span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-text-faint);">(12)</span>
					</li>
					<li style="display: flex; justify-content: space-between; align-items: center;">
						<a href="#"><?php esc_html_e( 'Performance Engineering', 'luminary' ); ?></a>
						<span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-text-faint);">(8)</span>
					</li>
					<li style="display: flex; justify-content: space-between; align-items: center;">
						<a href="#"><?php esc_html_e( 'Design Systems & Craft', 'luminary' ); ?></a>
						<span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--color-text-faint);">(15)</span>
					</li>
				<?php endif; ?>
			</ul>
		</section>

	<?php endif; ?>

</aside><!-- #secondary -->
