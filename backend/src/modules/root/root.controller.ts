import { Controller, Get, Header, Param, Query, Req, Res } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { escapeXml } from '@/utils/escape';
import { GITHUB_USERNAME_REGEX } from '@/domain/entities/Validation';
import { HtmlFileService } from './html-file.service';

const THEME_REGEX = /^[a-z\d_]{1,50}$/i;
const HOST_CLEAN_REGEX = /[^a-zA-Z0-9.\-:]/g;
const SLUG_CLEAN_REGEX = /[^a-z0-9-]/gi;

@Controller()
export class RootController {
  constructor(private readonly htmlFileService: HtmlFileService) {}

  @Get()
  @Header('Cache-Control', 'no-cache, must-revalidate')
  getRoot(
    @Query('user') userQueryParam?: string,
    @Query('username') usernameQueryParam?: string,
    @Query('theme') themeQueryParam?: string,
    @Req() req?: FastifyRequest,
    @Res() res?: FastifyReply
  ): void {
    const userQuery = this.resolveUsernameQuery(userQueryParam, usernameQueryParam);
    const themeQuery = typeof themeQueryParam === 'string' ? themeQueryParam : '';

    let html = this.htmlFileService.readPublicFile('index.html');
    if (html === null) {
      res?.status(404).header('Content-Type', 'text/plain').send('index.html not found. Please build the frontend first.');
      return;
    }

    const targetUsername = userQuery && GITHUB_USERNAME_REGEX.test(userQuery) ? userQuery : '';
    const targetTheme = themeQuery && THEME_REGEX.test(themeQuery) ? themeQuery : 'radical';

    if (!targetUsername) {
      res?.status(200).header('Content-Type', 'text/html').header('Cache-Control', 'no-cache, must-revalidate').send(html);
      return;
    }

    const rawHost = req?.headers.host ?? 'github-helpers.creativecode.com.co';
    const safeHost = rawHost.replace(HOST_CLEAN_REGEX, '');
    const protocol = req?.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const baseUrl = `${protocol}://${safeHost}`;

    html = this.injectSocialMetaTags(html, targetUsername, targetTheme, baseUrl);
    res?.status(200).header('Content-Type', 'text/html').header('Cache-Control', 'no-cache, must-revalidate').send(html);
  }

  @Get('health')
  getHealth(): { status: string; version: string; uptime: number; environment: string } {
    return {
      status: 'ok',
      version: process.env.npm_package_version ?? '1.4.1',
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV ?? 'development',
    };
  }

  @Get('admin/metrics')
  @Header('Cache-Control', 'no-cache, must-revalidate')
  getAdminMetrics(@Res() res: FastifyReply): void {
    this.htmlFileService.serveFile('admin/metrics.html', res);
  }

  @Get('help')
  @Header('Cache-Control', 'no-cache, must-revalidate')
  getHelp(@Res() res: FastifyReply): void {
    this.htmlFileService.serveFile('help.html', res);
  }

  @Get('privacy')
  @Header('Cache-Control', 'no-cache, must-revalidate')
  getPrivacy(@Res() res: FastifyReply): void {
    this.htmlFileService.serveFile('privacy.html', res);
  }

  @Get('help/:slug')
  @Header('Cache-Control', 'no-cache, must-revalidate')
  getHelpSubPage(@Param('slug') slug: string, @Res() res: FastifyReply): void {
    const safeSlug = slug.replace(SLUG_CLEAN_REGEX, '');
    if (!safeSlug) {
      res.status(404).header('Content-Type', 'text/plain').send('Page not found.');
      return;
    }
    this.htmlFileService.serveFile(`help/${safeSlug}.html`, res);
  }

  private resolveUsernameQuery(userQueryParam?: string, usernameQueryParam?: string): string {
    if (typeof userQueryParam === 'string') return userQueryParam;
    if (typeof usernameQueryParam === 'string') return usernameQueryParam;
    return '';
  }

  private injectSocialMetaTags(html: string, targetUsername: string, targetTheme: string, baseUrl: string): string {
    const encodedUser = encodeURIComponent(targetUsername);
    const encodedTheme = encodeURIComponent(targetTheme);

    const safeImageUrl = escapeXml(`${baseUrl}/api/stats?username=${encodedUser}&theme=${encodedTheme}`);
    const safeTitle = escapeXml(`Tarjetas de estadísticas para @${targetUsername} | GitHub Helpers`);
    const safeDescription = escapeXml(
      `Mira las estadísticas, lenguajes más usados y trofeos de GitHub para @${targetUsername} generados dinámicamente.`
    );

    return html
      .replace(/<meta property="og:image" content="[^"]*"\/?>/gi, () => `<meta property="og:image" content="${safeImageUrl}" />`)
      .replace(/<meta property="twitter:image" content="[^"]*"\/?>/gi, () => `<meta property="twitter:image" content="${safeImageUrl}" />`)
      .replace(/<meta property="og:title" content="[^"]*"\/?>/gi, () => `<meta property="og:title" content="${safeTitle}" />`)
      .replace(/<meta property="twitter:title" content="[^"]*"\/?>/gi, () => `<meta property="twitter:title" content="${safeTitle}" />`)
      .replace(/<meta property="og:description" content="[^"]*"\/?>/gi, () => `<meta property="og:description" content="${safeDescription}" />`)
      .replace(/<meta property="twitter:description" content="[^"]*"\/?>/gi, () => `<meta property="twitter:description" content="${safeDescription}" />`)
      .replace(/<meta name="description" content="[^"]*"\/?>/gi, () => `<meta name="description" content="${safeDescription}" />`)
      .replace(/<title>[^<]*<\/title>/gi, () => `<title>${safeTitle}</title>`);
  }
}
