import 'dotenv/config';
import { app } from './app';
import { AppDataSource } from './data-source';

AppDataSource.initialize().then(() => {
  const port = process.env.PORT;

  app.listen(port, () => {
    console.log(`Server listening at port ${port}`);
  });
});
