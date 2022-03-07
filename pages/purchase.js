import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import Web3Modal from 'web3modal';

import { birdyAddress } from '../config';
import Birdy from "../artifacts/contracts/Birdy.sol/Birdy.json";

export default function Home() {
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    loadBalance();
  }, []);

  async function loadBalance() {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const birdyContract = new ethers.Contract(birdyAddress, Birdy.abi, signer);
    const balance = await birdyContract.getUserBalance();
    setBalance(balance.toString());
  }

  async function buyToken() {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const birdyContract = new ethers.Contract(birdyAddress, Birdy.abi, signer);

    let price = await birdyContract.getTokenPrice();
    console.log(price);

    await birdyContract.buyToken(1, { value: price });
    console.log("bought token");
    loadBalance();
  }

  return (
    <div className="flex-1">
      <h1 className="text-xl">{balance}</h1>
      <button onClick={() => buyToken()}>Buy Token</button>
    </div>
  )
}
