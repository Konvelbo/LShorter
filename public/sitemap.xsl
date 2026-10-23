<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:html="http://www.w3.org/TR/REC-html40"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
      <head>
        <title>XML Sitemap | LShorter Edge Platform</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style type="text/css">
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #f8fafc;
            color: #0f172a;
            padding: 32px 16px;
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
          }
          .container {
            max-width: 1040px;
            margin: 0 auto;
          }
          .card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 32px;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
          }
          .header {
            margin-bottom: 24px;
            padding-bottom: 20px;
            border-bottom: 1px solid #e2e8f0;
          }
          h1 {
            font-size: 26px;
            font-weight: 700;
            letter-spacing: -0.02em;
            color: #0f172a;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .badge {
            display: inline-block;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            background: #e0f2fe;
            color: #0284c7;
            padding: 3px 8px;
            border-radius: 6px;
          }
          p.desc {
            font-size: 14px;
            color: #475569;
            margin-bottom: 6px;
          }
          p.meta {
            font-size: 13px;
            color: #64748b;
          }
          a {
            color: #2563eb;
            text-decoration: none;
            transition: color 0.15s ease;
          }
          a:hover {
            color: #1d4ed8;
            text-decoration: underline;
          }
          .table-wrapper {
            margin-top: 20px;
            overflow-x: auto;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            text-align: left;
          }
          thead th {
            background-color: #f1f5f9;
            color: #334155;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            padding: 10px 14px;
            border-bottom: 1px solid #cbd5e1;
            white-space: nowrap;
          }
          tbody tr {
            border-bottom: 1px solid #f1f5f9;
            transition: background-color 0.15s ease;
          }
          tbody tr:last-child {
            border-bottom: none;
          }
          tbody tr:hover {
            background-color: #f8fafc;
          }
          tbody tr:nth-child(even) {
            background-color: #fafafa;
          }
          tbody tr:nth-child(even):hover {
            background-color: #f1f5f9;
          }
          td {
            padding: 10px 14px;
            vertical-align: middle;
          }
          td.url {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 12.5px;
            word-break: break-all;
          }
          td.num {
            color: #94a3b8;
            font-size: 11px;
            width: 40px;
            text-align: center;
          }
          td.priority {
            font-weight: 600;
            color: #0f172a;
            white-space: nowrap;
          }
          td.freq {
            color: #64748b;
            text-transform: capitalize;
            white-space: nowrap;
          }
          td.date {
            color: #64748b;
            white-space: nowrap;
            font-size: 12px;
          }
          .footer {
            margin-top: 24px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <h1>
                <span>XML Sitemap</span>
                <span class="badge">LShorter SEO</span>
              </h1>
              <p class="desc">
                Generated dynamically for search engines like Google, Bing, DuckDuckGo, and Yandex.
              </p>
              <p class="meta">
                You can find more information about XML sitemaps on <a href="https://www.sitemaps.org" target="_blank" rel="noopener">sitemaps.org</a>.
              </p>
            </div>

            <!-- If this is a Sitemap Index -->
            <xsl:if test="count(sitemap:sitemapindex/sitemap:sitemap) &gt; 0">
              <p class="desc">
                This XML Sitemap Index file contains <strong><xsl:value-of select="count(sitemap:sitemapindex/sitemap:sitemap)"/></strong> sub-sitemaps.
              </p>
              <div class="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th class="num">#</th>
                      <th>Sitemap URL</th>
                      <th>Last Modified</th>
                    </tr>
                  </thead>
                  <tbody>
                    <xsl:for-each select="sitemap:sitemapindex/sitemap:sitemap">
                      <tr>
                        <td class="num"><xsl:value-of select="position()"/></td>
                        <td class="url">
                          <a href="{sitemap:loc}">
                            <xsl:value-of select="sitemap:loc"/>
                          </a>
                        </td>
                        <td class="date">
                          <xsl:value-of select="concat(substring(sitemap:lastmod, 0, 11), concat(' ', substring(sitemap:lastmod, 12, 5)))"/>
                        </td>
                      </tr>
                    </xsl:for-each>
                  </tbody>
                </table>
              </div>
            </xsl:if>

            <!-- If this is a standard URL Set -->
            <xsl:if test="count(sitemap:urlset/sitemap:url) &gt; 0">
              <p class="desc">
                This XML Sitemap contains <strong><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></strong> URLs.
              </p>
              <div class="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th class="num">#</th>
                      <th>Page URL</th>
                      <th>Priority</th>
                      <th>Change Freq.</th>
                      <th>Last Modified</th>
                    </tr>
                  </thead>
                  <tbody>
                    <xsl:for-each select="sitemap:urlset/sitemap:url">
                      <tr>
                        <td class="num"><xsl:value-of select="position()"/></td>
                        <td class="url">
                          <a href="{sitemap:loc}">
                            <xsl:value-of select="sitemap:loc"/>
                          </a>
                        </td>
                        <td class="priority">
                          <xsl:value-of select="sitemap:priority"/>
                        </td>
                        <td class="freq">
                          <xsl:value-of select="sitemap:changefreq"/>
                        </td>
                        <td class="date">
                          <xsl:value-of select="concat(substring(sitemap:lastmod, 0, 11), concat(' ', substring(sitemap:lastmod, 12, 5)))"/>
                        </td>
                      </tr>
                    </xsl:for-each>
                  </tbody>
                </table>
              </div>
            </xsl:if>
          </div>

          <div class="footer">
            LShorter Edge Platform • Enterprise Short Links &amp; Real-time Edge Routing
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
