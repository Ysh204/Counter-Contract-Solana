

import  {expect, test} from "bun:test";
import {Keypair, Connection,LAMPORTS_PER_SOL,SystemProgram,PublicKey,Transaction,TransactionInstruction} from "@solana/web3.js";
import {COUNTER_ACCOUNT_SIZE} from "./types";
import * as borsh from "borsh";
import {schema, CounterAccount} from "./types";

const PROGRAM_ID = new PublicKey("4V4oP21NenNzSy9UK35jYmF3cbAzQuPTkKwn9z9E9CSg");

let adminAccount = Keypair.generate();
let dataAccount = Keypair.generate();
console.log("Admin Account: ", adminAccount.publicKey.toBase58());
console.log("Data Account: ", dataAccount.publicKey.toBase58());

test("Account is initialized",async () => {
  const connection = new Connection("http://localhost:8899", "confirmed");
  const data = await connection.getAccountInfo(adminAccount.publicKey);
  const txn =await connection.requestAirdrop(adminAccount.publicKey, 1*LAMPORTS_PER_SOL);
  await connection.confirmTransaction(txn);
  const data2 = await connection.getAccountInfo(adminAccount.publicKey);
  const lamports = await connection.getMinimumBalanceForRentExemption(COUNTER_ACCOUNT_SIZE);

  const ix = SystemProgram.createAccount({
    fromPubkey: adminAccount.publicKey,
    newAccountPubkey: dataAccount.publicKey,
    lamports,
    space: COUNTER_ACCOUNT_SIZE,
    programId: PROGRAM_ID
  })

  const txn2 = new Transaction().add(ix);
  const signature = await connection.sendTransaction(txn2, [adminAccount, dataAccount]);
  await connection.confirmTransaction(signature);

  const data3 = await connection.getAccountInfo(dataAccount.publicKey);
  console.log("Data Account Lamports: ", data3?.lamports);
  console.log(dataAccount.publicKey.toBase58());

  const dataAccountInfo = await connection.getAccountInfo(dataAccount.publicKey);
  const counter = borsh.deserialize(schema, dataAccountInfo?.data as Buffer);
  console.log("Count: ", counter.count);

}
)

test("Increment counter", async () => {

  const connection = new Connection("http://localhost:8899", "confirmed");

  const info = await connection.getAccountInfo(dataAccount.publicKey);

  const counter = borsh.deserialize(schema, info!.data);

  console.log("Before increment:", counter.count);

  const instructionData = Buffer.from([0,1,0,0,0]); 
  // Increment(1)

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      {
        pubkey: dataAccount.publicKey,
        isSigner: false,
        isWritable: true,
      },
    ],
    data: instructionData,
  });

  const txn = new Transaction().add(ix);

  const sig = await connection.sendTransaction(txn, [adminAccount]);
  await connection.confirmTransaction(sig);

  const updatedInfo = await connection.getAccountInfo(dataAccount.publicKey);

  const updatedCounter = borsh.deserialize(schema, updatedInfo!.data);

  console.log("After increment:", updatedCounter.count);

  expect(updatedCounter.count).toBe(counter.count + 1);
});