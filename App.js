import 'fast-text-encoding';
import 'react-native-url-polyfill/auto';
import './sui/env';
import React, {useState, useCallback, useMemo, useEffect} from 'react';
import {Alert} from 'react-native';
import {
    authorize,
    refresh,
    revoke,
    prefetchConfiguration,
} from 'react-native-app-auth';
import {
    Page,
    Button,
    ButtonContainer,
    Form,
    FormLabel,
    FormValue,
    Heading,
} from './components';
import {
    doLogin,
    prepareLogin,
    getSaltFromMystenAPI,
    getZNPFromMystenAPI,
    UserKeyData,
    LoginResponse,
    executeTransactionWithZKP,
    getZNPFromEnoki,
    getSaltFromEnoki,
} from "./sui/zkLogin";
import {useSui} from "./sui/hooks/useSui";
import jwt_decode from "jwt-decode";
import {generateNonce, generateRandomness, genAddressSeed, getZkLoginSignature, jwtToAddress} from '@mysten/zklogin';

const configs = {
    auth0: {
        issuer: 'https://accounts.google.com',
        clientId: '70599191792-e7cuqm6pldc8ffp3hg9ie84n4d8u0stm.apps.googleusercontent.com',
        redirectUrl: 'com.googleusercontent.apps.70599191792-e7cuqm6pldc8ffp3hg9ie84n4d8u0stm:/oauth2redirect/google',
        scopes: ['openid'],
        response_type: 'id_token',
    },
    auth1: {
        issuer: 'https://accounts.google.com',
        clientId: '595966210064-3nnnqvmaelqnqsmq448kv05po362smt2.apps.googleusercontent.com',
        redirectUrl: 'https://poc-zklogin.vercel.app/proxy?redirect_uri=com.googleusercontent.apps.70599191792-e7cuqm6pldc8ffp3hg9ie84n4d8u0stm:/oauth2redirect/google',
        scopes: ['openid'],
        response_type: 'id_token',
    }
};

const defaultAuthState = {
    hasLoggedInOnce: false,
    provider: '',
    accessToken: '',
    accessTokenExpirationDate: '',
    refreshToken: '',
};

