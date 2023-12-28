
import './App.css';
import {useState, useEffect} from 'react';
import { ethers } from "ethers";
//import {abi} from "./managerAbi"
import abi from "./abi.json"
import {CurrentPrice} from "./CurrentPrice"

function App() {
  //DeployAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  const[accountAddress, setAccountAddress] = useState();
  const[account, setAccount] = useState();
  const[contract, setContract] = useState();
  const[provider, setProvider] = useState();

  useEffect(() => {
    async function load() {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner()
      console.log(signer)

      const a = await provider.listAccounts();
      console.log(a[0])

      const addressContract = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
      const erc20 = new ethers.Contract(addressContract, abi.abi, signer);
      console.log(erc20)

      setProvider(provider)
      setAccount(a[0]);
      setAccountAddress(a[0].address)
      setContract(erc20)
    }
    load();
    }, []);

    async function createAcc(e){
      e.preventDefault();
      console.log("ayaya")
      // await contract.on("LPCreated", (lp, accountAddress) => {
      //   console.log("New Transfer event with the arguments:")
      //   console.log(lp, accountAddress)
      // })
      console.log(contract)
      const tx = await contract.createAccount(24*60*60);
      const receipt = await tx.wait()
      console.log("filters", contract.filters)
    }

  //render function
    return(
      <div className="App">
          <div>
            <CurrentPrice></CurrentPrice>
            Your acc: {accountAddress}
          </div>
          <button onClick={createAcc} >создать акк</button>
      </div>
    )  


}

export default App;
