
-- Restrict SECURITY DEFINER functions from being called via the API
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.bump_note_downloads() FROM anon, authenticated, public;

-- Tighten note_downloads insert: user must log as themselves (or anonymous null)
DROP POLICY IF EXISTS "Authenticated users can log a download" ON public.note_downloads;
CREATE POLICY "Users can log their own downloads"
  ON public.note_downloads FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);
