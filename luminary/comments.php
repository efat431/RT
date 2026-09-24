<?php
/**
 * The template for displaying comments
 *
 * @package Luminary
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( post_password_required() ) {
	return;
}
?>

<div id="comments" class="comments-area">

	<?php if ( have_comments() ) : ?>
		<h2 class="comments-title" style="font-size: 1.5rem; margin-bottom: 2rem;">
			<?php
			$luminary_comment_count = get_comments_number();
			if ( '1' === $luminary_comment_count ) {
				printf(
					/* translators: 1: title. */
					esc_html__( 'One response on &ldquo;%1$s&rdquo;', 'luminary' ),
					'<span>' . wp_kses_post( get_the_title() ) . '</span>'
				);
			} else {
				printf( 
					/* translators: 1: comment count number, 2: title. */
					esc_html( _nx( '%1$s response on &ldquo;%2$s&rdquo;', '%1$s responses on &ldquo;%2$s&rdquo;', $luminary_comment_count, 'comments title', 'luminary' ) ),
					number_format_i18n( $luminary_comment_count ), // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					'<span>' . wp_kses_post( get_the_title() ) . '</span>'
				);
			}
			?>
		</h2>

		<ol class="comment-list">
			<?php
			wp_list_comments(
				array(
					'style'      => 'ol',
					'short_ping' => true,
					'avatar_size'=> 48,
				)
			);
			?>
		</ol>

		<?php
		the_comments_navigation();

		// If comments are closed and there are comments, let's leave a little note.
		if ( ! comments_open() ) :
			?>
			<p class="no-comments" style="color: var(--color-text-faint); font-style: italic;"><?php esc_html_e( 'Comments are closed.', 'luminary' ); ?></p>
			<?php
		endif;

	endif; // Check for have_comments().

	comment_form(
		array(
			'title_reply_before' => '<h3 id="reply-title" class="comment-reply-title" style="font-size: 1.4rem; margin-bottom: 1.25rem;">',
			'title_reply_after'  => '</h3>',
			'class_submit'       => 'btn btn-primary',
		)
	);
	?>

</div><!-- #comments -->