const App = () => {
    const [authState, setAuthState] = useState(defaultAuthState);
    const {suiClient} = useSui();
    const [suiVars, setSuiVars] = useState();
    // const [enokiFlow, setEnokiFlow] = useState();
    // useEffect(() => {
    //     setEnokiFlow(new EnokiFlow({
    //         apiKey: "enoki_apikey_3662ad8b95e837bc26cf41dee4900d37",
    //     }));
    // }, []);

    const handleAuthorize = useCallback(async provider => {
        try {

            const suiConst = await prepareLogin(suiClient);

            setSuiVars(suiConst);
            const configuration = {
                warmAndPrefetchChrome: true,
                connectionTimeoutSeconds: 5,
                ...configs.auth0,
            };
            prefetchConfiguration(configuration);

            // const registerConfig = {
            //   additionalParameters: {
            //     nonce: suiConst.nonce,
            //   },
            // };
            // const registerResult = await register(registerConfig);

            const config = {
                ...(configs[provider]),
                useNonce: false,
                additionalParameters: {
                    nonce: suiConst.nonce,
                },
                connectionTimeoutSeconds: 5,
                iosPrefersEphemeralSession: true,
                prefersEphemeralWebBrowserSession: true,
            };

            const newAuthState = await authorize(config);

            setAuthState({
                hasLoggedInOnce: true,
                provider: provider,
                ...newAuthState,
            });

            console.log('Google auth jwt :', newAuthState.idToken);
            console.log('From SUI const :', suiConst);


            const decodedJwt = jwt_decode(newAuthState.idToken);
            console.log('Google auth response.nonce :', decodedJwt.nonce);

            if (decodedJwt.nonce !== suiConst.nonce) {
                Alert.alert('Missatching Google nonce! Your auth try was probably spoofed');
                return;
            }

            console.log("Google JWT response:", newAuthState.idToken);

            // zkLogin Flow
            const salt = await getSaltFromMystenAPI(newAuthState.idToken);
            // setSuiVars(...suiVars, salt);
            console.log("Salt:", salt);

            const zkp = await getZNPFromMystenAPI(newAuthState.idToken, salt, suiConst);
            // setSuiVars(...suiVars, zkp);
            const address = jwtToAddress(newAuthState.idToken, BigInt(salt));
            console.log("ZKP:", zkp, 'my Address:', address);


            // Execute sample transaction
            const transactionData = executeTransactionWithZKP(newAuthState.idToken, zkp, suiConst, salt, suiClient);
            console.log("Transaction finished:", transactionData);

        } catch (error) {
            Alert.alert('Failed to log in', error.message);
            console.log("log in Error:", error);
        }

    }, []);

    const handleAuthorize2 = useCallback(async provider => {
        try {

            const suiConst = await prepareLogin(suiClient);

            setSuiVars(suiConst);
            const configuration = {
                warmAndPrefetchChrome: true,
                connectionTimeoutSeconds: 5,
                ...configs.auth0,
            };
            prefetchConfiguration(configuration);

            // const registerConfig = {
            //   additionalParameters: {
            //     nonce: suiConst.nonce,
            //   },
            // };
            // const registerResult = await register(registerConfig);

            const config = {
                ...(configs[provider]),
                useNonce: false,
                additionalParameters: {
                    nonce: suiConst.nonce,
                },
                connectionTimeoutSeconds: 5,
                iosPrefersEphemeralSession: true,
                prefersEphemeralWebBrowserSession: true,
            };

            const newAuthState = await authorize(config);

            setAuthState({
                hasLoggedInOnce: true,
                provider: provider,
                ...newAuthState,
            });

            console.log('Google auth jwt :', newAuthState.idToken);
            console.log('From SUI const :', suiConst);


            const decodedJwt = jwt_decode(newAuthState.idToken);
            console.log('Google auth response.nonce :', decodedJwt.nonce);

            if (decodedJwt.nonce !== suiConst.nonce) {
                Alert.alert('Missatching Google nonce! Your auth try was probably spoofed');
                return;
            }

            console.log("Google JWT response:", newAuthState.idToken);

            // zkLogin Flow
            const salt = await getSaltFromEnoki(newAuthState.idToken, "enoki_apikey_3662ad8b95e837bc26cf41dee4900d37");
            // setSuiVars(...suiVars, salt);
            console.log("Salt from enoki:", salt);

            const zkp = await getZNPFromEnoki(newAuthState.idToken, suiConst, "enoki_apikey_3662ad8b95e837bc26cf41dee4900d37");
            // setSuiVars(...suiVars, zkp);
            // const address = jwtToAddress(newAuthState.idToken, BigInt(salt));
            console.log("ZKP from enoki:", zkp, 'my Address:', salt.address);


            // Execute sample transaction
            const transactionData = executeTransactionWithZKP(newAuthState.idToken, zkp, suiConst, salt.salt, suiClient);
            console.log("Transaction finished:", transactionData);

        } catch (error) {
            Alert.alert('Failed to log in', error.message);
            console.log("log in Error:", error);
        }

    }, []);

    const handleRefresh = useCallback(async provider => {
        try {

            const suiConst = await prepareLogin(suiClient);
            setSuiVars(suiConst);
            const configuration = {
                warmAndPrefetchChrome: true,
                connectionTimeoutSeconds: 5,
                nonce: suiConst.nonce,
                ...configs.auth0,
            };
            prefetchConfiguration(configuration);

            // const registerConfig = {
            //   additionalParameters: {
            //     nonce: suiConst.nonce,
            //   },
            // };
            // const registerResult = await register(registerConfig);

            const config = {
                ...(configs[provider]),
                useNonce: false,
                additionalParameters: {
                    nonce: suiConst.nonce,
                },
                state: {
                    nonce: suiConst.nonce,
                },
                connectionTimeoutSeconds: 5,
                iosPrefersEphemeralSession: false,
                prefersEphemeralWebBrowserSession: false,
            };
            console.log("Google refresh request:", config, "Auth state:", authState);
            const newAuthState = await authorize(config);
            //     , {
            //   refreshToken: authState.refreshToken,
            // });

            setAuthState({
                hasLoggedInOnce: true,
                provider: provider,
                ...newAuthState,
            });

            // console.log('Google auth jwt :', newAuthState);
            const decodedJwt = jwt_decode(newAuthState.idToken);
            console.log('Google refresh response.nonce :', decodedJwt.nonce);

            if (decodedJwt.nonce !== suiConst.nonce) {
                Alert.alert('Missatching Google nonce! Your auth try was probably spoofed');
                return;
            }

            // const salt = await getSaltFromMystenAPI(newAuthState.idToken);
            // // setSuiVars(...suiVars, salt);
            // console.log("Salt:", salt);
            //
            // const zkp = await getZNPFromMystenAPI(newAuthState.idToken, salt, suiConst);
            // // setSuiVars(...suiVars, zkp);
            // const address = jwtToAddress(newAuthState.idToken, BigInt(salt));
            // console.log("ZKP:", zkp, 'my Address:', address);
            //
            //
            // // Execute sample transaction
            // const transactionData = executeTransactionWithZKP(newAuthState.idToken, zkp, suiConst, salt, suiClient);
            // console.log("Transaction finished:", transactionData);


        } catch (error) {
            Alert.alert('Failed to refresh token', error.message);
        }
    }, [authState]);

    const handleRevoke = useCallback(async () => {
        try {
            const config = configs[authState.provider];
            await revoke(config, {
                tokenToRevoke: authState.accessToken,
                sendClientId: true,
            });

            setAuthState({
                provider: '',
                accessToken: '',
                accessTokenExpirationDate: '',
                refreshToken: '',
            });
        } catch (error) {
            Alert.alert('Failed to revoke token', error.message);
        }
    }, [authState]);

    const showRevoke = useMemo(() => {
        if (authState.accessToken) {
            const config = configs[authState.provider];
            if (config.issuer || config.serviceConfiguration.revocationEndpoint) {
                return true;
            }
        }
        return false;
    }, [authState]);

    return (
        <Page>
            {authState.accessToken ? (
                <Form>
                    <FormLabel>accessToken</FormLabel>
                    <FormValue>{authState.accessToken}</FormValue>
                    <FormLabel>accessTokenExpirationDate</FormLabel>
                    <FormValue>{authState.accessTokenExpirationDate}</FormValue>
                    <FormLabel>refreshToken</FormLabel>
                    <FormValue>{authState.refreshToken}</FormValue>
                    <FormLabel>scopes</FormLabel>
                    <FormValue>{authState.scopes}</FormValue>
                </Form>
            ) : (
                <Heading>
                    {authState.hasLoggedInOnce ? 'Goodbye.' : 'Hello, stranger.'}
                </Heading>
            )}

            <ButtonContainer>
                {!authState.accessToken ? (
                    <>
                        <Button
                          onPress={() => handleAuthorize2('auth0')}
                          text="zkLogin with Enoki"
                          color="#DA2536"
                        />
                        <Button
                            onPress={() => handleAuthorize('auth0')}
                            text="zkLogin deprecated flow"
                            color="#DA2536"
                        />
                    </>
                ) : null}
                {authState.refreshToken ? (
                    <Button onPress={() => handleRefresh('auth0')} text="Refresh" color="#24C2CB"/>
                ) : null}
                {showRevoke ? (
                    <Button onPress={handleRevoke} text="Revoke" color="#EF525B"/>
                ) : null}
            </ButtonContainer>
        </Page>
    );
};

export default App;
