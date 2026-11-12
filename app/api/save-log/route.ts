import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    global: {
      fetch: (...args) => fetch(...args) // Forces Node to use standard fetch
    }
  }
);
    export async function POST(req: Request) {
  try {
    // Get the data sent from the frontend
    const { draft_text, is_flagged, override_reason } = await req.json();

    // Insert the data into your Supabase table
    const { error } = await supabase
      .from('review_logs')
      .insert([{ 
        draft_text, 
        is_flagged, 
        override_reason 
      }]);

    // If Supabase rejects it, send the error back to the frontend
    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If successful, send a success message
    return NextResponse.json({ success: true });
    
  } catch (err: any) {
    console.error("Server Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
