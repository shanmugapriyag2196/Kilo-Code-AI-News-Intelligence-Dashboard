import 'dotenv/config';
import { loadConfig } from '../config';
import { refreshNews } from '../routes/news';

async function main() {
  const config = loadConfig();
  console.log('Starting manual refresh...');
  const result = await refreshNews(config);
  console.log('Refresh complete:', result);
  process.exit(result.error ? 1 : 0);
}

main();
