import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sanitizeText } from '@/lib/utils';

const MAX_BODY_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_AGENCIES_PER_BATCH = 500;
const MAX_AGENTS_PER_BATCH = 500;

interface AgencyInput {
  name: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
}

interface AgentInput {
  first_name: string;
  last_name: string;
  agency_name: string;
  role?: string;
  status?: string;
}

interface AgencyRow {
  first_name: string;
  last_name: string;
  role?: string;
  status?: string;
  agency_id: string;
}

interface UploadBody {
  agencies?: AgencyInput[];
  agents?: AgentInput[];
}

interface UploadResponse {
  inserted_agencies: number;
  inserted_agents: number;
  errors: string[];
}

export async function POST(request: NextRequest) {
  // Check content-length header before parsing
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: 'Request body too large (max 10MB)' },
      { status: 413 }
    );
  }

  let body: UploadBody;

  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: 'Request body too large (max 10MB)' },
        { status: 413 }
      );
    }
    body = JSON.parse(text) as UploadBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { agencies = [], agents = [] } = body;

  if (!Array.isArray(agencies) || !Array.isArray(agents)) {
    return NextResponse.json(
      { error: 'agencies and agents must be arrays' },
      { status: 400 }
    );
  }

  if (agencies.length > MAX_AGENCIES_PER_BATCH) {
    return NextResponse.json(
      { error: `Batch size exceeds limit: max ${MAX_AGENCIES_PER_BATCH} agencies per request` },
      { status: 400 }
    );
  }

  if (agents.length > MAX_AGENTS_PER_BATCH) {
    return NextResponse.json(
      { error: `Batch size exceeds limit: max ${MAX_AGENTS_PER_BATCH} agents per request` },
      { status: 400 }
    );
  }

  const errors: string[] = [];
  let inserted_agencies = 0;
  let inserted_agents = 0;

  // Validate and sanitize agencies
  const validAgencies: AgencyInput[] = [];
  for (let i = 0; i < agencies.length; i++) {
    const a = agencies[i];
    if (!a || typeof a !== 'object') {
      errors.push(`Agency at index ${i} is not a valid object`);
      continue;
    }
    const name = typeof a.name === 'string' ? sanitizeText(a.name) : '';
    if (!name) {
      errors.push(`Agency at index ${i} is missing required field: name`);
      continue;
    }
    validAgencies.push({
      name,
      city: typeof a.city === 'string' ? sanitizeText(a.city) : undefined,
      country: typeof a.country === 'string' ? sanitizeText(a.country) : undefined,
      phone: typeof a.phone === 'string' ? sanitizeText(a.phone) : undefined,
      email: typeof a.email === 'string' ? sanitizeText(a.email) : undefined,
    });
  }

  // Insert agencies
  const agencyNameToId = new Map<string, string>();

  if (validAgencies.length > 0) {
    const { data: insertedAgencies, error: agencyError } = await supabase
      .from('agencies')
      .insert(validAgencies)
      .select('id, name');

    if (agencyError) {
      return NextResponse.json({ error: 'Failed to insert agencies' }, { status: 500 });
    }

    inserted_agencies = insertedAgencies?.length ?? 0;
    for (const agency of insertedAgencies ?? []) {
      agencyNameToId.set(agency.name, agency.id);
    }
  }

  // Validate and resolve agents
  if (agents.length > 0) {
    // Collect agency names not already in the map (pre-existing agencies)
    const missingAgencyNames = [
      ...new Set(
        agents
          .map((a) => (typeof a?.agency_name === 'string' ? sanitizeText(a.agency_name) : ''))
          .filter((name) => name && !agencyNameToId.has(name))
      ),
    ];

    if (missingAgencyNames.length > 0) {
      const { data: existingAgencies } = await supabase
        .from('agencies')
        .select('id, name')
        .in('name', missingAgencyNames);

      for (const agency of existingAgencies ?? []) {
        agencyNameToId.set(agency.name, agency.id);
      }
    }

    const validAgents: AgencyRow[] = [];
    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      if (!agent || typeof agent !== 'object') {
        errors.push(`Agent at index ${i} is not a valid object`);
        continue;
      }
      const first_name = typeof agent.first_name === 'string' ? sanitizeText(agent.first_name) : '';
      const last_name = typeof agent.last_name === 'string' ? sanitizeText(agent.last_name) : '';
      const agency_name = typeof agent.agency_name === 'string' ? sanitizeText(agent.agency_name) : '';

      if (!first_name) {
        errors.push(`Agent at index ${i} is missing required field: first_name`);
        continue;
      }
      if (!last_name) {
        errors.push(`Agent at index ${i} is missing required field: last_name`);
        continue;
      }
      if (!agency_name) {
        errors.push(`Agent at index ${i} is missing required field: agency_name`);
        continue;
      }
      const agency_id = agencyNameToId.get(agency_name);
      if (!agency_id) {
        errors.push(`Agent at index ${i}: agency "${agency_name}" not found`);
        continue;
      }
      validAgents.push({
        first_name,
        last_name,
        role: typeof agent.role === 'string' ? sanitizeText(agent.role) : undefined,
        status: typeof agent.status === 'string' ? sanitizeText(agent.status) : undefined,
        agency_id,
      });
    }

    if (validAgents.length > 0) {
      const { data: insertedAgents, error: agentsError } = await supabase
        .from('agents')
        .insert(validAgents)
        .select('id');

      if (agentsError) {
        return NextResponse.json({ error: 'Failed to insert agents' }, { status: 500 });
      }

      inserted_agents = insertedAgents?.length ?? 0;
    }
  }

  const response: UploadResponse = { inserted_agencies, inserted_agents, errors };
  return NextResponse.json(response);
}
