import supabase from './supabase.js';

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

    if (authError) {
      await Swal.fire({
        icon: 'error',
        title: 'Грешка при регистрация',
        text: authError.message,
      });
      throw authError;
    }

    // Create profile in database with metadata
    const userId = authData.user.id;
    const { error: profileError } = await supabase.from('profiles').insert([
      {
        id: userId,
        username: email.split('@')[0], // Use part before @ as username
        role: 'user', // Default role
        points_balance: 0,
        neighborhood: meta.neighborhood || null,
      },
    ]);

    if (profileError) {
      await Swal.fire({
        icon: 'error',
        title: 'Грешка при създаване на профил',
        text: profileError.message,
      });
      throw profileError;
    }

    await Swal.fire({
      icon: 'success',
      title: 'Успешна регистрация!',
      text: 'Вашият акаунт е създаден.',
    });

    return authData.user;
  } catch (error) {
    console.error('Register error:', error);
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

    if (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Грешка при влизане',
        text: error.message,
      });
      throw error;
    }

    await Swal.fire({
      icon: 'success',
      title: 'Успешно влизане!',
      text: `Добре дошли, ${email}`,
    });

    return data.user;
  } catch (error) {
    console.error('Login error:', error);
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

    if (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Грешка при излизане',
        text: error.message,
      });
      throw error;
    }

    await Swal.fire({
      icon: 'success',
      title: 'Излязохте успешно',
      text: 'До скоро!',
    });
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

/**
 * Get the currently logged-in user
 * @returns {Promise<object|null>} user object or null if not logged in
 */
export async function getUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

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
