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
import {doLogin, prepareLogin, getSaltFromMystenAPI, getZNPFromMystenAPI, UserKeyData, LoginResponse} from "./sui/zkLogin";
import {useSui} from "./sui/hooks/useSui";
import jwt_decode from "jwt-decode";
import {AuthWebView } from "./sui/webView";

const configExamples = {
  identityserver: {
    issuer: 'https://demo.duendesoftware.com',
    clientId: 'interactive.public',
    redirectUrl: 'io.identityserver.demo:/oauthredirect',
    additionalParameters: {},
    scopes: ['openid', 'profile', 'email', 'offline_access'],

    // serviceConfiguration: {
    //   authorizationEndpoint: 'https://demo.duendesoftware.com/connect/authorize',
    //   tokenEndpoint: 'https://demo.duendesoftware.com/connect/token',
    //   revocationEndpoint: 'https://demo.duendesoftware.com/connect/revoke'
    // }
  },
  auth0: {
    // From https://openidconnect.net/
    issuer: 'https://samples.auth0.com',
    clientId: 'kbyuFDidLLm280LIwVFiazOqjO3ty8KH',
    redirectUrl: 'https://openidconnect.net/callback',
    additionalParameters: {},
    scopes: ['openid', 'profile', 'email', 'phone', 'address'],

    // serviceConfiguration: {
    //   authorizationEndpoint: 'https://samples.auth0.com/authorize',
    //   tokenEndpoint: 'https://samples.auth0.com/oauth/token',
    //   revocationEndpoint: 'https://samples.auth0.com/oauth/revoke'
    // }
  },
};

const configs = {
  auth0: {
    issuer: 'https://accounts.google.com',
    clientId: '70599191792-e7cuqm6pldc8ffp3hg9ie84n4d8u0stm.apps.googleusercontent.com',
    redirectUrl: 'com.googleusercontent.apps.70599191792-e7cuqm6pldc8ffp3hg9ie84n4d8u0stm:/oauth2redirect/google',
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

  useEffect(() => {


  }, []);

  const handleAuthorizeWebView = useCallback(async provider => {



  },[]);

  const handleAuthorize = useCallback(async provider => {
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

      const config = {
        ...(configs[provider]),
        nonce: suiConst.nonce,
        connectionTimeoutSeconds: 5,
        iosPrefersEphemeralSession: true,
      };
      console.log("Google auth request:", config);
      const newAuthState = await authorize(config);

      setAuthState({
        hasLoggedInOnce: true,
        provider: provider,
        ...newAuthState,
      });

      console.log('Google auth jwt :', newAuthState);
      const decodedJwt: LoginResponse = jwt_decode(newAuthState.idToken);
      console.log('Google auth response.nonce :', decodedJwt.nonce);

      if (decodedJwt.nonce !== suiConst.nonce) {
        Alert.alert('Missatching Google nonce! Your auth try was probably spoofed');
        return;
      }

      const salt = await getSaltFromMystenAPI(newAuthState.idToken);
      // setSuiVars(...suiVars, salt);

      console.log("Salt:", salt);

      const zkp = await getZNPFromMystenAPI(newAuthState.idToken, salt, suiConst);
      console.log("ZKP", zkp);

    } catch (error) {
      Alert.alert('Failed to log in', error.message);
      console.log("Error:", error);
    }

  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      const config = configs[authState.provider];
      const newAuthState = await refresh(config, {
        refreshToken: authState.refreshToken,
      });

      setAuthState(current => ({
        ...current,
        ...newAuthState,
        refreshToken: newAuthState.refreshToken || current.refreshToken,
      }));
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
          <FormValue>{authState.scopes.join(', ')}</FormValue>
        </Form>
      ) : (
        <Heading>
          {authState.hasLoggedInOnce ? 'Goodbye.' : 'Hello, stranger.'}
        </Heading>
      )}

      <ButtonContainer>
        {!authState.accessToken ? (
          <>
            {/*<Button*/}
            {/*  onPress={() => handleAuthorize('identityserver')}*/}
            {/*  text="Authorize IdentityServer"*/}
            {/*  color="#DA2536"*/}
            {/*/>*/}
            {/*<Button*/}
            {/*  onPress={() => handleAuthorizeWebVew()}*/}
            {/*  // onPress={() => handleAuthorize('auth0')}*/}
            {/*  text="zkLogin with Google"*/}
            {/*  color="#DA2536"*/}
            {/*/>*/}
            <AuthWebView />
          </>
        ) : null}
        {authState.refreshToken ? (
          <Button onPress={handleRefresh} text="Refresh" color="#24C2CB" />
        ) : null}
        {showRevoke ? (
          <Button onPress={handleRevoke} text="Revoke" color="#EF525B" />
        ) : null}
      </ButtonContainer>
    </Page>
  );
};

export default App;
