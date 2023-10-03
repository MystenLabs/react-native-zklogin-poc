import {fromB64} from "@mysten/sui.js/utils";
import {SuiClient} from "@mysten/sui.js/client";
import {UserKeyData} from "./types/UserInfo";
import {Ed25519Keypair} from '@mysten/sui.js/keypairs/ed25519';
import {generateNonce, generateRandomness} from '@mysten/zklogin';

// import './shim.js'
import {ADMIN_SECRET_KEY, SUI_NETWORK,} from "./config";

console.log("Connecting to SUI network: ", SUI_NETWORK);

//Admin-partner signer setup
let adminPrivateKeyArray = Uint8Array.from(Array.from(fromB64(ADMIN_SECRET_KEY!)));
const adminKeypair = Ed25519Keypair.fromSecretKey(adminPrivateKeyArray.slice(1));
const adminAddress = adminKeypair.getPublicKey().toSuiAddress();


export const doLogin = async (suiClient: SuiClient) => {
    console.log("Starting sign up with zkLogin");
}

export const prepareLogin = async (suiClient: SuiClient) => {
    const {epoch, epochDurationMs, epochStartTimestampMs} = await suiClient.getLatestSuiSystemState();

    const maxEpoch = parseInt(epoch) + 2; // this means the ephemeral key will be active for 2 epochs from now.
    const ephemeralKeyPair = new Ed25519Keypair();
    const ephemeralPrivateKeyB64 = ephemeralKeyPair.export().privateKey;


    const ephemeralPublicKey = ephemeralKeyPair.getPublicKey()
    const ephemeralPublicKeyB64 = ephemeralPublicKey.toBase64();

    const jwt_randomness = generateRandomness();
    const nonce = generateNonce(ephemeralPublicKey, maxEpoch, jwt_randomness);

    console.log("current epoch = " + epoch);
    console.log("maxEpoch = " + maxEpoch);
    console.log("jwt_randomness = " + jwt_randomness);
    console.log("ephemeral public key = " + ephemeralPublicKey);
    console.log("nonce = " + nonce);

    const userKeyData: UserKeyData = {
        randomness: jwt_randomness.toString(),
        nonce: nonce,
        ephemeralPublicKey: ephemeralPublicKeyB64,
        ephemeralPrivateKey: ephemeralPrivateKeyB64,
        maxEpoch: maxEpoch
    }
    // RN apps should use async storage.
    // localStorage.setItem("userKeyData", JSON.stringify(userKeyData));
    return userKeyData
}

