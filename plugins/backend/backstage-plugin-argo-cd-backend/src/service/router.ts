/*
 * Copyright 2020 Spotify AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { errorHandler } from '@backstage/backend-common';
import { Config } from '@backstage/config';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { ArgoService } from './argocd.service';

export interface RouterOptions {
  logger: Logger;
  config: Config;
}

export function createRouter({
  logger,
  config,
}: RouterOptions): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  const argoUserName =
    config.getOptionalString('argocd.username') ?? 'argocd.username';
  const argoPassword =
    config.getOptionalString('argocd.password') ?? 'argocd.password';

  const argoApps = config
    .getConfigArray('argocd.appLocatorMethods')
    .filter(element => element.getString('type') === 'config');
  const appArray: Config[] = argoApps.reduce(
    (acc: Config[], argoApp: Config) =>
      acc.concat(argoApp.getConfigArray('instances')),
    [],
  );
  const argoInstanceArray = appArray.map(instance => ({
    name: instance.getString('name'),
    url: instance.getString('url'),
    token: instance.getOptionalString('token'),
  }));

  router.get('/find/:argoAppName', async (request, response) => {
    const argoAppName = request.params.argoAppName;
    const argoSvc = new ArgoService(argoUserName, argoPassword, config);
    response.send(await argoSvc.findArgoApp(argoAppName));
  });

  router.get(
    '/argoInstance/:argoInstanceName/applications/:argoAppName',
    async (request, response) => {
      const argoInstanceName = request.params.argoInstanceName;
      const argoAppName = request.params.argoAppName;
      logger.info(`Getting info on ${argoAppName}`);

      const argoSvc = new ArgoService(argoUserName, argoPassword, config);

      logger.info(`Getting app ${argoAppName} on ${argoInstanceName}`);
      const matchedArgoInstance = argoInstanceArray.find(
        argoInstance => argoInstance.name === argoInstanceName,
      );
      if (matchedArgoInstance === undefined) {
        return response.status(500).send({
          status: 'failed',
          message: 'cannot find an argo instance to match this cluster',
        });
      }

      let token: string;
      if (!matchedArgoInstance.token) {
        token = await argoSvc.getArgoToken(matchedArgoInstance.url);
      } else {
        token = matchedArgoInstance.token;
      }
      const resp = await argoSvc.getArgoAppData(
        matchedArgoInstance.url,
        matchedArgoInstance.name,
        argoAppName,
        token,
        matchedArgoInstance.name === 'lab-ok8s-cluster' ? true : false,
      );
      return response.send(resp);
    },
  );

  router.use(errorHandler());
  return Promise.resolve(router);
}