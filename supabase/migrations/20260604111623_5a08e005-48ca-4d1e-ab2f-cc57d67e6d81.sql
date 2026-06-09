CREATE POLICY "Public can read blog images"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-images');

CREATE POLICY "Admins manage blog images"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'blog-images' AND public.has_role(auth.uid(),'admin'))
WITH CHECK (bucket_id = 'blog-images' AND public.has_role(auth.uid(),'admin'));