import {fromB64} from "@mysten/sui.js/utils";
import {SuiClient} from "@mysten/sui.js/client";
import {Ed25519Keypair} from '@mysten/sui.js/keypairs/ed25519';
import {generateNonce, generateRandomness, genAddressSeed, getZkLoginSignature, jwtToAddress} from '@mysten/zklogin';
// import EncryptedStorage from 'react-native-encrypted-storage';
import axios from "axios";
import jwt_decode from "jwt-decode"
import {ADMIN_SECRET_KEY, SUI_NETWORK,} from "./config";
import {toBigIntBE} from "bigint-buffer";
import {Keypair, PublicKey} from "@mysten/sui.js/cryptography";
import { ZkLoginSignatureInputs} from "@mysten/sui.js/dist/cjs/zklogin/bcs";
import {TransactionBlock} from '@mysten/sui.js/transactions';
import {SerializedSignature} from "@mysten/sui.js/cryptography";
import {Alert} from 'react-native';

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
    maxEpoch: number;
};

export const doLogin = async (suiClient: SuiClient) => {
    console.log("Starting sign up with zkLogin");
}

export const prepareLogin = async (suiClient: SuiClient) => {
    const {epoch, epochDurationMs, epochStartTimestampMs} = await suiClient.getLatestSuiSystemState();

    const maxEpoch = parseInt(epoch) + 2; // this means the ephemeral key will be active for 2 epochs from now.
    const ephemeralKeyPair : Keypair = new Ed25519Keypair();
    const ephemeralPrivateKeyB64 = ephemeralKeyPair.export().privateKey;

    const ephemeralPublicKey : PublicKey = ephemeralKeyPair.getPublicKey();
    const ephemeralPublicKeyB64 = ephemeralPublicKey.toBase64();

    const jwt_randomness = generateRandomness();
    // @ts-ignore
    const nonce = generateNonce(ephemeralPublicKey, maxEpoch, jwt_randomness);

    // console.log("current epoch = " + epoch);
    // console.log("maxEpoch = " + maxEpoch);
    // console.log("jwt_randomness generating nonce = ", jwt_randomness);
    // console.log("ephemeral public key = " + ephemeralPublicKeyB64);
    // console.log("generated nonce = " + nonce);

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

export async function getSaltFromMystenAPI(jwtEncoded: string){
    const url = "https://salt.api.mystenlabs.com/get_salt";
    // const decodedJwt: LoginResponse = jwt_decode(jwtEncoded) as LoginResponse;
    // console.log("decodedJwt:", decodedJwt);

    const payload = { token: jwtEncoded };

    // console.log("Getting salt:", payload, "decoded:", decodedJwt)
    const res = await axios.post(url, payload)
    return res.data.salt;
}

export async function getZNPFromMystenAPI(jwtToken: string, salt: string, userKeyData: UserKeyData){

    const url = "https://prover.mystenlabs.com/v1";
    const decodedJwt: LoginResponse = jwt_decode(jwtToken) as LoginResponse;
    // const ephemeralPrivateKeyArray = Uint8Array.from(Array.from(fromB64(userKeyData.ephemeralPrivateKey!)));
    // const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(ephemeralPrivateKeyArray);

    printUsefulInfo(decodedJwt, userKeyData);

    const ephemeralPublicKeyArray: Uint8Array = fromB64(userKeyData.ephemeralPublicKey);

    // const uint8ArrayToBigInt = (bytes: Uint8Array): BigInt => {
    //     const hex = "0x" + Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("");
    //     return BigInt(hex);
    // }

    const zkpPayload =
            {
                jwt: jwtToken,
                extendedEphemeralPublicKey: toBigIntBE(
                    Buffer.from(ephemeralPublicKeyArray),
                ).toString(),
                jwtRandomness: userKeyData.randomness,
                maxEpoch: userKeyData.maxEpoch,
                salt: salt,
                keyClaimName: "sub"
            };

    // console.log("about to post zkpPayload = ", zkpPayload);

    const res = await axios.post(url, zkpPayload)

    return res;
}

export async function executeTransactionWithZKP(jwtToken: string, zkp: any, userKeyData: UserKeyData, salt: string, suiClient: SuiClient) {

        const decodedJwt: LoginResponse = jwt_decode(jwtToken) as LoginResponse;
        const {ephemeralKeyPair} = getEphemeralKeyPair(userKeyData);
        const zkProof: ZkLoginSignatureInputs = zkp.data.zkp;
        const userAddress = jwtToAddress(jwtToken, BigInt(salt));
        const partialZkSignature = zkProof;
        let transactionData:any = {};

        if (!partialZkSignature || !ephemeralKeyPair || !userKeyData || !zkProof) {
            Alert.alert("Transaction cannot proceed. Missing critical data.");
            return;
        }
        console.log("zkProof", zkProof);

        const txb = new TransactionBlock();

        //Just a simple Demo call to create a little NFT weapon :p
        txb.moveCall({
            target: `0xf8294cd69d69d867c5a187a60e7095711ba237fad6718ea371bf4fbafbc5bb4b::teotest::create_weapon`,  //demo package published on testnet
            arguments: [
                txb.pure("Zero Knowledge Proof Axe 9000"),  // weapon name
                txb.pure(66),  // weapon damage
            ],
        });
        txb.setSender(userAddress!);

        const signatureWithBytes = await txb.sign({client: suiClient, signer: ephemeralKeyPair});

        console.log("Got SignatureWithBytes = ", signatureWithBytes);
        console.log("maxEpoch = ", userKeyData.maxEpoch);
        console.log("userSignature = ", signatureWithBytes.signature);

        const addressSeed = genAddressSeed(BigInt(salt), "sub", decodedJwt.sub, decodedJwt.aud);

        const zkSignature: SerializedSignature = getZkLoginSignature({
            inputs: {
                ...partialZkSignature,
                addressSeed: addressSeed.toString(),
            },
            maxEpoch: userKeyData.maxEpoch,
            userSignature: signatureWithBytes.signature,
        });

        suiClient.executeTransactionBlock({
            transactionBlock: signatureWithBytes.bytes,
            signature: zkSignature,
            options: {
                showEffects: true
            }
        }).then((response) => {
            if (response.effects?.status.status == "success") {
                console.log("Transaction executed! Digest = ", response.digest);
                transactionData.txDigest(response.digest);
            } else {
                console.log("Transaction failed! reason = ", response.effects?.status)
            }
        }).catch((error) => {
            console.log("Error During Tx Execution. Details: ", error);
            if(error.toString().includes("Signature is not valid")){
                Alert.alert("Signature is not valid. Please generate a new one by clicking on 'Get new ZK Proof'");
            }
        });
        return transactionData;
}

function getEphemeralKeyPair(userKeyData: UserKeyData) {
        let ephemeralKeyPairArray = Uint8Array.from(Array.from(fromB64(userKeyData.ephemeralPrivateKey!)));
        const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(ephemeralKeyPairArray);
        return {ephemeralKeyPair};
}


const printUsefulInfo = (decodedJwt: LoginResponse, userKeyData: UserKeyData) => {
        console.log("iat  = " + decodedJwt.iat);
        console.log("iss  = " + decodedJwt.iss);
        console.log("sub = " + decodedJwt.sub);
        console.log("aud = " + decodedJwt.aud);
        console.log("exp = " + decodedJwt.exp);
        console.log("nonce = " + decodedJwt.nonce);
        console.log("ephemeralPublicKey b64 =", userKeyData.ephemeralPublicKey);
        console.log("jwtRandomness =", userKeyData.randomness);
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

