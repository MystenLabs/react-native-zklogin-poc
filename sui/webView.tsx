import React, {useState} from 'react';
import { View, Text, Button, Modal, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

export const AuthWebView = (props: any) => {
  const [visible, setVisible] = useState(true)

  return (
      <>
        <Button title="Login with zkLogin" onPress={() => setVisible(true)} />
        <Modal visible={visible} onDismiss={() => setVisible(false)}>
          <View style={{ minHeight: 900 }}>
            <WebView
              source={{ uri: 'https://poc-zklogin.vercel.app/' }}
              originWhitelist={['*']}
              scrollEnabled={false}
              startInLoadingState={true}
              renderLoading={() => <Text>Loading Google</Text>}
            />
            <Button title="Close" onPress={() => setVisible(false)} />
          </View>
        </Modal>
      </>
  )
};

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
    alignItems: 'center',
  },
})