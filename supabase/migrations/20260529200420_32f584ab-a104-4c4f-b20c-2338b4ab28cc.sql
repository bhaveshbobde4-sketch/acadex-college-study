
REVOKE EXECUTE ON FUNCTION public.bump_post_likes() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.bump_post_comments() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.bump_note_downloads() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
