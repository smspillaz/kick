/*
 * A react-native native modules exposing the Spotify SDK Auth features.
 * Based on the code provided by Giannis in a comment on this Stackoverflow thread:
 * https://stackoverflow.com/questions/41682991/reactnative-ios-spotify-sdk
 */

#import "SpotifyModule.h"
#import "React/RCTLog.h"
#import "React/RCTBridge.h"

@implementation SpotifyModule

/*
 * Exposes the module to react-native.
 * Accessible through NativeModules.SpotifyModule
 */
RCT_EXPORT_MODULE()


+ (id)sharedManager {
  static SpotifyModule *sharedManager = nil;
  @synchronized(self) {
    if (sharedManager == nil)
      sharedManager = [[self alloc] init];
  }
  return sharedManager;
}

- (NSArray *)scopeNamesToSPTScopes:(NSArray *)scopeNames {
  NSMutableArray *scopes = [NSMutableArray array];
  
  //Turn scope arry of strings into an array of SPTAuth...Scope objects
  for (int i = 0; i < [scopeNames count]; i++) {
    if([scopeNames[i]  isEqual: @"playlist-read-private"]){
      [scopes addObject: SPTAuthPlaylistReadPrivateScope];
    } else if([scopeNames[i]  isEqual: @"playlist-modify-private"]){
      [scopes addObject: SPTAuthPlaylistModifyPrivateScope];
    } else if([scopeNames[i]  isEqual: @"playlist-modify-public"]){
      [scopes addObject: SPTAuthPlaylistModifyPublicScope];
    } else if([scopeNames[i]  isEqual: @"user-follow-modify"]){
      [scopes addObject: SPTAuthUserFollowModifyScope];
    } else if([scopeNames[i]  isEqual: @"user-follow-read"]){
      [scopes addObject: SPTAuthUserFollowReadScope];
    } else if([scopeNames[i]  isEqual: @"user-library-read"]){
      [scopes addObject: SPTAuthUserLibraryReadScope];
    } else if([scopeNames[i]  isEqual: @"user-library-modify"]){
      [scopes addObject: SPTAuthUserLibraryModifyScope];
    } else if([scopeNames[i]  isEqual: @"user-read-private"]){
      [scopes addObject: SPTAuthUserReadPrivateScope];
    } else if([scopeNames[i]  isEqual: @"user-read-birthdate"]){
      [scopes addObject: SPTAuthUserReadBirthDateScope];
    } else if([scopeNames[i]  isEqual: @"user-read-email"]){
      [scopes addObject: SPTAuthUserReadEmailScope];
    } else if([scopeNames[i]  isEqual: @"streaming"]){
      [scopes addObject: SPTAuthStreamingScope];
    }
  }

  return scopes;
}

// Exposes the 'authenticate' method to React Native
RCT_EXPORT_METHOD(authenticate:(NSDictionary *)options
                  callback:(RCTResponseSenderBlock)callback)
{
  NSLog(@"Called authenticate");
  SPTAuth *auth = [SPTAuth defaultInstance];
  
  // The spotify client id
  [auth setClientID:options[@"clientID"]];
  
  // The callback (called Custom URL Scheme in XCode project configuration)
  [auth setRedirectURL:[NSURL URLWithString:options[@"redirectURL"]]];

  // The scope request for the token
  [auth setRequestedScopes:[self scopeNamesToSPTScopes:options[@"requestedScopes"]]];

  // OPTIONAL. Allows retrieval of refresheable tokens. If not specified, it uses the 'Implicit Grant' auth workflow
  //[[SPTAuth defaultInstance] setTokenSwapURL: [NSURL URLWithString:@"http://my-token-swap-service.tld/swap.php"]];

  SpotifyModule *spotifyModule = (SpotifyModule *)[SpotifyModule sharedManager];
  spotifyModule.loginCallback = callback;

  //setup event dispatcher
  spotifyModule.eventDispatcher = [[RCTEventDispatcher alloc] init];
  [spotifyModule.eventDispatcher setValue:self.bridge forKey:@"bridge"];
  

  if ([auth.session isValid]) {
    NSDictionary *dict = @{
      @"accessToken": auth.session.accessToken
    };
    spotifyModule.loginCallback(@[[NSNull null], dict]);
  } else {
    // Need to authenticate the application. Open a webview
    // and start the authentication flow.
    NSURL *loginURL = [auth spotifyWebAuthenticationURL];
    RCTLogInfo(@"%@", loginURL);
    spotifyModule.authViewController = [[SFSafariViewController alloc] initWithURL:loginURL];
    [[[UIApplication sharedApplication] delegate].window.rootViewController presentViewController:spotifyModule.authViewController animated:YES completion:nil];
  }
}

/*
 * The method that you need to call when the application is opened through a Custom URL Scheme
 * (Here it would be whenever the webview redirects to: 'intensekick://spotify-auth')
 */
- (BOOL)openURL:(NSURL *)url sourceApplication:(NSString *)sourceApplication annotation:(id)annotation {
  // Ask SPTAuth if the URL given is a Spotify authentication callback
  if ([[SPTAuth defaultInstance] canHandleURL:url] && self.loginCallback != nil) {
    // We can close the authentication window now
    if (self.authViewController == nil) {
      NSLog(@"Uh, oh the view controller is nil...");
    }
    [self.authViewController dismissViewControllerAnimated:YES completion:nil];

    // The 'session' object contains all the data returned by the Spotify API
    [[SPTAuth defaultInstance] handleAuthCallbackWithTriggeredAuthURL:url callback:^(NSError *error, SPTSession *session) {
      // If anything failed, logs the error then returns
      if (error != nil) {
        NSLog(@"*** Auth error: %@", error);
        self.loginCallback(@[error, [NSNull null]]);
        self.loginCallback = nil;
        return;
      }

      self.session = session;
      
      // The object that will be returned to the JS callback
      NSDictionary *inventory = nil;
      
      // Converts the NSDate expiration date to a Unix timestamp
      NSTimeInterval timestamp = [session.expirationDate timeIntervalSince1970];
      NSString *expirationDate = [NSString stringWithFormat:@"%ld", (long)timestamp];
      
      // If a token swap URL was provided, extracts all the fields
      if([[SPTAuth defaultInstance] hasTokenSwapService])
      {
        // We swapped the short lived token for a real one; which means we have access
        // to an access/refresh token and an expiration date
        inventory = @{
                      @"accessToken" : session.accessToken,
                      @"refreshToken" : session.encryptedRefreshToken,
                      @"expirationDate": expirationDate
                      };
      }
      else
      {
        // If we're in the 'Implicit Grant' case, only retrieves the access token, since that is the only
        // thing we have access to
        inventory = @{
                      @"accessToken" : session.accessToken,
                      @"expirationDate": expirationDate
                      };
      }
      
      // Sends the 'inventory' object to the js Callback
      self.loginCallback(@[[NSNull null], inventory]);
      self.loginCallback = nil;
    }];
    
    return YES;
  }
  
  return NO;
}

@end