import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// 1. Initialize Groq (for AI)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.groq.com/openai/v1", 
});

// 2. Initialize Supabase (for Database)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ==========================================
    // PART A: HANDLE SAVING TO DATABASE
    // ==========================================
    if (body.action === 'save_override') {
      const { draft_text, is_flagged, override_reason } = body;

      const { error } = await supabase
        .from('review_logs')
        .insert([{ draft_text, is_flagged, override_reason }]);

      if (error) {
        console.error("Supabase Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // ==========================================
    // PART B: HANDLE AI REVIEW (Default)
    // ==========================================
    const { draft, guidelines } = body;

    const prompt = `
      Task: Evaluate the DRAFT text against the RULES.
      
      RULES:
      "${guidelines}"
      
      DRAFT:
      "${draft}"
      
      Instruction:
      1. Read the RULES.
      2. Check if the DRAFT violates any RULE.
      3. If the DRAFT uses a forbidden word (e.g., 'cheap' when the rule says 'never use cheap'), you MUST output "is_flagged": true.
      
      You must output ONLY a raw JSON object matching this structure:
      {
        "is_flagged": true,
        "issue_type": "Terminology",
        "guideline_cited": "Never use the word 'cheap'.",
        "explanation": "The draft uses the forbidden word 'cheap'.",
        "suggested_fix": "Our new product is affordable and fast."
      }
    `;

    const response = await openai.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    return NextResponse.json(JSON.parse(response.choices[0].message.content || "{}"));

  } catch (error: any) {
    console.error("API ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}