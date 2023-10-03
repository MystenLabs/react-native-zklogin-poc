import {Ed25519Keypair,} from "@mysten/sui.js/dist/cjs/keypairs/ed25519";
import {fromB64} from "@mysten/sui.js/dist/cjs/utils";
import {TransactionBlock} from "@mysten/sui.js/dist/cjs/builder";
import {SuiClient} from "@mysten/sui.js/client";

import {ADMIN_SECRET_KEY, PACKAGE_ADDRESS, PRICE_ADMIN_CAP_ID, PRICE_ORACLE_ID, SUI_NETWORK,} from "./config";

console.log("Connecting to SUI network: ", SUI_NETWORK);

//Admin-partner signer setup
let adminPrivateKeyArray = Uint8Array.from(Array.from(fromB64(ADMIN_SECRET_KEY!)));
const adminKeypair = Ed25519Keypair.fromSecretKey(adminPrivateKeyArray.slice(1));
const adminAddress = adminKeypair.getPublicKey().toSuiAddress();

console.log("Price Admin address: ", adminAddress);

const client = new SuiClient({
    url: SUI_NETWORK,
});

export const doActions = async () => {

    const txb: any = new TransactionBlock();

    const now: number = Date.now();

    console.log("Updating price at: ", now);
    txb.moveCall({
        target: `${PACKAGE_ADDRESS}::price_oracle::publish_price`,
        arguments: [
            txb.object(PRICE_ADMIN_CAP_ID!),
            txb.object(PRICE_ORACLE_ID!),
            txb.pure(now),
            txb.pure("EURUSD"),
            txb.pure(["publisher", "r", "s", "v"]),
            txb.pure(["publisher-1", "rrr" + now, "ssssss" + now, "vvv" + now]),
        ],
    });

    txb.setGasBudget(1000000000);
    let time = Date.now();
    let txRes =
        await client.signAndExecuteTransactionBlock({
            signer: adminKeypair,
            transactionBlock: txb,
            requestType: "WaitForLocalExecution",
            options: {
                showEffects: true, showObjectChanges: true,
            },
        });
    let dur = Date.now() - time;
    let status1 = txRes.effects?.status;
    if (status1?.status !== "success") {
        console.log("process failed. Status: ", status1);
        process.exit(1);
    }
    console.log("Process Finished. Status: ", status1);
    console.log("Duration = ", dur, " ms");
    console.log("Check Price at:");
    console.log(`https://suiexplorer.com/object/${PRICE_ORACLE_ID}?network=testnet`);
}

