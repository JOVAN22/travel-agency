import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sanitizeText } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
}

interface ProductContext {
  id: string;
  name: string;
  type: string;
  description: string | null;
}

interface CommissionRule {
  product_id: string;
  season: string;
  base_commission_pct: number;
  bonus_commission_pct: number;
  max_days_for_bonus: number;
}

interface Source {
  id: string;
  name: string;
  type: string;
}

// Extract meaningful search terms from the user's message
function extractKeywords(message: string): string[] {
  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'i', 'me', 'my', 'we', 'our',
    'you', 'your', 'it', 'its', 'they', 'their', 'what', 'which', 'who',
    'how', 'when', 'where', 'why', 'for', 'of', 'in', 'on', 'at', 'to',
    'from', 'with', 'by', 'about', 'and', 'or', 'but', 'not', 'no', 'so',
    'get', 'give', 'show', 'tell', 'find', 'want', 'need', 'like', 'best',
    'good', 'great', 'top', 'me', 'please', 'right', 'now', 'this', 'that',
  ]);

  return message
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w))
    .slice(0, 5);
}

async function retrieveContext(message: string): Promise<{ products: ProductContext[]; rules: CommissionRule[] }> {
  const keywords = extractKeywords(message);

  // Build OR filter across description and name fields using keywords
  const searchTerms = keywords.length > 0 ? keywords : [message.slice(0, 50)];

  // Try description-based search first
  let products: ProductContext[] = [];

  for (const term of searchTerms) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, type, description')
      .or(`description.ilike.%${term}%,name.ilike.%${term}%,type.ilike.%${term}%`)
      .limit(10);

    if (!error && data && data.length > 0) {
      // Merge, dedupe by id
      const existingIds = new Set(products.map((p) => p.id));
      for (const p of data) {
        if (!existingIds.has(p.id)) {
          products.push(p as ProductContext);
          existingIds.add(p.id);
        }
      }
    }
  }

  // Fallback: if no keyword hits, return a broad sample of products
  if (products.length === 0) {
    const { data: fallback } = await supabase
      .from('products')
      .select('id, name, type, description')
      .limit(10)
      .order('name');
    products = (fallback ?? []) as ProductContext[];
  }

  // Cap at 8 most relevant
  products = products.slice(0, 8);

  if (products.length === 0) {
    return { products: [], rules: [] };
  }

  // Fetch commission rules for matched products
  const productIds = products.map((p) => p.id);
  const { data: rules } = await supabase
    .from('commission_rules')
    .select('product_id, season, base_commission_pct, bonus_commission_pct, max_days_for_bonus')
    .in('product_id', productIds);

  return { products, rules: (rules ?? []) as CommissionRule[] };
}

function buildSystemPrompt(products: ProductContext[], rules: CommissionRule[]): string {
  const rulesByProduct = new Map<string, CommissionRule[]>();
  for (const rule of rules) {
    const existing = rulesByProduct.get(rule.product_id) ?? [];
    existing.push(rule);
    rulesByProduct.set(rule.product_id, existing);
  }

  const SEASON_LABELS: Record<string, string> = {
    peak_summer: 'Peak Summer',
    peak_holiday: 'Peak Holiday',
    shoulder: 'Shoulder',
    post_school_off_peak: 'Post-School Off-Peak',
    winter_off_peak: 'Winter Off-Peak',
  };

  const contextBlocks = products.map((p) => {
    const productRules = rulesByProduct.get(p.id) ?? [];
    const rulesText = productRules
      .map((r) => {
        const season = SEASON_LABELS[r.season] ?? r.season;
        const bonus = r.bonus_commission_pct > 0
          ? ` + ${r.bonus_commission_pct}% bonus (sell within ${r.max_days_for_bonus} days)`
          : '';
        return `  - ${season}: ${r.base_commission_pct}% base${bonus}`;
      })
      .join('\n');

    const desc = p.description ? `\n  Description: ${p.description}` : '';
    return `Product: ${p.name} (ID: ${p.id})\n  Type: ${p.type}${desc}\n  Commission rules:\n${rulesText || '  - No rules found'}`;
  });

  const contextSection = contextBlocks.length > 0
    ? `\n\nRELEVANT PRODUCT DATA:\n${contextBlocks.join('\n\n')}`
    : '\n\nNo specific product data found for this query.';

  return `You are TravelHub AI, an expert travel agency assistant helping agents maximise their earnings.

Your role is to answer questions about travel products and their commission structures using ONLY the data provided below. Do not invent product names, prices, or commission rates that are not in the data.

When citing products, use their exact names. If you reference a product, mention its commission rates from the data. If the user asks something you cannot answer from the provided data, say so clearly and suggest they use the search or calculator tools.

Be concise, specific, and actionable. Lead with the most useful information.${contextSection}`;
}

export async function POST(request: NextRequest) {
  let body: ChatRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const rawMessage = body.message;
  const history = body.history ?? [];

  if (!rawMessage || typeof rawMessage !== 'string') {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  const message = sanitizeText(rawMessage).slice(0, 2000);

  if (!message) {
    return NextResponse.json({ error: 'message cannot be empty' }, { status: 400 });
  }

  // Validate history shape
  const validatedHistory: ChatMessage[] = history
    .filter(
      (m): m is ChatMessage =>
        m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
    )
    .slice(-20); // keep last 20 turns to limit context size

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
  }

  // Retrieve relevant product context
  const { products, rules } = await retrieveContext(message);
  const systemPrompt = buildSystemPrompt(products, rules);

  // Call Claude API
  let claudeResponse: Response;
  try {
    claudeResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1024,
        messages: [
          { role: 'system', content: systemPrompt },
          ...validatedHistory,
          { role: 'user', content: message },
        ],
      }),
    });
  } catch (err) {
    console.error('Claude API fetch error:', err);
    return NextResponse.json(
      { error: 'AI service unavailable. Please try again.' },
      { status: 503 }
    );
  }

  if (!claudeResponse.ok) {
    const errorBody = await claudeResponse.text();
    console.error('Claude API error:', claudeResponse.status, errorBody);
    return NextResponse.json(
      { error: `Claude API error: ${claudeResponse.status} - ${errorBody}` },
      { status: claudeResponse.status }
    );
  }

  const claudeData = await claudeResponse.json();
  const reply: string =
    claudeData?.choices?.[0]?.message?.content
      ?? 'Sorry, I could not generate a response. Please try again.';

  const sources: Source[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
  }));

  return NextResponse.json({ reply, sources });
}
