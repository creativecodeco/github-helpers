export async function GET() {
  const siteUrl = 'https://github-helpers.creativecode.com.co';
  const lastmod = '2026-07-20';
  const pages = [
    { loc: '/', changefreq: 'monthly', priority: '1.0' },
    { loc: '/help', changefreq: 'monthly', priority: '0.8' },
    { loc: '/help/github-profile', changefreq: 'monthly', priority: '0.8' },
    { loc: '/help/tokens', changefreq: 'monthly', priority: '0.8' },
    { loc: '/help/security', changefreq: 'monthly', priority: '0.8' },
    { loc: '/help/revocation', changefreq: 'monthly', priority: '0.8' },
    { loc: '/privacy.html', changefreq: 'monthly', priority: '0.7' }
  ];

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages
    .map(
      (page) => `
  <url>
    <loc>${siteUrl}${page.loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join('')
    .trim()}
</urlset>`.trim();

  return new Response(xmlContent, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400'
    }
  });
}
