import 'fast-text-encoding';
import 'react-native-url-polyfill/auto';
import './sui/env'

import {StatusBar} from 'expo-status-bar';
import {Button, StyleSheet, Text, View} from 'react-native';
import {useEffect, useState} from "react";
import {doLogin, prepareLogin} from "./sui/zkLogin";
import {useSui} from "./sui/hooks/useSui";
import {LoginWebView} from "./sui/webView";
export default function App() {

    const {suiClient} = useSui();
    const [error, setError] = useState("");
    const [loginData, setLoginData] = useState("");
    const [loginUrl, setLoginUrl] = useState("");
    const [loginDone, setLoginDone] = useState(false);
    const redirectUri = 'https://zklogin-dev-redirect.vercel.app/api/auth';

    useEffect(() => {
        // console.log("Doing transactions")
        // doActions()r
    }, [])


    const doZkLogin = async () => {

        setLoginDone(true);

        console.log("Starting sign up with zkLogin");
        prepareLogin(suiClient).then((userKeyData) => {

            const customRedirectUri = redirectUri; //getRedirectUri();
            const params = new URLSearchParams({
                // When using the provided test client ID + redirect site, the redirect_uri needs to be provided in the state.
                state: new URLSearchParams({
                    redirect_uri: customRedirectUri

                }).toString(),
                // Test Client ID for devnet / testnet:
                client_id: '70599191792-e7cuqm6pldc8ffp3hg9ie84n4d8u0stm.apps.googleusercontent.com',
                redirect_uri: redirectUri,
                response_type: 'id_token',
                scope: 'openid',
                nonce: userKeyData.nonce,
            });
            setLoginUrl(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
        });
    }

    const getRedirectUri = () => {
        const protocol = window.location.protocol;
        const host = window.location.host;
        const customRedirectUri = protocol + "//" + host + "/auth";
        console.log("customRedirectUri = " + customRedirectUri);
        return customRedirectUri;
    }

    return (
        <View style={styles.container}>
            {loginDone && (<LoginWebView source={redirectUri}/>)}
            {!loginDone && (<Button
                onPress={doZkLogin}
                title="zkLogin with Google"
                color="#000000"
                style={{border: "1px solid"}}
                accessibilityLabel="zkLogin with Google"
            ></Button>)}
            <StatusBar style="auto"/>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
