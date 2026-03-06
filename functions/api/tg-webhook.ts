export async function onRequestPost(context: any) {
  const request = context.request;
  const env = context.env;
  
  try {
    const update = await request.json();
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id.toString();
      const text = update.message.text;
      
      // Check if admin
      if (chatId !== env.TG_ADMIN_ID) {
        return new Response("Unauthorized", { status: 403 });
      }

      if (text === '/draw') {
        // Trigger draw
        const drawUrl = new URL('/api/draw', request.url).toString();
        const drawRes = await fetch(drawUrl, { method: 'POST' });
        const drawData: any = await drawRes.json();
        
        let replyText = "";
        if (drawData.success) {
          replyText = `✅ 开奖成功！\n日期: ${drawData.draw.draw_date}\n号码: ${drawData.draw.numbers.join(', ')}\n特别号: ${drawData.draw.special}`;
        } else {
          replyText = `⚠️ 开奖失败或今日已开奖: ${drawData.message || drawData.error}`;
        }

        const tgUrl = `https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`;
        await fetch(tgUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: replyText
          })
        });
      } else if (text === '/init') {
        const initUrl = new URL('/api/init', request.url).toString();
        const initRes = await fetch(initUrl);
        const initData: any = await initRes.json();
        
        const tgUrl = `https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`;
        await fetch(tgUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: initData.success ? "✅ 数据库初始化成功！" : `⚠️ 初始化失败: ${initData.error}`
          })
        });
      } else if (text === '/stats') {
        const { results } = await env.DB.prepare("SELECT numbers, special FROM draws ORDER BY created_at DESC LIMIT 50").all();
        const counts: Record<number, number> = {};
        results.forEach((d: any) => {
          const nums = JSON.parse(d.numbers);
          [...nums, d.special].forEach(n => {
            counts[n] = (counts[n] || 0) + 1;
          });
        });
        const top = Object.entries(counts)
          .sort((a: any, b: any) => b[1] - a[1])
          .slice(0, 5)
          .map(([num, count]) => `${num}号 (${count}次)`)
          .join('\n');
        
        const tgUrl = `https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`;
        await fetch(tgUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `📊 最近50期热门号码统计：\n\n${top || '暂无数据'}`
          })
        });
      }
    }
    return new Response("OK");
  } catch (e) {
    return new Response("Error", { status: 500 });
  }
}
