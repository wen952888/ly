export async function onRequest(context: any) {
  const db = context.env.DB;
  try {
    const { results } = await db.prepare("SELECT * FROM draws ORDER BY created_at DESC LIMIT 1").all();
    if (results && results.length > 0) {
      const draw = results[0];
      draw.numbers = JSON.parse(draw.numbers as string);
      return new Response(JSON.stringify({ success: true, draw }), { 
        headers: { "Content-Type": "application/json" } 
      });
    }
    return new Response(JSON.stringify({ success: true, draw: null }), { 
      headers: { "Content-Type": "application/json" } 
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
