import {fromB64} from "@mysten/sui.js/utils";
import {SuiClient} from "@mysten/sui.js/client";
import {Ed25519Keypair} from '@mysten/sui.js/keypairs/ed25519';
import {generateNonce, generateRandomness} from '@mysten/zklogin';
// import EncryptedStorage from 'react-native-encrypted-storage';
import axios from "axios";
import jwt_decode from "jwt-decode"
import {ADMIN_SECRET_KEY, SUI_NETWORK,} from "./config";
import {toBigIntBE} from "bigint-buffer";

console.log("Connecting to SUI network: ", SUI_NETWORK);

//Admin-partner signer setup
let adminPrivateKeyArray = Uint8Array.from(Array.from(fromB64(ADMIN_SECRET_KEY!)));
const adminKeypair = Ed25519Keypair.fromSecretKey(adminPrivateKeyArray.slice(1));
const adminAddress = adminKeypair.getPublicKey().toSuiAddress();

export interface LoginResponse {
    iss: string;
    azp: string;
    aud: string;
    sub: string;
    nbf: number;
    exp: number;
    iat: number;
    jti: string;
    nonce: string;
};

export interface UserKeyData {
    randomness: string;
    nonce: string;
    ephemeralPublicKey: string;
    ephemeralPrivateKey: string;
    maxEpoch:number;
};

export const doLogin = async (suiClient: SuiClient) => {
    console.log("Starting sign up with zkLogin");
}

export const prepareLogin = async (suiClient: SuiClient) => {
    const {epoch, epochDurationMs, epochStartTimestampMs} = await suiClient.getLatestSuiSystemState();

    const maxEpoch = parseInt(epoch) + 2; // this means the ephemeral key will be active for 2 epochs from now.
    const ephemeralKeyPair = new Ed25519Keypair();
    const ephemeralPrivateKeyB64 = ephemeralKeyPair.export().privateKey;


    const ephemeralPublicKey = ephemeralKeyPair.getPublicKey();
    const ephemeralPublicKeyB64 = ephemeralPublicKey.toBase64();

    const jwt_randomness = generateRandomness();
    const nonce = generateNonce(ephemeralPublicKey, maxEpoch, jwt_randomness);

    // console.log("current epoch = " + epoch);
    // console.log("maxEpoch = " + maxEpoch);
    // console.log("jwt_randomness = " + jwt_randomness);
    // console.log("ephemeral public key = " + ephemeralPublicKey);
    // console.log("nonce = " + nonce);

    const userKeyData: UserKeyData = {
        randomness: jwt_randomness.toString(),
        nonce: nonce,
        ephemeralPublicKey: ephemeralPublicKeyB64,
        ephemeralPrivateKey: ephemeralPrivateKeyB64,
        maxEpoch: maxEpoch
    }

    // await setEncrypted(userKeyData)
    // const data = await getEncrypted()
    // console.log("Saved", userKeyData)
    return userKeyData
}

export async function getSaltFromMystenAPI(jwtEncoded : string ){
    const url = "https://salt.api.mystenlabs.com/get_salt";
    const payload = { token: jwtEncoded };

    const res = await axios.post(url, payload)
    return res.data.salt;
}

export async function getZNPFromMystenAPI(jwtToken: string, salt: string, userKeyData: UserKeyData){

    const url = "https://prover.mystenlabs.com/v1";
    const decodedJwt: LoginResponse = jwt_decode(jwtToken) as LoginResponse;
    const ephemeralKeyPairArray = Uint8Array.from(Array.from(fromB64(userKeyData.ephemeralPrivateKey!)));
    const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(ephemeralKeyPairArray);

    printUsefulInfo(decodedJwt, userKeyData);

    const ephemeralPublicKeyArray: Uint8Array = fromB64(userKeyData.ephemeralPublicKey);
    const zkpPayload =
            {
                jwt: jwtToken!,
                extendedEphemeralPublicKey: toBigIntBE(
                    Buffer.from(ephemeralPublicKeyArray),
                ).toString(),
                jwtRandomness: userKeyData.randomness,
                maxEpoch: userKeyData.maxEpoch,
                salt: salt,
                keyClaimName: "sub"
            };

    console.log("about to post zkpPayload = ", zkpPayload);
    // setPublicKey(zkpPayload.extendedEphemeralPublicKey);

    const res = await axios.post(url, zkpPayload)

    console.log("received payload with Request for ZKP = ", res);
    return res;
}

const printUsefulInfo = (decodedJwt: LoginResponse, userKeyData: UserKeyData) => {
        console.log("iat  = " + decodedJwt.iat);
        console.log("iss  = " + decodedJwt.iss);
        console.log("sub = " + decodedJwt.sub);
        console.log("aud = " + decodedJwt.aud);
        console.log("exp = " + decodedJwt.exp);
        console.log("nonce = " + decodedJwt.nonce);
        console.log("ephemeralPublicKey b64 =", userKeyData.ephemeralPublicKey);
}

// Use your existing means of storing encrypted data
// async function setEncrypted(data: any, key = "data") {
//     try {
//         await EncryptedStorage.setItem(
//             key,
//             JSON.stringify(data)
//         );
//     } catch (error) {
//         // There was an error on the native side
//     }
// }
//
// async function getEncrypted(key="data") {
//     try {
//         const dataString = await EncryptedStorage.getItem(key);
//
//         if (dataString !== undefined) {
//             this.resolve(JSON.parse(dataString))// Congrats! You've just retrieved your first value!
//         }
//     } catch (error) {
//         // There was an error on the native side
//     }
// }

