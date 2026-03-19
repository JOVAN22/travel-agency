import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const SETUP_SQL = `-- Run these statements in your Supabase SQL Editor:
ALTER TABLE products ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS embedding vector(1536);
CREATE INDEX IF NOT EXISTS products_embedding_idx ON products USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE EXTENSION IF NOT EXISTS pg_trgm;`;

export async function POST() {
  // Probe whether the description column already exists
  const { error } = await supabase
    .from('products')
    .select('description')
    .limit(1);

  if (error && error.message.includes('description')) {
    // Column does not exist yet — return the SQL for manual setup
    return NextResponse.json(
      {
        status: 'setup_required',
        message: 'The description column does not exist yet. Run the SQL below in your Supabase SQL Editor, then click "Generate Descriptions".',
        sql: SETUP_SQL,
      },
      { status: 200 }
    );
  }

  if (error) {
    return NextResponse.json({ error: 'Failed to probe products table', detail: error.message }, { status: 500 });
  }

  return NextResponse.json({
    status: 'ready',
    message: 'The description column already exists. You can generate descriptions now.',
    sql: SETUP_SQL,
  });
}
