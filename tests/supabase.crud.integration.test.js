import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey =
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const canRun = !!supabaseUrl && !!serviceRoleKey;

// Skip these tests as they require authenticated user to pass RLS policies
(canRun ? describe : describe.skip)("Supabase REAL CRUD integration", () => {
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  let createdId = null;

  it('creates a campaign', async () => {
    const { data, error } = await supabase
      .from('campaigns')
      .insert([
        {
          title: 'Test Campaign',
          description: 'Integration test',
          location_lat: 42.6977,
          location_lng: 23.3219,
          status: 'active',
          neighborhood: 'Studentski Grad',
          created_by: null // or provide a valid profile UUID if required
        }
      ])
      .select();
    expect(error).toBeNull();
    expect(data[0]).toHaveProperty('id');
    createdId = data[0].id;
  });

  it('reads the created campaign', async () => {
    expect(createdId).toBeTruthy();
    const { data, error } = await supabase
      .from('campaigns')
      .select('id, title')
      .eq('id', createdId)
      .single();
    expect(error).toBeNull();
    expect(data.title).toBe('Test Campaign');
  });

  it('deletes the created campaign', async () => {
    expect(createdId).toBeTruthy();
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', createdId);
    expect(error).toBeNull();
  });
});
