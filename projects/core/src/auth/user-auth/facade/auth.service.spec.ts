import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Store, StoreModule } from '@ngrx/store';
import { OAuthEvent, TokenResponse } from 'angular-oauth2-oidc';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { take } from 'rxjs/operators';
import { OCC_USER_ID_CURRENT } from '../../../occ';
import { RoutingService } from '../../../routing/facade/routing.service';
import { AuthToken } from '../models/auth-token.model';
import { AuthMultisiteIsolationService } from '../services/auth-multisite-isolation.service';
import { AuthRedirectService } from '../services/auth-redirect.service';
import { AuthStorageService } from '../services/auth-storage.service';
import { OAuthLibWrapperService } from '../services/oauth-lib-wrapper.service';
import { AuthActions } from '../store/actions';
import { AuthService } from './auth.service';
import { UserIdService } from './user-id.service';

class MockUserIdService implements Partial<UserIdService> {
  getUserId(): Observable<string> {
    return of('');
  }
  clearUserId() {}
  setUserId() {}
}

const oauthLibEvents = new BehaviorSubject<OAuthEvent>({
  type: 'token_received',
});
class MockOAuthLibWrapperService implements Partial<OAuthLibWrapperService> {
  revokeAndLogout() {
    return Promise.resolve();
  }
  authorizeWithPasswordFlow() {
    return Promise.resolve({} as TokenResponse);
  }
  initLoginFlow() {}
  tryLogin() {
    return Promise.resolve({ result: true, tokenReceived: true });
  }
  events$ = oauthLibEvents;
}

class MockAuthStorageService implements Partial<AuthStorageService> {
  getToken() {
    return of({ access_token: 'token' } as AuthToken);
  }
  getItem() {
    return 'value';
  }
}

class MockAuthRedirectService implements Partial<AuthRedirectService> {
  redirect() {}
}

class MockRoutingService implements Partial<RoutingService> {
  go = () => Promise.resolve(true);
}

class MockAuthMultisiteIsolationService {
  getBaseSiteDecorator(): Observable<string> {
    return of('');
  }
  decorateUserId(): Observable<string> {
    return of('username');
  }
}

