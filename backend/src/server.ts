import { env } from './infrastructure/config/env';
import { buildContainer } from './main/container';
import { createApp } from './presentation/app';

const app = createApp(buildContainer());

app.listen(env.port, () => {
  console.log(`🚀 Server running on port ${env.port}`);
});
