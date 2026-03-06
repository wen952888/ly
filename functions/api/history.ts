export async function onRequest(context: any) {
  const db = context.env.DB;
  try {
    const { results } = await db.prepare("SELECT * FROM draws ORDER BY created_at DESC LIMIT 20").all();
    const history = results.map((draw: any) => ({
      ...draw,
      numbers: JSON.parse(draw.numbers as string)
    }));
    return new Response(JSON.stringify({ success: true, history }), { 
      headers: { "Content-Type": "application/json" } 
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
