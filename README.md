# react-native-zklogin-poc

This is a POC example implementation of zkLogin for a React Native client.

It uses 2 ways to zkLogin:
1) Enoki,
It utilises Enoki service to acquire all required nonce, salt zero knowledge proof and signs a transaction with these. More on the Enoki service can be found here: https://docs.enoki.mystenlabs.com/
2) zkLogin native, 
It creates locally a nonce then, a Salt, logs in with Google and then using Google's jwt token it acquires ephemeral keys from the Mysten Lab's DEV prover service. 
Then with these it is signing an example transaction to make sure everything is working fine.

UI wise everything is logged in the user's mobile.


## Installation
This is a standard React Native application. This POC has been tested in iOS for which the following instructions stand

### Prerequisites

1) Cocoapods (iOS package manager), https://formulae.brew.sh/formula/cocoapods
2) React Native, https://reactnative.dev/docs/environment-setup
3) XCode along with Apple's Command line tools along with at least an iOS simulator (or connected device setup in developer mode in case you want to run it directly there) 

### Running the application 
1) Install react native dependencies: In the root folder run `npm i`
2) Then install iOS dependencies: In the `ios` folder run `pod install`
3) Run the application: In the root folder run `npm run ios`


![Screenshot 2024-02-07 at 8.10.51 PM.png](assets%2FScreenshot%202024-02-07%20at%208.10.51%E2%80%AFPM.png)