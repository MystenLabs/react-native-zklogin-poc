import {StatusBar} from 'expo-status-bar';
import {Button, StyleSheet, Text, View} from 'react-native';
import {useEffect} from "react";
import {doLogin, prepareLogin} from "./sui/zkLogin";
import {useSui} from "./sui/hooks/useSui";

export const cryp = require('crypto');

export default function App() {

    const {suiClient} = useSui();

    useEffect(() => {
        // console.log("Doing transactions")
        // doActions()r
    }, [])

    const zkLogin = () => {
        console.log("Loging in with zkLogin")
        prepareLogin(suiClient)
        doLogin(suiClient)
    }

    return (
        <View style={styles.container}>
            <Text>Click to login</Text>
            <Button
                onPress={zkLogin}
                title="zkLogin with Google"
                color="#841584"
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
