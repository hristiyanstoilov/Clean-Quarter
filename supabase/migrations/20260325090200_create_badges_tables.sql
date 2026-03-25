-- Badges catalog
CREATE TABLE IF NOT EXISTS public.badges (
  id         text PRIMARY KEY,
  name_bg    text NOT NULL,
  name_en    text NOT NULL,
  emoji      text NOT NULL DEFAULT '🏅',
  description_bg text,
  description_en text,
  threshold  integer NOT NULL DEFAULT 1  -- cleanups required to unlock
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges_public_read" ON public.badges FOR SELECT USING (true);

-- Insert default badge definitions
INSERT INTO public.badges (id, name_bg, name_en, emoji, description_bg, description_en, threshold) VALUES
  ('first_cleanup',  'Първо почистване',   'First Cleanup',    '🌱', 'Участва в първото си почистване', 'Participated in their first cleanup',  1),
  ('eco_5',          'Еко войн',           'Eco Warrior',      '🌿', 'Участва в 5 почиствания',         'Participated in 5 cleanups',           5),
  ('eco_10',         'Зелен шампион',      'Green Champion',   '♻️', 'Участва в 10 почиствания',        'Participated in 10 cleanups',          10),
  ('eco_25',         'Пазител на природата','Nature Guardian', '🌍', 'Участва в 25 почиствания',        'Participated in 25 cleanups',          25)
ON CONFLICT (id) DO NOTHING;

-- User badges (awarded per user)
CREATE TABLE IF NOT EXISTS public.user_badges (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id   text NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_badges_owner_read" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_badges_service_insert" ON public.user_badges FOR INSERT WITH CHECK (true);
