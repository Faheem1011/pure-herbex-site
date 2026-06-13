import { pingAllSiteUrls } from "../lib/indexnow";

pingAllSiteUrls().catch((err) => {
  console.error(err);
  process.exit(1);
});
