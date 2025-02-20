/*
 * SPDX-FileCopyrightText: 2024 SAP Spartacus team <spartacus-team@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StrategyProducts } from '../../model/strategy-products.model';
import { StrategyRequest } from './../../../cds-models/cds-strategy-request.model';
import { MerchandisingStrategyAdapter } from './merchandising-strategy.adapter';

@Injectable({
  providedIn: 'root',
})
export class MerchandisingStrategyConnector {
  constructor(protected strategyAdapter: MerchandisingStrategyAdapter) {}

  loadProductsForStrategy(
    strategyId: string,
    strategyRequest?: StrategyRequest
  ): Observable<StrategyProducts> {
    return this.strategyAdapter.loadProductsForStrategy(
      strategyId,
      strategyRequest
    );
  }
}
