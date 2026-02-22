import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    // Lightweight check: confirm DB is reachable and schema exists
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1);
      

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          step: 'query_users',
          error: error.message,
        },
        { status: 500 }
      );
    }
    

    return NextResponse.json({
      ok: true,
      supabase: 'connected',
      sampleRowCount: data?.length ?? 0,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        step: 'exception',
        error: e?.message ?? 'Unknown error',
      },
      { status: 500 }
    );
  }
}