describe('AuthService', () => {
  let service: AuthService;
  let routingService: RoutingService;
  let authStorageService: AuthStorageService;
  let userIdService: UserIdService;
  let oAuthLibWrapperService: OAuthLibWrapperService;
  let authRedirectService: AuthRedirectService;
  let authMultisiteIsolationService: AuthMultisiteIsolationService;
  let store: Store;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StoreModule.forRoot({})],
      providers: [
        AuthService,
        {
          provide: UserIdService,
          useClass: MockUserIdService,
        },
        {
          provide: OAuthLibWrapperService,
          useClass: MockOAuthLibWrapperService,
        },
        { provide: AuthStorageService, useClass: MockAuthStorageService },
        { provide: AuthRedirectService, useClass: MockAuthRedirectService },
        { provide: RoutingService, useClass: MockRoutingService },
        {
          provide: AuthMultisiteIsolationService,
          useClass: MockAuthMultisiteIsolationService,
        },
      ],
    });

    service = TestBed.inject(AuthService);
    routingService = TestBed.inject(RoutingService);
    authStorageService = TestBed.inject(AuthStorageService);
    userIdService = TestBed.inject(UserIdService);
    oAuthLibWrapperService = TestBed.inject(OAuthLibWrapperService);
    authRedirectService = TestBed.inject(AuthRedirectService);
    authMultisiteIsolationService = TestBed.inject(
      AuthMultisiteIsolationService
    );
    store = TestBed.inject(Store);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('checkOAuthParamsInUrl()', () => {
    it('should login user when token is present', async () => {
      spyOn(oAuthLibWrapperService, 'tryLogin').and.callThrough();
      spyOn(userIdService, 'setUserId').and.callThrough();
      spyOn(store, 'dispatch').and.callThrough();
      spyOn(authStorageService, 'getItem').and.returnValue('token');

      await service.checkOAuthParamsInUrl();

      expect(oAuthLibWrapperService.tryLogin).toHaveBeenCalled();
      expect(userIdService.setUserId).toHaveBeenCalledWith(OCC_USER_ID_CURRENT);
      expect(store.dispatch).toHaveBeenCalledWith(new AuthActions.Login());
    });

    describe('when the token is received', () => {
      it('should redirect', async () => {
        spyOn(authRedirectService, 'redirect').and.callThrough();

        await service.checkOAuthParamsInUrl();

        expect(authRedirectService.redirect).toHaveBeenCalled();
      });
    });

    describe('when the token is NOT received', () => {
      it('should NOT redirect', async () => {
        spyOn(oAuthLibWrapperService, 'tryLogin').and.returnValue(
          Promise.resolve({ result: true, tokenReceived: false })
        );
        spyOn(authRedirectService, 'redirect').and.stub();

        await service.checkOAuthParamsInUrl();

        expect(authRedirectService.redirect).not.toHaveBeenCalled();
      });
    });
  });

  describe('loginWithRedirect()', () => {
    it('should initialize login flow', () => {
      spyOn(oAuthLibWrapperService, 'initLoginFlow').and.callThrough();

      const result = service.loginWithRedirect();

      expect(result).toBeTrue();
      expect(oAuthLibWrapperService.initLoginFlow).toHaveBeenCalled();
    });
  });

  describe('loginWithCredentials()', () => {
    it('should login user', async () => {
      spyOn(
        oAuthLibWrapperService,
        'authorizeWithPasswordFlow'
      ).and.callThrough();
      spyOn(userIdService, 'setUserId').and.callThrough();
      spyOn(authRedirectService, 'redirect').and.callThrough();
      spyOn(store, 'dispatch').and.callThrough();
      spyOn(authMultisiteIsolationService, 'decorateUserId').and.callThrough();

      await service.loginWithCredentials('username', 'pass');

      expect(
        oAuthLibWrapperService.authorizeWithPasswordFlow
      ).toHaveBeenCalledWith('username', 'pass');
      expect(userIdService.setUserId).toHaveBeenCalledWith(OCC_USER_ID_CURRENT);
      expect(store.dispatch).toHaveBeenCalledWith(new AuthActions.Login());
      expect(authRedirectService.redirect).toHaveBeenCalled();
    });
  });

  describe('otpLoginWithCredentials()', () => {
    it('should login user', async () => {
      spyOn(
        oAuthLibWrapperService,
        'authorizeWithPasswordFlow'
      ).and.callThrough();
      spyOn(userIdService, 'setUserId').and.callThrough();
      spyOn(authRedirectService, 'redirect').and.callThrough();
      spyOn(store, 'dispatch').and.callThrough();

      const tokenId = '<LGN[OZ8Ijx92S7pf3KcqtuUxOvM0l2XmZQX+4TUEzXcJyjI=]>';
      const tokenCode = 'XD2iuP';

      await service.otpLoginWithCredentials(tokenId, tokenCode);

      expect(
        oAuthLibWrapperService.authorizeWithPasswordFlow
      ).toHaveBeenCalledWith(tokenId, tokenCode);
      expect(userIdService.setUserId).toHaveBeenCalledWith(OCC_USER_ID_CURRENT);
      expect(store.dispatch).toHaveBeenCalledWith(new AuthActions.Login());
      expect(authRedirectService.redirect).toHaveBeenCalled();
    });
  });

  describe('coreLogout()', () => {
    it('should revoke tokens and logout', fakeAsync(() => {
      spyOn(userIdService, 'clearUserId').and.callThrough();
      spyOn(oAuthLibWrapperService, 'revokeAndLogout').and.callFake(() => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            resolve();
          }, 100);
        });
      });
      spyOn(store, 'dispatch').and.callThrough();

      service.coreLogout();
      expect(userIdService.clearUserId).toHaveBeenCalled();
      expect(oAuthLibWrapperService.revokeAndLogout).toHaveBeenCalled();
      expect(store.dispatch).not.toHaveBeenCalled();
      expect(
        (service.logoutInProgress$ as BehaviorSubject<boolean>).value
      ).toBe(true);

      tick(100);

      expect(store.dispatch).toHaveBeenCalledWith(new AuthActions.Logout());
      expect(
        (service.logoutInProgress$ as BehaviorSubject<boolean>).value
      ).toBe(false);
    }));
  });

  describe('isUserLoggedIn()', () => {
    it('should return true when there is access_token', (done) => {
      service
        .isUserLoggedIn()
        .pipe(take(1))
        .subscribe((result) => {
          expect(result).toBeTrue();
          done();
        });
    });

    it('should return false when there is not access_token', (done) => {
      spyOn(authStorageService, 'getToken').and.returnValue(of(undefined));

      service
        .isUserLoggedIn()
        .pipe(take(1))
        .subscribe((result) => {
          expect(result).toBeFalse();
          done();
        });
    });
  });

  describe('initLogout()', () => {
    it('should redirect url to logout page', () => {
      spyOn(routingService, 'go').and.callThrough();

      service.logout();

      expect(routingService.go).toHaveBeenCalledWith({ cxRoute: 'logout' });
    });
  });
});
