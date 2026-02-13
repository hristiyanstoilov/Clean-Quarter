# API Documentation

## Supabase Integration

### Authentication
- `supabase.auth.signUp()` - Register new user
- `supabase.auth.signInWithPassword()` - Login
- `supabase.auth.signOut()` - Logout

### Database Operations

#### Campaigns
```js
// Fetch campaigns
await supabase.from('campaigns').select('*');

// Create campaign
await supabase.from('campaigns').insert({
  title, description, neighborhood, location_lat, location_lng
});
```

#### Profiles
```js
// Get user profile
await supabase.from('profiles').select('*').eq('id', userId).single();

// Update points
await supabase.from('profiles').update({ points_balance }).eq('id', userId);
```

### Storage
```js
// Upload photo
await supabase.storage.from('campaign-photos').upload(path, file);

// Get public URL
const { dataurl } = supabase.storage.from('campaign-photos').getPublicUrl(path);
```
