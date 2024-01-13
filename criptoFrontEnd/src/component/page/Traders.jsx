import { useState, useEffect } from "react";
import { ethers } from "ethers";
import CurrentPrice from "./CurrentPrice";
import accountManagerAbi from "../abi/AccountManager.json";

function Traders() {
  const balanceETH = 100; //получить баланс эфириума ликвидити пула
  const balanceUSDC = 0.1; //получить баланс доллара ликвидити пула
  const [inputPay, setInputPay] = useState("");
  const [inputReceive, setInputReceive] = useState("");
  const [isTrader, setIsTrader] = useState(true);
  const [contract, setContract] = useState();

  // useEffect(() => {
  //   async function load() {
  //     const provider = new ethers.BrowserProvider(window.ethereum);
  //     const signer = await provider.getSigner()
  //     console.log(signer)

  //     const a = await provider.listAccounts();
  //     console.log(a[0])

  //     const addressContract = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  //     const erc20 = new ethers.Contract(addressContract, abi.abi, signer);
  //     console.log(erc20)

  //     setProvider(provider)
  //     setAccount(a[0]);
  //     setAccountAddress(a[0].address)
  //     setContract(erc20)
  //   }
  //   load();
  //   }, []);

  const handlePay = (event) => {
    setInputPay(event.target.value);
  };

  const handleReceive = (event) => {
    setInputReceive(event.target.value);
  };

  function swap() {
    //чо то с контрактом
  }

  //TODO: обработать отказ от создания.
  async function createLiqudityPool() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const addressContract = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const contract = new ethers.Contract(
      addressContract,
      accountManagerAbi.abi,
      signer
    );
    setContract(contract);

    console.log(contract);

    const tx = await contract.createAccount(24 * 60 * 60); //функция контракта

    await contract.on("LPCreated", (lp, manager, event) => {
      console.log("New Transfer event with the arguments:");
      console.log(lp, manager);
    });

    // const receipt = await tx.wait();
    console.log("filters", contract.filters);
  }

  async function seeLogs() {
    console.log("yaya");
    await contract.on("*", (event) => {
      console.log(event);
    });
  }

  return (
    <div className="App">
      <CurrentPrice></CurrentPrice>
      {!isTrader ? (
        <div>
          <div>
            <form onSubmit={swap}>
              <div className="pay">
                <div>You paid</div>
                <div>Balance: {balanceETH}</div>
                <input type="number" value={inputPay} onChange={handlePay} />
              </div>
              <div className="receive">
                <div>You paid</div>
                <div>Balance: {balanceUSDC}</div>
                <input
                  type="number"
                  value={inputReceive}
                  onChange={handleReceive}
                />
              </div>
              <div>
                <button type="submit">Swap</button>
              </div>
            </form>
          </div>
          <div>
            <div>Portfolio</div>
            <div className="ETH"></div>
            <div className="USDC"></div>
          </div>
        </div>
      ) : (
        <div>
          <div>Надо регнуть</div>
          <button onClick={createLiqudityPool}>Создать ликвиди пул</button>
          <button onClick={seeLogs}>Логи контракта</button>
        </div>
      )}
    </div>
  );
}

export default Traders;
