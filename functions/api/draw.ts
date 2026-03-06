export async function onRequest(context: any) {
  const db = context.env.DB;
  
  // Generate numbers
  const nums: number[] = [];
  while (nums.length < 7) {
    const r = Math.floor(Math.random() * 49) + 1;
    if (!nums.includes(r)) nums.push(r);
  }
  const special = nums.pop()!;
  const numbers = nums.sort((a, b) => a - b);
  
  // Use Hong Kong time (UTC+8) for draw date
  const hkTime = new Date(new Date().getTime() + 8 * 3600 * 1000);
  const draw_date = hkTime.toISOString().split('T')[0];
  const created_at = Date.now();

  try {
    // Check if already drawn today
    const { results } = await db.prepare("SELECT id FROM draws WHERE draw_date = ?").bind(draw_date).all();
    if (results && results.length > 0) {
      return new Response(JSON.stringify({ success: false, message: "Already drawn today" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    await db.prepare("INSERT INTO draws (draw_date, numbers, special, created_at) VALUES (?, ?, ?, ?)")
      .bind(draw_date, JSON.stringify(numbers), special, created_at)
      .run();
    
    return new Response(JSON.stringify({ success: true, draw: { draw_date, numbers, special, created_at } }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
