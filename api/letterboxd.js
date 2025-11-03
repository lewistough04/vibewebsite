const fetch = (...args) => import('node-fetch').then(({default: f})=>f(...args))

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'GET') return res.status(405).end()
  
  try {
    const username = 'lewistough7'
    const rssUrl = `https://letterboxd.com/${username}/rss/`
    
    const response = await fetch(rssUrl)
    const xmlText = await response.text()
    
    // Parse XML to extract movies
    const items = xmlText.match(/<item>[\s\S]*?<\/item>/g) || []
    const movies = items.slice(0, 12).map(item => {
      const titleMatch = item.match(/<letterboxd:filmTitle>(.*?)<\/letterboxd:filmTitle>/)
      const yearMatch = item.match(/<letterboxd:filmYear>(.*?)<\/letterboxd:filmYear>/)
      const posterMatch = item.match(/<description>.*?<img src="(.*?)".*?<\/description>/)
      const ratingMatch = item.match(/<letterboxd:memberRating>(.*?)<\/letterboxd:memberRating>/)
      const watchedDateMatch = item.match(/<letterboxd:watchedDate>(.*?)<\/letterboxd:watchedDate>/)
      const linkMatch = item.match(/<link>(.*?)<\/link>/)
      
      return {
        title: titleMatch ? titleMatch[1] : 'Unknown',
        year: yearMatch ? yearMatch[1] : '',
        poster: posterMatch ? posterMatch[1].replace('-0-150-0-225-crop', '-0-460-0-690-crop') : null,
        rating: ratingMatch ? parseFloat(ratingMatch[1]) : null,
        watchedDate: watchedDateMatch ? watchedDateMatch[1] : null,
        link: linkMatch ? linkMatch[1] : null
      }
    })
    
    return res.status(200).json({ movies })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'server_error', message: err.message })
  }
}
