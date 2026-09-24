<?php
/**
 * The template for displaying the front page
 *
 * @package Luminary
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
?>

<main id="primary" class="site-main">

	<!-- Hero Section -->
	<section class="hero-section">
		<div class="site-container">
			<div class="hero-grid">
				
				<div class="hero-content">
					<div class="hero-kicker">
						<?php esc_html_e( 'Enterprise Web & Digital Architecture', 'luminary' ); ?>
					</div>

					<h1 class="hero-title">
						<?php
						echo esc_html(
							get_theme_mod(
								'luminary_hero_title',
								__( 'Architecture, strategy & digital experiences engineered for impact.', 'luminary' )
							)
						);
						?>
					</h1>

					<p class="hero-description">
						<?php
						echo esc_html(
							get_theme_mod(
								'luminary_hero_subtitle',
								__( 'We partner with ambitious organizations worldwide to construct enduring digital systems, high-converting platforms, and brand identities.', 'luminary' )
							)
						);
						?>
					</p>

					<div class="hero-ctas">
						<a href="<?php echo esc_url( get_theme_mod( 'luminary_hero_cta_link', '#contact' ) ); ?>" class="btn btn-primary">
							<?php echo esc_html( get_theme_mod( 'luminary_hero_cta_text', __( 'Start a Project', 'luminary' ) ) ); ?>
						</a>
						<a href="#work" class="btn btn-secondary">
							<?php esc_html_e( 'Explore Selected Work', 'luminary' ); ?>
						</a>
					</div>

					<div class="hero-proof-strip">
						<div class="proof-item">
							<span class="proof-number">99.8%</span>
							<span class="proof-label"><?php esc_html_e( 'Core Web Vitals SLA', 'luminary' ); ?></span>
						</div>
						<div class="proof-item">
							<span class="proof-number">&lt; 180ms</span>
							<span class="proof-label"><?php esc_html_e( 'Avg TTFB Response', 'luminary' ); ?></span>
						</div>
						<div class="proof-item">
							<span class="proof-number">140+</span>
							<span class="proof-label"><?php esc_html_e( 'Platforms Shipped', 'luminary' ); ?></span>
						</div>
					</div>
				</div><!-- .hero-content -->

				<div class="hero-visual-card">
					<img 
						src="<?php echo esc_url( get_template_directory_uri() . '/assets/images/hero-graphic.svg' ); ?>" 
						alt="<?php esc_attr_e( 'Digital architecture system visualization', 'luminary' ); ?>"
						width="800" 
						height="600"
						style="width: 100%; height: auto; display: block;"
					>
				</div>

			</div><!-- .hero-grid -->
		</div><!-- .site-container -->
	</section><!-- .hero-section -->

	<!-- Bento Grid Capabilities Section -->
	<section id="services" class="bento-section">
		<div class="site-container">
			
			<div class="section-head">
				<div>
					<span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--color-accent); text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 0.5rem;">
						<?php esc_html_e( 'What We Build', 'luminary' ); ?>
					</span>
					<h2><?php esc_html_e( 'Precision Engineering & Strategic Craft', 'luminary' ); ?></h2>
				</div>
				<p style="margin-bottom: 0; max-width: 480px;">
					<?php esc_html_e( 'We eliminate unnecessary dependencies in favor of clean architectures, strict accessibility, and measurable business growth.', 'luminary' ); ?>
				</p>
			</div>

			<div class="bento-grid">
				<!-- Bento Card 1 (Span 8) -->
				<div class="bento-card col-8">
					<div>
						<div class="card-number">01. CAPABILITY</div>
						<h3><?php esc_html_e( 'Full-Stack WordPress & Headless Solutions', 'luminary' ); ?></h3>
						<p>
							<?php esc_html_e( 'Custom themes, custom post types, REST API endpoints, and decoupled Next.js or Astro frontends tailored for enterprise publishing and editorial velocity.', 'luminary' ); ?>
						</p>
					</div>
					<div style="background: var(--color-surface-elevated); border: 1px solid var(--color-border); border-radius: 8px; padding: 1.25rem; font-family: var(--font-mono); font-size: 0.8rem; color: var(--color-text-muted);">
						<div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem;">
							<span style="width: 8px; height: 8px; border-radius: 50%; background: #10B981;"></span>
							<span style="color: #F3F4F6; font-weight: 600;">Standard WordPress PHP API &amp; Gutenberg Ready</span>
						</div>
						<span>Zero bloat · &lt; 20KB asset footprint · Semantic HTML5 elements</span>
					</div>
				</div>

				<!-- Bento Card 2 (Span 4) -->
				<div class="bento-card col-4">
					<div>
						<div class="card-number">02. CAPABILITY</div>
						<h3><?php esc_html_e( 'Design Systems & Brand Identity', 'luminary' ); ?></h3>
						<p>
							<?php esc_html_e( 'Comprehensive design tokens, typography rules, component guides, and accessibility protocols to ensure brand coherence.', 'luminary' ); ?>
						</p>
					</div>
					<ul style="list-style: none; font-size: 0.85rem; color: var(--color-text-muted); display: flex; flex-direction: column; gap: 0.5rem;">
						<li>✓ WCAG 2.1 AA Compliance</li>
						<li>✓ Fluid Typography &amp; Scale</li>
						<li>✓ Zero-Pill Visual Rigor</li>
					</ul>
				</div>

				<!-- Bento Card 3 (Span 4) -->
				<div class="bento-card col-4">
					<div>
						<div class="card-number">03. CAPABILITY</div>
						<h3><?php esc_html_e( 'Performance & SEO Infrastructure', 'luminary' ); ?></h3>
						<p>
							<?php esc_html_e( 'Sub-second page rendering, structured Schema.org data, clean robots and sitemap hierarchies, and server caching strategies.', 'luminary' ); ?>
						</p>
					</div>
					<div style="font-family: var(--font-mono); font-size: 1.35rem; font-weight: 700; color: #10B981;">
						100 / 100 <span style="font-size: 0.8rem; font-weight: 500; color: var(--color-text-faint);">Google PageSpeed</span>
					</div>
				</div>

				<!-- Bento Card 4 (Span 8) -->
				<div class="bento-card col-8">
					<div>
						<div class="card-number">04. CAPABILITY</div>
						<h3><?php esc_html_e( 'Custom Plugin & Data Pipeline Integration', 'luminary' ); ?></h3>
						<p>
							<?php esc_html_e( 'Secure third-party API webhooks, automated CRM lead routing, payment gateways, and custom database schemas integrated seamlessly into WordPress admin.', 'luminary' ); ?>
						</p>
					</div>
					<div style="display: flex; gap: 1.5rem; flex-wrap: wrap;">
						<span style="font-size: 0.85rem; color: var(--color-accent); font-family: var(--font-mono);">+ Stripe &amp; PayPal</span>
						<span style="font-size: 0.85rem; color: var(--color-accent); font-family: var(--font-mono);">+ HubSpot &amp; Salesforce</span>
						<span style="font-size: 0.85rem; color: var(--color-accent); font-family: var(--font-mono);">+ Cloudflare Edge Cache</span>
					</div>
				</div>
			</div><!-- .bento-grid -->

		</div><!-- .site-container -->
	</section><!-- #services -->

	<!-- Selected Work / Case Studies -->
	<section id="work" class="bento-section">
		<div class="site-container">
			
			<div class="section-head">
				<div>
					<span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--color-accent); text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 0.5rem;">
						<?php esc_html_e( 'Portfolio & Case Studies', 'luminary' ); ?>
					</span>
					<h2><?php esc_html_e( 'Recent Architectural Deployments', 'luminary' ); ?></h2>
				</div>
				<a href="<?php echo esc_url( home_url( '/#insights' ) ); ?>" class="btn btn-secondary">
					<?php esc_html_e( 'View All Work →', 'luminary' ); ?>
				</a>
			</div>

			<div class="posts-grid">
				<!-- Project 1 -->
				<div class="post-card">
					<div class="post-card-thumb">
						<img 
							src="<?php echo esc_url( get_template_directory_uri() . '/assets/images/project-1.svg' ); ?>" 
							alt="<?php esc_attr_e( 'Brand Identity & Swiss Typography Case Study', 'luminary' ); ?>"
						>
					</div>
					<div class="post-card-body">
						<div class="post-meta-clean">
							<span style="color: var(--color-accent); font-weight: 600;">BRAND SYSTEM</span>
							<span class="sep" aria-hidden="true">·</span>
							<span>2026 Release</span>
						</div>
						<h3 class="post-card-title">Atelier V &mdash; Modern Corporate Identity</h3>
						<p class="post-card-excerpt">
							Complete brand architecture and responsive web experience engineered for a Swiss precision design consultancy.
						</p>
						<span style="font-size: 0.825rem; font-weight: 600; color: var(--color-text-main);">
							+180% Inbound Inquiries
						</span>
					</div>
				</div>

				<!-- Project 2 -->
				<div class="post-card">
					<div class="post-card-thumb">
						<img 
							src="<?php echo esc_url( get_template_directory_uri() . '/assets/images/project-2.svg' ); ?>" 
							alt="<?php esc_attr_e( 'Telemetry & Digital Platform Showcase', 'luminary' ); ?>"
						>
					</div>
					<div class="post-card-body">
						<div class="post-meta-clean">
							<span style="color: var(--color-accent); font-weight: 600;">ENGINEERING</span>
							<span class="sep" aria-hidden="true">·</span>
							<span>High Throughput</span>
						</div>
						<h3 class="post-card-title">Apex Mobility &mdash; Fleet Telemetry Portal</h3>
						<p class="post-card-excerpt">
							Real-time analytics dashboard with sub-second event ingestion and customized customer account portal.
						</p>
						<span style="font-size: 0.825rem; font-weight: 600; color: var(--color-text-main);">
							35ms WebSocket Roundtrip
						</span>
					</div>
				</div>

				<!-- Project 3 -->
				<div class="post-card">
					<div class="post-card-thumb">
						<img 
							src="<?php echo esc_url( get_template_directory_uri() . '/assets/images/project-3.svg' ); ?>" 
							alt="<?php esc_attr_e( 'Museum Pavilion Architectural Showcase', 'luminary' ); ?>"
						>
					</div>
					<div class="post-card-body">
						<div class="post-meta-clean">
							<span style="color: var(--color-accent); font-weight: 600;">ARCHITECTURE</span>
							<span class="sep" aria-hidden="true">·</span>
							<span>Monolithic Form</span>
						</div>
						<h3 class="post-card-title">Kallio Pavilion &mdash; Cultural Center</h3>
						<p class="post-card-excerpt">
							Interactive digital archive and immersive virtual exhibition documentation for an international arts pavilion.
						</p>
						<span style="font-size: 0.825rem; font-weight: 600; color: var(--color-text-main);">
							Design Excellence Award
						</span>
					</div>
				</div>
			</div><!-- .posts-grid -->

		</div><!-- .site-container -->
	</section><!-- #work -->

	<!-- Latest Insights / Journal (WordPress Query) -->
	<section id="insights" class="bento-section">
		<div class="site-container">
			
			<div class="section-head">
				<div>
					<span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--color-accent); text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 0.5rem;">
						<?php esc_html_e( 'Editorial & Analysis', 'luminary' ); ?>
					</span>
					<h2><?php esc_html_e( 'Latest Articles & Technical Notes', 'luminary' ); ?></h2>
				</div>
			</div>

			<div class="posts-grid">
				<?php
				$recent_posts = new WP_Query(
					array(
						'posts_per_page'      => 3,
						'post_status'         => 'publish',
						'ignore_sticky_posts' => 1,
					)
				);

				if ( $recent_posts->have_posts() ) :
					while ( $recent_posts->have_posts() ) :
						$recent_posts->the_post();
						?>
						<article id="post-<?php the_ID(); ?>" <?php post_class( 'post-card' ); ?>>
							<?php if ( has_post_thumbnail() ) : ?>
								<div class="post-card-thumb">
									<a href="<?php the_permalink(); ?>">
										<?php the_post_thumbnail( 'luminary-card' ); ?>
									</a>
								</div>
							<?php else : ?>
								<div class="post-card-thumb" style="display: flex; align-items: center; justify-content: center; background: var(--color-surface-elevated);">
									<span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--color-text-faint);">LUMINARY ARTICLE</span>
								</div>
							<?php endif; ?>

							<div class="post-card-body">
								<div class="post-meta-clean">
									<span><?php luminary_posted_on(); ?></span>
									<span class="sep" aria-hidden="true">·</span>
									<span><?php echo esc_html( luminary_reading_time() ); ?></span>
								</div>

								<h3 class="post-card-title">
									<a href="<?php the_permalink(); ?>">
										<?php the_title(); ?>
									</a>
								</h3>

								<div class="post-card-excerpt">
									<?php the_excerpt(); ?>
								</div>

								<a href="<?php the_permalink(); ?>" style="color: var(--color-accent); font-weight: 600; font-size: 0.85rem; margin-top: auto;">
									<?php esc_html_e( 'Read Article →', 'luminary' ); ?>
								</a>
							</div>
						</article>
						<?php
					endwhile;
					wp_reset_postdata();
				else :
					// Fallback cards if no posts exist in fresh WordPress installation
					?>
					<article class="post-card">
						<div class="post-card-body">
							<div class="post-meta-clean">
								<span>March 2026</span>
								<span class="sep" aria-hidden="true">·</span>
								<span>5 min read</span>
							</div>
							<h3 class="post-card-title">Designing High-Performance WordPress Themes with Zero JavaScript Frameworks</h3>
							<p class="post-card-excerpt">
								Why modern CSS variables and vanilla web APIs outperform heavy client bundles for content-driven publishing websites.
							</p>
						</div>
					</article>

					<article class="post-card">
						<div class="post-card-body">
							<div class="post-meta-clean">
								<span>February 2026</span>
								<span class="sep" aria-hidden="true">·</span>
								<span>4 min read</span>
							</div>
							<h3 class="post-card-title">Architecting Accessible Design Systems with Strict WCAG 2.1 AA Compliance</h3>
							<p class="post-card-excerpt">
								Practical techniques for semantic landmark structures, high-contrast typography, and focus ring orchestration.
							</p>
						</div>
					</article>

					<article class="post-card">
						<div class="post-card-body">
							<div class="post-meta-clean">
								<span>January 2026</span>
								<span class="sep" aria-hidden="true">·</span>
								<span>6 min read</span>
							</div>
							<h3 class="post-card-title">Core Web Vitals Invariants: Engineering for &lt;100ms Largest Contentful Paint</h3>
							<p class="post-card-excerpt">
								Deconstructing critical render path optimizations, speculative prerendering, and server response time tuning.
							</p>
						</div>
					</article>
				<?php endif; ?>
			</div><!-- .posts-grid -->

		</div><!-- .site-container -->
	</section><!-- #insights -->

	<!-- Contact / Project Inquiry Section -->
	<section id="contact" class="bento-section" style="background: var(--color-surface); border-bottom: 1px solid var(--color-border-subtle);">
		<div class="site-container-narrow">
			<div style="text-align: center; margin-bottom: 3rem;">
				<span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--color-accent); text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 0.5rem;">
					<?php esc_html_e( 'Inquiry & Collaboration', 'luminary' ); ?>
				</span>
				<h2><?php esc_html_e( 'Let us build something exceptional together.', 'luminary' ); ?></h2>
				<p style="margin: 0 auto; max-width: 540px;">
					<?php esc_html_e( 'Tell us about your organization, project scope, and timeline. Our team typically responds within 24 business hours.', 'luminary' ); ?>
				</p>
			</div>

			<form class="contact-form" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" method="post" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
				<input type="hidden" name="action" value="luminary_contact_form">
				<?php wp_nonce_field( 'luminary_contact_action', 'luminary_contact_nonce' ); ?>

				<div>
					<label for="contact-name" style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--color-text-main);">
						<?php esc_html_e( 'Your Name', 'luminary' ); ?> *
					</label>
					<input type="text" id="contact-name" name="contact_name" required style="width: 100%; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 0.75rem 1rem; color: var(--color-text-main); font-family: inherit;">
				</div>

				<div>
					<label for="contact-email" style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--color-text-main);">
						<?php esc_html_e( 'Email Address', 'luminary' ); ?> *
					</label>
					<input type="email" id="contact-email" name="contact_email" required style="width: 100%; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 0.75rem 1rem; color: var(--color-text-main); font-family: inherit;">
				</div>

				<div style="grid-column: span 2;">
					<label for="contact-project" style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; color: var(--color-text-main);">
						<?php esc_html_e( 'Project Scope & Goals', 'luminary' ); ?> *
					</label>
					<textarea id="contact-project" name="contact_project" rows="5" required style="width: 100%; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 0.75rem 1rem; color: var(--color-text-main); font-family: inherit;"></textarea>
				</div>

				<div style="grid-column: span 2; display: flex; justify-content: flex-end;">
					<button type="submit" class="btn btn-primary" style="padding: 0.85rem 2rem; font-size: 0.95rem;">
						<?php esc_html_e( 'Submit Inquiry →', 'luminary' ); ?>
					</button>
				</div>
			</form>
		</div><!-- .site-container-narrow -->
	</section><!-- #contact -->

</main><!-- #primary -->

<?php
get_footer();
