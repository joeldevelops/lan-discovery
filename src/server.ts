import * as express from 'express';
import { json } from 'body-parser';

import nicsController from './nics/nics.controller';

export default async (port) => {
  let app = express();

  app.use(json());

  app.use('/api', nicsController);
  app.get('/test', (req, res) => res.json('ok'));

  app.listen(port, () => {
    console.log("App running on port: ", port);
  });
};