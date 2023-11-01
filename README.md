# react-native-zklogin-poc

This is a POC example implementation of zkLogin for a React Native client.

It creates a Salt, logs in with Google and then using Google's jwt token it acquires ephemeral keys from the Mysten Lab's prover service. 
Then with these it is signing an example transaction to make sure everything is working fine.

UI wise everything is logged in the user's mobile.
