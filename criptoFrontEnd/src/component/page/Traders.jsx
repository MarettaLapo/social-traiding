import { useState, useEffect } from "react";
import { ethers } from "ethers";
import CurrentPrice from "./CurrentPrice";
import accountManagerAbi from "../abi/AccountManager.json";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import { styled } from "@mui/material/styles";

function Traders() {
  const balanceETH = 100; //получить баланс эфириума ликвидити пула
  const balanceUSDC = 0.1; //получить баланс доллара ликвидити пула
  const [inputPay, setInputPay] = useState("");
  const [inputReceive, setInputReceive] = useState("");
  const [isTrader, setIsTrader] = useState(true);
  const [contract, setContract] = useState();

  const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: "#666666",
    ...theme.typography.body2,
    padding: theme.spacing(2),
    marginLeft: "40px",
    marginRight: "40px",
    textAlign: "center",
    fontSize: "20px",
    color: "white",
  }));

  useEffect(() => {
    async function load() {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const addressContract = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
      const contract = new ethers.Contract(
        addressContract,
        accountManagerAbi.abi,
        signer
      );
      setContract(contract);
      console.log(contract);
    }
    load();
  }, []);

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
    const tx = await contract.createAccount(24 * 60 * 60); //функция контракта
    setIsTrader(true);
  }

  async function seeLogs() {
    console.log("yaya");
    const events = await contract.queryFilter(contract.filters.LPCreated());
    console.log(events);
    events.forEach((event) => {
      const { lp, manager } = event.args;
      console.log("lp", lp);
      console.log("manager", manager);
    });
  }

  return (
    <div>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Item>
            <CurrentPrice></CurrentPrice>
          </Item>
        </Grid>
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
          <Grid item xs={12}>
            <div>Создайте свой трейдинг аккаунт</div>
            <button onClick={createLiqudityPool}>Создать ликвиди пул</button>
          </Grid>
        )}
      </Grid>
    </div>
  );
}

export default Traders;
