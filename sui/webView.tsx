import React, {FunctionComponent} from 'react';
import {WebView, WebViewNavigation} from 'react-native-webview';

const onNavigationStateChange = (navigationState: WebViewNavigation) => {
    const url2 = navigationState.url;

    // parseURLParams is a pseudo function.
    // Make sure to write your own function or install a package
    // const params = parseURLParams(url);

    const url = "http://example.com?myVar=test&otherVariable=someData&number=123"

    var regex = /[?&]([^=#]+)=([^&#]*)/g,
        params: any = {},
        match;
    while (match = regex.exec(url)) {
        params[match[1]] = match[2];
    }
    console.log(params)

    if (params.token) {
        // Save token for native requests & move to the next screen
    }
};

export const LoginWebView: FunctionComponent = (source: string) => (
    <WebView
        source={{uri: source}}
        onNavigationStateChange={onNavigationStateChange}
    />
);