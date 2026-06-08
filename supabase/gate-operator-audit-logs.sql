-- Create admission logs table for audit and real-time door stats
CREATE TABLE IF NOT EXISTS public.admission_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  provider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- the business/provider owner
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL, -- optional link to booking
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- optional link to client
  operator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, -- the user validating (operator or provider)
  status TEXT CHECK (status IN ('approved', 'rejected', 'warning')) NOT NULL,
  access_type TEXT, -- e.g. 'club_cover', 'event', 'club_vip', 'service'
  buyer_name TEXT, -- name of the ticket holder or user
  device TEXT, -- operator device details / user agent
  error_reason TEXT, -- error details if rejected/warning
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.admission_logs ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Operators and providers can view admission logs" ON public.admission_logs;
CREATE POLICY "Operators and providers can view admission logs"
  ON public.admission_logs
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = operator_id 
    OR auth.uid() = provider_id
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Operators can insert admission logs" ON public.admission_logs;
CREATE POLICY "Operators can insert admission logs"
  ON public.admission_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = operator_id
  );

-- Create index for faster querying by provider and creation timestamp
CREATE INDEX IF NOT EXISTS admission_logs_provider_id_created_at_idx ON public.admission_logs(provider_id, created_at);
CREATE INDEX IF NOT EXISTS admission_logs_created_at_idx ON public.admission_logs(created_at);
