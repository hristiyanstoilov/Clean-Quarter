# API Reference

All data operations go through the Supabase client (`src/services/supabase.js`). There is no custom REST API — the app talks directly to Supabase PostgREST and Auth APIs.

---

## Authentication (`supabase.auth`)

```js
// Register
supabase.auth.signUp({ email, password })

// Login
supabase.auth.signInWithPassword({ email, password })

// Logout
supabase.auth.signOut()

// Get current user
supabase.auth.getUser()

// Send password reset email
supabase.auth.resetPasswordForEmail(email, { redirectTo: '...' })

// Update password (after reset)
supabase.auth.updateUser({ password: newPassword })
```

---

## Campaigns

```js
// List active campaigns (paginated, sorted by scheduled date)
supabase
  .from('campaigns')
  .select('id, title, neighborhood, before_photo_url, status, scheduled_date, start_time, end_time, category, created_by, creator:profiles!created_by(username)', { count: 'exact' })
  .eq('status', 'active')
  .order('scheduled_date', { ascending: true })
  .range(offset, offset + pageSize - 1)

// Create campaign
supabase.from('campaigns').insert({
  title,           // TEXT (bilingual JSON or plain string)
  description,
  neighborhood,
  location_lat,
  location_lng,
  before_photo_url,
  scheduled_date,  // DATE — 'YYYY-MM-DD'
  start_time,      // TIME — 'HH:MM'
  end_time,        // TIME — 'HH:MM' | null
  category,        // TEXT
  created_by,      // UUID
})

// Get single campaign
supabase.from('campaigns').select('*, creator:profiles!created_by(username)').eq('id', campaignId).single()
```

---

## Participations

```js
// Join a campaign
supabase.from('participations').insert({ campaign_id, user_id, status: 'pending' })

// Upload after-photo proof
supabase.from('participations').update({ after_photo_url, status: 'pending' }).eq('id', participationId)

// Admin approve
supabase.from('participations').update({ status: 'approved', points_earned: N }).eq('id', participationId)

// Admin reject (reason required)
supabase.from('participations').update({ status: 'rejected', rejection_reason: '...' }).eq('id', participationId)
```

---

## Profiles

```js
// Get own profile
supabase.from('profiles').select('*').eq('id', userId).single()

// Update profile (username, avatar_url, neighborhood)
supabase.from('profiles').update({ username, avatar_url, neighborhood }).eq('id', userId)

// Upsert profile on registration
supabase.from('profiles').upsert({ id, username, role: 'user', points_balance: 0, neighborhood }, { onConflict: 'id' })
```

---

## Rewards & Points

```js
// List rewards
supabase.from('rewards').select('*').is('deleted_at', null)

// Redeem reward (deducts points, records transaction)
// Handled via RPC or two-step: update profiles.points_balance + insert point_transactions

// List own transactions
supabase.from('point_transactions').select('*, reward:rewards(title)').eq('user_id', userId).order('created_at', { ascending: false })
```

---

## RPC Functions

```js
// Check login rate limit (server-side)
supabase.rpc('check_login_rate_limit', { p_email: email })
// Returns: { allowed: boolean, remaining: number }

// Record login attempt (fire-and-forget)
supabase.rpc('record_login_attempt', { p_email: email })

// Approve participation (admin)
supabase.rpc('approve_participation', { participation_id, points })

// Set user role (admin)
supabase.rpc('set_user_role', { target_user_id, new_role })
```

---

## Storage

```js
// Upload photo
supabase.storage.from('campaign-photos').upload(path, file)

// Get public URL
supabase.storage.from('campaign-photos').getPublicUrl(path)

// Delete photo
supabase.storage.from('campaign-photos').remove([path])
```

---

## Notifications

```js
// Fetch last 20 notifications
supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20)

// Mark as read
supabase.from('notifications').update({ read: true }).eq('id', notificationId)

// Mark all as read
supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)

// Realtime subscription
supabase.channel('notifications').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, handler).subscribe()
```
