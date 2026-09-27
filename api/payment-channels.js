// api/payment-channels.js
// Vercel serverless function — proxies Tripay's payment-channel list so
// the API key never reaches the browser.
export default async function handler(req, res) {
  try {
    const response = await fetch(
      "https://tripay.co.id/api/merchant/payment-channel",
      {
        headers: {
          Authorization: `Bearer ${process.env.TRIPAY_API_KEY}`,
        },
      }
    );
    const json = await response.json();

    if (!json.success) {
      return res.status(400).json({ error: json.message || "Tripay error" });
    }

    // Only send the fields the checkout UI actually needs.
    const channels = json.data
      .filter((c) => c.active)
      .map((c) => ({
        code: c.code,
        name: c.name,
        group: c.group,
        icon_url: c.icon_url,
        fee_customer: c.fee_customer,
      }));

    res.status(200).json({ channels });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
