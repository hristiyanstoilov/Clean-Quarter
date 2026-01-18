import supabase from './supabase.js';
import { showSuccess, showError } from '../utils/helpers.js';

/**
 * Register a new user with email, password, and metadata (neighborhood)
 * @param {string} email
 * @param {string} password
 * @param {object} meta - metadata object containing 'neighborhood'
 * @returns {Promise<object>} user object
 */
export async function register(email, password, meta) {
  try {
    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    // Create profile in database with metadata
    const userId = authData.user.id;
    const { error: profileError } = await supabase.from('profiles').insert([
      {
        id: userId,
        username: email.split('@')[0],
        role: 'user',
        points_balance: 0,
        neighborhood: meta.neighborhood || null,
      },
    ]);

    if (profileError) throw profileError;

    await showSuccess('Registration Successful!', 'Your account has been created.');
    return authData.user;
  } catch (error) {
    await showError('Registration Error', error);
    throw error;
  }
}

/**
 * Login user with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} user object
 */
export async function login(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    await showSuccess('Login Successful!', `Welcome, ${email}`);
    return data.user;
  } catch (error) {
    await showError('Login Error', error);
    throw error;
  }
}

/**
 * Logout the current user
 * @returns {Promise<void>}
 */
export async function logout() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    await showSuccess('Logout Successful', 'See you soon!');
  } catch (error) {
    await showError('Logout Error', error);
    throw error;
  }
}

/**
 * Get the currently logged-in user
 * @returns {Promise<object|null>} user object or null if not logged in
 */
export async function getUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Get user error:', error);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}
