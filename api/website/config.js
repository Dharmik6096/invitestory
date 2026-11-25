module.exports = function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, max-age=3600');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  return res.status(200).json({
    enabled: false,
    checkoutEnabled: true,
    checkoutContracts: [1, 2],
    deliveryV2Currencies: ["INR", "USD"],
    deliveryV2SalesEnabled: true,
    consentVersion: "preview-reminders-v2",
    consentWording: "Send my saved preview and one follow-up about ordering from InviteStory on WhatsApp. Reply STOP to stop messages.",
    businessNumber: "919727910473",
    siteKey: "0x4AAAAAAFRNi40QtwvXjJdp"
  });
};
