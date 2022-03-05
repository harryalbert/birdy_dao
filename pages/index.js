import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Web3Modal from 'web3modal';

import { birdyAddress } from '../config';
import Birdy from "../artifacts/contracts/Birdy.sol/Birdy.json";

export default function Home() {
  const [balance, setBalance] = useState(0);
  const [loadingState, setLoadingState] = useState(true);
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

  return (
    <div className="flex">
      <h1 className="text-xl">{balance}</h1>
      <button></button>
    </div>
  )
}
