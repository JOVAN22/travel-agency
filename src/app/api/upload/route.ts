import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

export async function POST(request: NextRequest) {
  let body: { agencies?: AgencyInput[]; agents?: AgentInput[] };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { agencies = [], agents = [] } = body;
  const errors: string[] = [];
  let inserted_agencies = 0;
  let inserted_agents = 0;

  // Validate agencies
  const validAgencies = agencies.filter((a, i) => {
    if (!a.name) {
      errors.push(`Agency at index ${i} is missing required field: name`);
      return false;
    }
    return true;
  });

  // Insert agencies
  const agencyNameToId = new Map<string, string>();

  if (validAgencies.length > 0) {
    const { data: insertedAgencies, error: agencyError } = await supabase
      .from('agencies')
      .insert(validAgencies)
      .select('id, name');

    if (agencyError) {
      return NextResponse.json({ error: agencyError.message }, { status: 500 });
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
          .map((a) => a.agency_name)
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

    const validAgents = [];
    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      if (!agent.first_name) {
        errors.push(`Agent at index ${i} is missing required field: first_name`);
        continue;
      }
      if (!agent.last_name) {
        errors.push(`Agent at index ${i} is missing required field: last_name`);
        continue;
      }
      if (!agent.agency_name) {
        errors.push(`Agent at index ${i} is missing required field: agency_name`);
        continue;
      }
      const agency_id = agencyNameToId.get(agent.agency_name);
      if (!agency_id) {
        errors.push(`Agent at index ${i}: agency "${agent.agency_name}" not found`);
        continue;
      }
      validAgents.push({
        first_name: agent.first_name,
        last_name: agent.last_name,
        role: agent.role,
        status: agent.status,
        agency_id,
      });
    }

    if (validAgents.length > 0) {
      const { data: insertedAgents, error: agentsError } = await supabase
        .from('agents')
        .insert(validAgents)
        .select('id');

      if (agentsError) {
        return NextResponse.json({ error: agentsError.message }, { status: 500 });
      }

      inserted_agents = insertedAgents?.length ?? 0;
    }
  }

  return NextResponse.json({ inserted_agencies, inserted_agents, errors });
}
