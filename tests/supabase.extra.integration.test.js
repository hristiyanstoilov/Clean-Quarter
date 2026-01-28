import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const canRun = !!supabaseUrl && !!supabaseAnonKey;

(canRun ? describe : describe.skip)('Supabase EXTRA integration', () => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  let createdId = null;

  it('creates a campaign for update', async () => {
    const { data, error } = await supabase
      .from('campaigns')
      .insert([
        {
          title: 'Update Test',
          description: 'To be updated',
          location_lat: 42.7,
          location_lng: 23.3,
          status: 'active',
          neighborhood: 'Studentski Grad',
          created_by: null
        }
      ])
      .select();
    expect(error).toBeNull();
    createdId = data[0].id;
  });

  it('updates the campaign title', async () => {
    expect(createdId).toBeTruthy();
    const { data, error } = await supabase
      .from('campaigns')
      .update({ title: 'Updated Title' })
      .eq('id', createdId)
      .select();
    expect(error).toBeNull();
    expect(data[0].title).toBe('Updated Title');
  });

  it('fetches all active campaigns', async () => {
    const { data, error } = await supabase
      .from('campaigns')
      .select('id, title, status')
      .eq('status', 'active');
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it('returns error for invalid table', async () => {
    const { error } = await supabase
      .from('not_a_table')
      .select('*');
    expect(error).not.toBeNull();
  });

  it('deletes the updated campaign', async () => {
    expect(createdId).toBeTruthy();
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', createdId);
    expect(error).toBeNull();
  });
});
