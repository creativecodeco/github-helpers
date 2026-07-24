import { Injectable } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import path from 'node:path';
import fs from 'node:fs';

/** Base directory for compiled public static assets */
const PUBLIC_DIR = path.resolve(__dirname, '../../../../public');

@Injectable()
export class HtmlFileService {
  /**
   * Reads and returns the content of a public HTML file.
   * Returns null if the file does not exist.
   */
  readPublicFile(relativePath: string): string | null {
    const filePath = path.resolve(PUBLIC_DIR, relativePath);
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, 'utf-8');
  }

  /**
   * Sends a public HTML file as an HTTP response.
   * Responds with 404 plain text if the file does not exist.
   */
  serveFile(relativePath: string, res: FastifyReply): void {
    const content = this.readPublicFile(relativePath);

    if (content === null) {
      res.status(404).header('Content-Type', 'text/plain').send('Page not found.');
      return;
    }

    res
      .status(200)
      .header('Content-Type', 'text/html; charset=utf-8')
      .header('Cache-Control', 'no-cache, must-revalidate')
      .send(content);
  }
}
