import { getAllContent } from '../src/content/content-loader';
import { validateContent } from '../src/content/content-validator';

async function main() {
  console.log('Validating content...\n');

  const items = await getAllContent();
  console.log(`Found ${items.length} content file(s).\n`);

  const errors = validateContent(items);

  if (errors.length > 0) {
    console.error(`Found ${errors.length} validation error(s):\n`);
    for (const err of errors) {
      console.error(`  ${err.file}: ${err.message}`);
    }
    console.error('\nContent validation failed.');
    process.exit(1);
  }

  console.log('All content is valid.');
}

main().catch((err) => {
  console.error('Validation script failed:', err);
  process.exit(1);
});
