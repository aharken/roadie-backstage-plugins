/*
 * Copyright 2021 Larder Software Limited
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

/** Configuration for the Prometheus plugin */
export interface Config {
  /**
   * @visibility frontend
   */
  prometheus?: {
    /**
     * The base url of the Prometheus.
     * Should be used in case direct access to Prometheus from the browser is available.
     * @visibility frontend
     */
    baseUrl?: string;

    /**
     * The proxy path for Prometheus.
     * Should be used if proxy is in use for security etc purposes.
     * @visibility frontend
     */
    proxyPath?: string;
  };
}
