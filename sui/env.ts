import 'fast-text-encoding';
import 'react-native-url-polyfill/auto';
import { Buffer } from '@craftzdog/react-native-buffer';
import * as Crypto from "expo-crypto";
import { decode, encode } from "base-64";

if (!globalThis.Buffer) {
  // @ts-ignore
  globalThis.Buffer = Buffer;
}

if (!globalThis.crypto) {
  // @ts-ignore
  globalThis.crypto = Crypto;
}

if (!globalThis.btoa) {
  globalThis.btoa = encode;
}

if (!globalThis.atob) {
  globalThis.atob = decode;
}
