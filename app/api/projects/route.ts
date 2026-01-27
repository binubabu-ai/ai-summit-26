import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/projects - List user's projects
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user's projects
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, name, slug, created_at, updated_at')
      .eq('owner_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      );
    }

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Projects GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if slug already exists for this user
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id')
      .eq('owner_id', session.user.id)
      .eq('slug', slug)
      .single();

    if (existingProject) {
      return NextResponse.json(
        { error: 'A project with this name already exists' },
        { status: 409 }
      );
    }

    // Create project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        owner_id: session.user.id,
        name: name.trim(),
        slug,
      })
      .select()
      .single();

    if (projectError) {
      console.error('Error creating project:', projectError);
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      );
    }

    // Generate API key for the project
    const { data: apiKeyData } = await supabase
      .rpc('generate_api_key');

    if (!apiKeyData) {
      console.error('Failed to generate API key');
      return NextResponse.json({
        project,
        apiKey: null,
        warning: 'Project created but API key generation failed'
      });
    }

    const apiKey = apiKeyData;

    // Store API key
    const { error: keyError } = await supabase
      .from('api_keys')
      .insert({
        project_id: project.id,
        name: 'Default Key',
        key: apiKey,
        key_prefix: 'dj_',
      });

    if (keyError) {
      console.error('Error storing API key:', keyError);
      return NextResponse.json({
        project,
        apiKey: null,
        warning: 'Project created but API key storage failed'
      });
    }

    return NextResponse.json({
      project,
      apiKey,
    }, { status: 201 });
  } catch (error) {
    console.error('Projects POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
