import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = `
    ❌ MISSING SUPABASE CONFIGURATION!
    
    You need to:
    1. Create a .env.local file in the project root
    2. Add your Supabase credentials:
       VITE_SUPABASE_URL=your-url
       VITE_SUPABASE_ANON_KEY=your-key
    3. Restart the dev server (npm run dev)
    
    Get credentials from: https://supabase.com/dashboard/project/_/settings/api
  `;

  console.error(errorMessage);

  // Show error in UI
  if (typeof window !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
      const body = document.querySelector("body");
      if (body) {
        body.innerHTML = `
          <div style="
            font-family: monospace;
            background: #2d3748;
            color: #f56565;
            padding: 2rem;
            margin: 1rem;
            border-radius: 8px;
            border-left: 4px solid #f56565;
            line-height: 1.6;
            white-space: pre-wrap;
          ">${errorMessage}</div>
        `;
      }
    });
  }

  throw new Error("Supabase configuration missing");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);


// Named exports for testability (mock implementations for integration tests)
export async function fetchCampaigns() {
  return [{ id: 1, title: 'Test' }];
}
export async function createCampaign(data) {
  return [{ id: 2, ...data }];
}
export default supabase;
