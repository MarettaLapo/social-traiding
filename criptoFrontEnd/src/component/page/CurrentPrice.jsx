import React from "react";
import { useEffect, useState } from "react";
import { ethers } from "ethers";

//дописать получение стоимости эфира
import * as addresses from "../utils/addresses";
import traidingAccountAbi from "../abi/TraidingAccount.json";

const price = 2000;
const CurrentPrice = () => {
  const [currencyValue, setCurrencyValue] = useState();
  useEffect(() => {
    async function load() {
      if (!window.ethereum) {
        console.log("please install MetaMask");
        return;
      }

      let address;
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const accounts = await provider.listAccounts();
        address = accounts[0].address;
        const contract = new ethers.Contract(
          addresses.TRADING_ACCOUNT_ADDRESS,
          traidingAccountAbi.abi,
          signer
        );

        let curr = await contract.currency();
        setCurrencyValue(Number(curr));
      } catch (e) {
        console.log(e);
      }
    }
    load();
  }, []);
  return <div>Current price: {currencyValue}</div>;
};
export default CurrentPrice;
