#import <RCTAppDelegate.h>
#import <UIKit/UIKit.h>
#import <Expo/Expo.h>
#import "RNAppAuthAuthorizationFlowManager.h"

@interface AppDelegate : RCTAppDelegate <RNAppAuthAuthorizationFlowManager>

@property(nonatomic, weak) id<RNAppAuthAuthorizationFlowManagerDelegate> authorizationFlowManagerDelegate;

@end
