import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { GlobalMessageService, I18nTestingModule } from '@spartacus/core';
import { ServiceCheckoutDeliveryModeComponent } from './service-checkout-delivery-mode.component';
import { ActivatedRoute } from '@angular/router';
import { CheckoutStepService } from '@spartacus/checkout/base/components';
import createSpy = jasmine.createSpy;
import { ReactiveFormsModule } from '@angular/forms';
import { OutletModule } from '@spartacus/storefront';
import {
  CheckoutServiceDetailsFacade,
  S4ServiceDeliveryModeConfig,
} from '@spartacus/s4-service/root';
import { BehaviorSubject, of } from 'rxjs';
import { ActiveCartFacade, Cart, OrderEntry } from '@spartacus/cart/base/root';
const mockCart: Cart = {
  code: '123456789',
  description: 'testCartDescription',
  name: 'testCartName',
};
const deliveryEntries$ = new BehaviorSubject<OrderEntry[]>([
  { orderCode: 'testEntry' },
]);
const hasPickupItems$ = new BehaviorSubject<boolean>(false);
const cart$ = new BehaviorSubject<Cart>(mockCart);
const mockActivatedRoute = {
  snapshot: {
    url: ['checkout', 'delivery-mode'],
  },
};
const mockServiceDeliveryModeConfig: S4ServiceDeliveryModeConfig = {
  s4ServiceDeliveryMode: {
    code: 'd1',
  },
};
class MockCheckoutStepService implements Partial<CheckoutStepService> {
  next = createSpy();
  back = createSpy();
  getBackBntText = createSpy().and.returnValue('common.back');
}
class MockGlobalMessageService implements Partial<GlobalMessageService> {
  add() {}
}
class MockCheckoutServiceDetailsFacade {
  hasServiceItems() {
    return of(true);
  }
}
class MockCartService implements Partial<ActiveCartFacade> {
  getDeliveryEntries = () => deliveryEntries$.asObservable();
  hasPickupItems = () => hasPickupItems$.asObservable();
  getPickupEntries = createSpy().and.returnValue(of([]));
  getActive = () => cart$.asObservable();
}
describe('ServiceCheckoutDeliveryModeComponent', () => {
  let component: ServiceCheckoutDeliveryModeComponent;
  let fixture: ComponentFixture<ServiceCheckoutDeliveryModeComponent>;
  let facade: CheckoutServiceDetailsFacade;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, I18nTestingModule, OutletModule],
      declarations: [ServiceCheckoutDeliveryModeComponent],
      providers: [
        {
          provide: CheckoutServiceDetailsFacade,
          useClass: MockCheckoutServiceDetailsFacade,
        },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ActiveCartFacade, useClass: MockCartService },
        { provide: CheckoutStepService, useClass: MockCheckoutStepService },
        { provide: GlobalMessageService, useClass: MockGlobalMessageService },
        {
          provide: S4ServiceDeliveryModeConfig,
          useValue: mockServiceDeliveryModeConfig,
        },
      ],
    }).compileComponents();
    facade = TestBed.inject(CheckoutServiceDetailsFacade);
    spyOn(facade, 'hasServiceItems').and.callThrough();
    fixture = TestBed.createComponent(ServiceCheckoutDeliveryModeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should be created', (done) => {
    expect(component).toBeTruthy();
    expect(component.serviceDeliveryConfig).toEqual({ code: 'd1' });
    component.hasServiceProducts$.subscribe((result) => {
      expect(result).toEqual(true);
      expect(facade.hasServiceItems).toHaveBeenCalled();
      done();
    });
  });
});
