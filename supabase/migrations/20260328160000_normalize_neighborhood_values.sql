-- Normalize neighborhood values in profiles and campaigns.
--
-- Historical data was stored with camelCase identifiers (e.g. "studentskiGrad")
-- while the current UI stores display names (e.g. "Studentski Grad").
-- This causes the neighborhood leaderboard to split the same neighborhood
-- into multiple rows and display raw identifiers instead of proper names.

-- ── profiles ──────────────────────────────────────────────────────────────────
UPDATE public.profiles SET neighborhood = 'Studentski Grad' WHERE neighborhood IN ('studentskiGrad', 'studentski grad', 'Студентски Град', 'Студентски град');
UPDATE public.profiles SET neighborhood = 'Darvenitsa'      WHERE neighborhood IN ('darvenitsa', 'Дървеница');
UPDATE public.profiles SET neighborhood = 'Musagenitsa'     WHERE neighborhood IN ('musagenitsa', 'Мусагеница');
UPDATE public.profiles SET neighborhood = 'Vitosha (VEC)'   WHERE neighborhood IN ('vitoshaVec', 'vitosha', 'Витоша (ВЕЦ)');
UPDATE public.profiles SET neighborhood = 'Malinova Dolina' WHERE neighborhood IN ('malinovaDolina', 'Малинова Долина');

-- ── campaigns ─────────────────────────────────────────────────────────────────
UPDATE public.campaigns SET neighborhood = 'Studentski Grad' WHERE neighborhood IN ('studentskiGrad', 'studentski grad', 'Студентски Град', 'Студентски град');
UPDATE public.campaigns SET neighborhood = 'Darvenitsa'      WHERE neighborhood IN ('darvenitsa', 'Дървеница');
UPDATE public.campaigns SET neighborhood = 'Musagenitsa'     WHERE neighborhood IN ('musagenitsa', 'Мусагеница');
UPDATE public.campaigns SET neighborhood = 'Vitosha (VEC)'   WHERE neighborhood IN ('vitoshaVec', 'vitosha', 'Витоша (ВЕЦ)');
UPDATE public.campaigns SET neighborhood = 'Malinova Dolina' WHERE neighborhood IN ('malinovaDolina', 'Малинова Долина');
