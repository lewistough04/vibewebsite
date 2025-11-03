const fetch = (...args) => import('node-fetch').then(({default: f})=>f(...args))

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const { url } = req.body
    if (!url) return res.status(400).json({ error: 'no_url' })
    const r = await fetch(url)
    const buf = await r.arrayBuffer()
    const b = Buffer.from(buf)
    const base64 = `data:${r.headers.get('content-type')};base64,` + b.toString('base64')
    return res.status(200).json({ base64 })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server_error' })
  }
}
