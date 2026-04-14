-- Staff (admin, customer_support) can read cross-user data needed for support context.
-- Admins can update other profiles for moderation (user management screen).

-- Bookings: staff can read any booking (owner/minder policies remain for regular users).
CREATE POLICY "Staff can read all bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'customer_support')
    )
  );

-- Chat: staff can read messages for investigation / history (sender/receiver policies unchanged).
CREATE POLICY "Staff can read all chat messages"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'customer_support')
    )
  );

-- Pets: staff can read pets when viewing a member's history.
CREATE POLICY "Staff can read all pets"
  ON public.pets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'customer_support')
    )
  );

-- Only admins may update another user's profile (suspend, ban, role changes).
CREATE POLICY "Admins can update any profile for moderation"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );
