import { Controller, Get, Query, Req, Res, Header } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import path from 'node:path';
import fs from 'node:fs';
import { escapeXml } from '@/utils/escape';

@Controller()
export class RootController {
  @Get()
  @Header('Content-Type', 'text/html')
  @Header('Cache-Control', 'no-cache, must-revalidate')
  getRoot(
    @Query('user') userQueryParam?: string,
    @Query('username') usernameQueryParam?: string,
    @Query('theme') themeQueryParam?: string,
    @Req() req?: FastifyRequest,
    @Res() res?: FastifyReply
  ): void {
    let userQuery = '';
    if (typeof userQueryParam === 'string') {
      userQuery = userQueryParam;
    } else if (typeof usernameQueryParam === 'string') {
      userQuery = usernameQueryParam;
    }
    const themeQuery = typeof themeQueryParam === 'string' ? themeQueryParam : '';
    const indexPath = path.resolve(__dirname, '../../../../public/index.html');

    if (!fs.existsSync(indexPath)) {
      res?.status(404).header('Content-Type', 'text/plain').send('index.html not found. Please build the frontend first.');
      return;
    }

    let html = fs.readFileSync(indexPath, 'utf-8');

    // Dynamic preview URLs
    const rawHost = req?.headers.host || 'github-helpers.creativecode.com.co';
    const safeHost = rawHost.replace(/[^a-zA-Z0-9.\-:]/g, '');
    const protocol = req?.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const baseUrl = `${protocol}://${safeHost}`;

    let targetUsername = '';
    let targetTheme = 'radical';

    if (userQuery && /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(userQuery)) {
      targetUsername = userQuery;
    }
    if (themeQuery && /^[a-z\d_]{1,50}$/i.test(themeQuery)) {
      targetTheme = themeQuery;
    }

    if (!targetUsername) {
      res?.status(200).header('Content-Type', 'text/html').header('Cache-Control', 'no-cache, must-revalidate').send(html);
      return;
    }

    const encodedUser = encodeURIComponent(targetUsername);
    const encodedTheme = encodeURIComponent(targetTheme);

    const safeImageUrl = escapeXml(`${baseUrl}/api/stats?username=${encodedUser}&theme=${encodedTheme}`);
    const safeTitle = escapeXml(`Tarjetas de estadísticas para @${targetUsername} | GitHub Helpers`);
    const safeDescription = escapeXml(`Mira las estadísticas, lenguajes más usados y trofeos de GitHub para @${targetUsername} generados dinámicamente.`);

    html = html
      .replace(/<meta property="og:image" content="[^"]*"\/?>/gi, () => `<meta property="og:image" content="${safeImageUrl}" />`)
      .replace(/<meta property="twitter:image" content="[^"]*"\/?>/gi, () => `<meta property="twitter:image" content="${safeImageUrl}" />`)
      .replace(/<meta property="og:title" content="[^"]*"\/?>/gi, () => `<meta property="og:title" content="${safeTitle}" />`)
      .replace(/<meta property="twitter:title" content="[^"]*"\/?>/gi, () => `<meta property="twitter:title" content="${safeTitle}" />`)
      .replace(/<meta property="og:description" content="[^"]*"\/?>/gi, () => `<meta property="og:description" content="${safeDescription}" />`)
      .replace(/<meta property="twitter:description" content="[^"]*"\/?>/gi, () => `<meta property="twitter:description" content="${safeDescription}" />`)
      .replace(/<meta name="description" content="[^"]*"\/?>/gi, () => `<meta name="description" content="${safeDescription}" />`)
      .replace(/<title>[^<]*<\/title>/gi, () => `<title>${safeTitle}</title>`);

    res?.status(200).header('Content-Type', 'text/html').header('Cache-Control', 'no-cache, must-revalidate').send(html);
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development'
    };
  }

  @Get('admin/metrics')
  @Header('Cache-Control', 'no-cache, must-revalidate')
  getAdminMetrics(@Res() res: FastifyReply): void {
    this.serveHtmlFile('admin/metrics.html', res);
  }

  @Get('help')
  @Header('Cache-Control', 'no-cache, must-revalidate')
  getHelp(@Res() res: FastifyReply): void {
    this.serveHtmlFile('help.html', res);
  }

  @Get('privacy')
  @Header('Cache-Control', 'no-cache, must-revalidate')
  getPrivacy(@Res() res: FastifyReply): void {
    this.serveHtmlFile('privacy.html', res);
  }

  @Get('help/:slug')
  @Header('Cache-Control', 'no-cache, must-revalidate')
  getHelpSubPage(@Req() req: FastifyRequest, @Res() res: FastifyReply): void {
    const params = (req.params as Record<string, string>) || {};
    const rawSlug = typeof params.slug === 'string' ? params.slug : '';
    const safeSlug = rawSlug.replace(/[^a-z0-9-]/gi, '');
    if (!safeSlug) {
      res.status(404).header('Content-Type', 'text/plain').send('Page not found.');
      return;
    }
    this.serveHtmlFile(`help/${safeSlug}.html`, res);
  }

  private serveHtmlFile(relativePath: string, res: FastifyReply): void {
    const filePath = path.resolve(__dirname, '../../../../public', relativePath);
    if (fs.existsSync(filePath)) {
      res
        .status(200)
        .header('Content-Type', 'text/html; charset=utf-8')
        .header('Cache-Control', 'no-cache, must-revalidate')
        .send(fs.readFileSync(filePath, 'utf-8'));
    } else {
      res.status(404).header('Content-Type', 'text/plain').send('Page not found.');
    }
  }
}
