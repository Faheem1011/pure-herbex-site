import https from 'https';

function runPageSpeed(url, strategy) {
  return new Promise((resolve, reject) => {
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&category=PERFORMANCE&category=ACCESSIBILITY&category=BEST_PRACTICES&category=SEO`;
    https.get(apiUrl, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function check() {
  const url = 'https://pureherbex.com';
  console.log(`Running Google PageSpeed Insights for ${url}...`);
  
  for (const strategy of ['mobile', 'desktop']) {
    console.log(`\n========================================`);
    console.log(` STRATEGY: ${strategy.toUpperCase()}`);
    console.log(`========================================`);
    try {
      const data = await runPageSpeed(url, strategy);
      const lhr = data.lighthouseResult;
      if (!lhr) {
        console.error('Error fetching result:', data.error?.message || data);
        continue;
      }
      
      const cats = lhr.categories;
      console.log(`Performance:    ${Math.round(cats.performance.score * 100)} / 100`);
      console.log(`Accessibility:  ${Math.round(cats.accessibility.score * 100)} / 100`);
      console.log(`Best Practices: ${Math.round(cats['best-practices'].score * 100)} / 100`);
      console.log(`SEO:            ${Math.round(cats.seo.score * 100)} / 100`);

      console.log(`\n--- FAILED / OPPORTUNITY AUDITS (${strategy}) ---`);
      const audits = lhr.audits;
      for (const key in audits) {
        const audit = audits[key];
        if (audit.score !== null && audit.score < 0.9 && audit.scoreDisplayMode !== 'notApplicable') {
          console.log(`\n[${audit.score * 100}%] ${audit.title}`);
          if (audit.description) console.log(`  Description: ${audit.description.substring(0, 150)}...`);
          if (audit.displayValue) console.log(`  Value: ${audit.displayValue}`);
          if (audit.details && audit.details.items && audit.details.items.length > 0) {
            console.log(`  Failing items (${audit.details.items.length}):`);
            audit.details.items.slice(0, 5).forEach((item, idx) => {
              const label = item.node?.snippet || item.url || item.label || JSON.stringify(item);
              console.log(`    ${idx+1}. ${label}`);
            });
          }
        }
      }
    } catch (e) {
      console.error(`Failed to run for ${strategy}:`, e.message);
    }
  }
}

check();
