-- SQL Script to support advanced payment methods configuration, billing details, settlement history, and audits
-- Run this in the SQL editor in your Supabase Dashboard.

-- 1. Create club_payment_settings table
CREATE TABLE IF NOT EXISTS public.club_payment_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Online payments configuration
  online_payments_enabled BOOLEAN DEFAULT false NOT NULL,
  payment_gateway TEXT CHECK (payment_gateway IN ('wompi', 'mercado_pago', 'stripe', 'payu')) DEFAULT 'wompi' NOT NULL,
  
  -- Verification & Financial parameters
  verification_status TEXT CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')) DEFAULT 'unverified' NOT NULL,
  platform_commission NUMERIC DEFAULT 5.0 NOT NULL, -- percentage commission
  next_settlement_date TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + interval '7 days') NOT NULL,
  last_settlement_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  
  -- Bank Details (Stored securely in this table rather than public clubs table)
  bank_holder_name TEXT DEFAULT NULL,
  bank_name TEXT DEFAULT NULL,
  bank_account_type TEXT CHECK (bank_account_type IN ('ahorros', 'corriente')) DEFAULT 'ahorros',
  bank_account_number TEXT DEFAULT NULL,
  
  -- Billing / Facturación Info
  doc_type TEXT DEFAULT NULL, -- e.g., 'NIT', 'CC', 'RUT'
  doc_number TEXT DEFAULT NULL, -- e.g., '123.456.789-0'
  business_name TEXT DEFAULT NULL, -- Razón Social
  commercial_name TEXT DEFAULT NULL, -- Nombre Comercial de Facturación
  
  -- Advanced Financial metrics for all-product monetisation
  revenue_today NUMERIC DEFAULT 0.00 NOT NULL,
  revenue_month NUMERIC DEFAULT 0.00 NOT NULL,
  revenue_accumulated NUMERIC DEFAULT 0.00 NOT NULL,
  commission_generated NUMERIC DEFAULT 0.00 NOT NULL,
  pending_settlement NUMERIC DEFAULT 0.00 NOT NULL,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 2. Create club_payout_history table
CREATE TABLE IF NOT EXISTS public.club_payout_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'completed' NOT NULL,
  payout_method TEXT NOT NULL, -- e.g. 'Transferencia Bancaria', 'Wompi Settlement'
  settled_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.club_payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_payout_history ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for club_payment_settings: Viewable by club owners/providers and admins
DROP POLICY IF EXISTS "Payment settings viewable by club owners" ON public.club_payment_settings;
CREATE POLICY "Payment settings viewable by club owners" ON public.club_payment_settings
  FOR SELECT USING (
    auth.uid() IN (
      SELECT provider_id FROM public.clubs WHERE id = club_id
    ) OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Payment settings managed by club owners" ON public.club_payment_settings;
CREATE POLICY "Payment settings managed by club owners" ON public.club_payment_settings
  FOR ALL USING (
    auth.uid() IN (
      SELECT provider_id FROM public.clubs WHERE id = club_id
    ) OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. RLS Policies for club_payout_history: Viewable by club owners/providers and admins
DROP POLICY IF EXISTS "Payout history viewable by club owners" ON public.club_payout_history;
CREATE POLICY "Payout history viewable by club owners" ON public.club_payout_history
  FOR SELECT USING (
    auth.uid() IN (
      SELECT provider_id FROM public.clubs WHERE id = club_id
    ) OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Payout history managed by admins" ON public.club_payout_history;
CREATE POLICY "Payout history managed by admins" ON public.club_payout_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6. Trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION public.update_payment_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_club_payment_settings_timestamp ON public.club_payment_settings;
CREATE TRIGGER tr_update_club_payment_settings_timestamp
  BEFORE UPDATE ON public.club_payment_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_payment_settings_timestamp();
