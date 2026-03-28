-- Enforce valid neighborhood values in profiles and campaigns.
-- After the normalization migration (20260328160000), all existing rows
-- already use the canonical values defined here.

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_neighborhood_valid
  CHECK (
    neighborhood IS NULL OR
    neighborhood IN (
      'Studentski Grad',
      'Darvenitsa',
      'Musagenitsa',
      'Vitosha (VEC)',
      'Malinova Dolina'
    )
  );

ALTER TABLE public.campaigns
  ADD CONSTRAINT campaigns_neighborhood_valid
  CHECK (
    neighborhood IS NULL OR
    neighborhood IN (
      'Studentski Grad',
      'Darvenitsa',
      'Musagenitsa',
      'Vitosha (VEC)',
      'Malinova Dolina'
    )
  );
