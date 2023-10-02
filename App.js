import {StatusBar} from 'expo-status-bar';
import {Button, StyleSheet, View} from 'react-native';
import {useEffect, useState} from "react";
import {prepareLogin} from "./sui/zkLogin";
import {useSui} from "./sui/hooks/useSui";
import {LoginWebView} from "./sui/webView";

export const cryp = require('crypto');

export default function App() {

    const {suiClient} = useSui();
    const [error, setError] = useState < string | null > (null);
    const [loginData, setLoginData] = useState < string | null > (null);
    const [loginUrl, setLoginUrl] = useState < string | null > ("");
    const [loginDone, setLoginDone] = useState < boolean > (false);
    const REDIRECT_URI = 'https://zklogin-dev-redirect.vercel.app/api/auth';

    useEffect(() => {
        // console.log("Doing transactions")
        // doActions()r
    }, [])


    const doZkLogin = async () => {

        setLoginDone(true);

        console.log("Starting sign up with zkLogin");
        prepareLogin(suiClient).then((userKeyData) => {

            const customRedirectUri = getRedirectUri();
            const params = new URLSearchParams({
                // When using the provided test client ID + redirect site, the redirect_uri needs to be provided in the state.
                state: new URLSearchParams({
                    redirect_uri: customRedirectUri
                }).toString(),
                // Test Client ID for devnet / testnet:
                client_id: '25769832374-famecqrhe2gkebt5fvqms2263046lj96.apps.googleusercontent.com',
                redirect_uri: REDIRECT_URI,
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
            {loginDone && (<LoginWebView source={REDIRECT_URI}/>)}
            <Button
                onPress={doZkLogin}
                title="zkLogin with Google"
                color="#000000"
                accessibilityLabel="zkLogin with Google"
            ></Button>
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
