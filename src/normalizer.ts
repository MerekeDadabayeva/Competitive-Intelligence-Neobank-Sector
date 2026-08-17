import * as cheerio from 'cheerio';

export interface NormalizerOptions {
  stripBanners?: boolean;
  stripFooters?: boolean;
  preserveNumbers?: boolean;
}

export function normalizeHtml(rawHtml: string, selector?: string, options: NormalizerOptions = {}): string {
  if (!rawHtml || rawHtml.trim().length === 0) {
    return '';
  }

  const $ = cheerio.load(rawHtml);

  // 1. Remove non-content tags & noise
  $('script, style, svg, noscript, iframe, template, object, embed').remove();
  $('input[type="hidden"], [name*="csrf"], [name*="token"], [name*="nonce"]').remove();

  // 2. Remove cookie banners & consent overlays
  $('#onetrust-consent-sdk, #onetrust-banner-sdk, #cookie-banner, .cookie-banner, [id*="cookie-consent"], [class*="cookie-banner"]').remove();
  $('.promo-banner, header.promo-banner, .banner-cookie, [data-testid*="cookie"]').remove();

  // 3. Remove social proof, testimonials, and review quotes (rotate independently of product content)
  $('.testimonials, .testimonial, .social-proof, .reviews-widget, [class*="testimonial"], [class*="social-proof"]').remove();

  // 4. Remove live chat widgets (Intercom, Drift, Zendesk, etc.)
  $('#intercom-container, .intercom-lightweight-app, [id*="intercom"], [class*="drift-"], [id*="zendesk"]').remove();

  // 5. Remove footer copyright notices & meta tags if stripping noise
  $('footer, .footer, meta, link').remove();

  // 4. Select target element if specified
  let target: cheerio.Cheerio<any> = $('body');
  if (selector) {
    const selectors = selector.split(',').map(s => s.trim());
    for (const sel of selectors) {
      const match = $(sel);
      if (match.length > 0) {
        target = match;
        break;
      }
    }
  }

  // 5. Convert tables to clean markdown-like text
  target.find('table').each((_, table) => {
    const rows: string[] = [];
    $(table).find('tr').each((_, tr) => {
      const cells: string[] = [];
      $(tr).find('th, td').each((_, cell) => {
        cells.push($(cell).text().trim().replace(/[\r\n\t]+/g, ' '));
      });
      if (cells.length > 0) {
        rows.push(`| ${cells.join(' | ')} |`);
      }
    });
    if (rows.length > 0) {
      $(table).replaceWith(`\n${rows.join('\n')}\n`);
    }
  });

  // 6. Convert list items to bullet points
  target.find('li').each((_, li) => {
    const text = $(li).text().trim().replace(/[\r\n\t]+/g, ' ');
    if (text) {
      $(li).replaceWith(`\n- ${text}\n`);
    }
  });

  // 7. Convert headings
  target.find('h1, h2, h3, h4').each((_, h) => {
    const level = h.tagName.toLowerCase();
    const prefix = level === 'h1' ? '# ' : level === 'h2' ? '## ' : '### ';
    const text = $(h).text().trim().replace(/[\r\n\t]+/g, ' ');
    if (text) {
      $(h).replaceWith(`\n${prefix}${text}\n`);
    }
  });

  // 8. Extract clean text lines
  const rawText = target.text();

  // 9. Normalize whitespace line by line
  const lines = rawText
    .split(/\r?\n/)
    .map(line => line.trim())
    // Filter out dynamic noise like standalone timestamps, tracking params, and empty lines
    .filter(line => {
      if (line.length === 0) return false;
      // Filter out isolated ISO date timestamps or session strings
      if (/^(Server time:|Promotion valid until|Session:|Last updated:).*$/i.test(line)) return false;
      if (/^©\s*\d{4}\b/i.test(line)) return false;
      return true;
    });

  // Rejoin with single newlines
  return lines.join('\n');
}

/**
 * Extracts numeric and currency values from text to ensure numbers are preserved
 */
export function extractNumericTokens(text: string): string[] {
  // Matches: 3.75%, 0.00 €, €16.90, 4.99 EUR, 1.49%, 500 €, 5 bps, etc.
  const regex = /(\d+(?:[.,]\d+)?\s*(?:%|€|EUR|USD|\$|GBP|£|p\.a\.|bps|\/month|\/trade))/gi;
  const matches = text.match(regex);
  return matches ? matches.map(m => m.trim().toLowerCase()) : [];
}
