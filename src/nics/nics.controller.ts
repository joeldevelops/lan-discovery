import { Router } from 'express';

import * as nicsService from './nics.service';

const router = Router();

router.get('/v1/nics', async (req, res) => {
  const nics = nicsService.resolveNicNames();

  return res.json(nics);
});

router.get('/v1/nics/:name/discover-lan', async (req, res) => {
  const name = req.params.name;

  let hosts;
  try {
    hosts = nicsService.discoverLanHosts(name)
  }catch (error) {
    if (error.name === 'MissingNicError' || error.name === 'SourceIPError') {
      return res.status(400).send(error.message);
    }
    else {
      return res.status(500).send(
        'An error occurred when checking the local network for live hosts.'
      );
    }
  }

  return res.json(hosts);
});

export default router;