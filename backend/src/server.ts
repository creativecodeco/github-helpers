// Server entry point
import { bootstrap } from './main';

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

