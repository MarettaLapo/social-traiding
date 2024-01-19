import { useState, useEffect } from "react";
import { ethers } from "ethers";
import CurrentPrice from "./CurrentPrice";
import * as addresses from "../utils/addresses";
import accountManagerAbi from "../abi/AccountManager.json";
import liquidityPoolAbi from "../abi/LiquidityPool.json";
import traidingAccountAbi from "../abi/TraidingAccount.json";
import usdcAbi from "../abi/USDC.json";

import { styled } from "@mui/material/styles";
import Modal from "react-bootstrap/Modal";
import {
  Button,
  FormControl,
  FormLabel,
  Grid,
  TextField,
  Paper,
  InputAdornment,
  Select,
  MenuItem,
} from "@mui/material";

function Traders() {
  const [balanceETH, setBalanceETH] = useState(""); //получить баланс эфириума ликвидити пула
  const [balanceUSDC, setBalanceUSDC] = useState(""); //получить баланс доллара ликвидити пула
  const [inputPay, setInputPay] = useState("");
  const [inputReceive, setInputReceive] = useState("");
  const [isTrader, setIsTrader] = useState(false);
  const [contractAccManager, setContractAccManager] = useState();
  const [contractLiqPool, setContractLiqPool] = useState();
  const [currentAccount, setCurrentAccount] = useState();
  const [currencyUSDCtoETH, setCurrencyUSDCtoETH] = useState();
  const [showModal, setShowModal] = useState(false);
  const [fundTime, setFundTime] = useState(undefined);
  const [tradingTime, setTradingTime] = useState(undefined);
  const [payCurrency, setPayCurrency] = useState("USDC");
  const [receiveCurrency, setReceiveCurrency] = useState("ETH");
  const [swapAvailable, setSwapAvailable] = useState(false);
  const [isTradingTime, setIsTradingTime] = useState(false);
  const [isTimeForClose, setIsTimeForClose] = useState(false);

  //добавить проверку на то что акк закрылся
  const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: "#666666",
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: "center",
    fontSize: "20px",
    color: "white",
  }));

  useEffect(() => {
    async function load() {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const accounts = await provider.listAccounts();

        setCurrentAccount(accounts[0].address);

        const contract = new ethers.Contract(
          addresses.ACCOUNT_MANAGER_ADDRESS,
          accountManagerAbi.abi,
          signer
        );
        console.log(contract);

        setContractAccManager(contract);

        let answer = await checkIsTrader(contract, accounts[0].address);
        console.log("mda", answer);
        if (answer) {
          setIsTrader(true);
        }
      } catch (e) {
        console.log(e);
      }
    }
    load();
  }, []);

  const handlePay = (event) => {
    setInputPay(event.target.value);
    console.log(payCurrency);
    if (payCurrency === "USDC") {
      setInputReceive(event.target.value / currencyUSDCtoETH);
    } else {
      setInputReceive(event.target.value * currencyUSDCtoETH);
    }
  };

  const handleFundTime = (event) => {
    setFundTime(event.target.value);
  };

  const handleTradingTime = (event) => {
    setTradingTime(event.target.value);
  };
  const handleChangePayCurrency = (event) => {
    setPayCurrency(event.target.value);
    if (event.target.value === "USDC") {
      setInputReceive(inputPay / currencyUSDCtoETH);
      setReceiveCurrency("ETH");
    } else {
      setInputReceive(inputPay * currencyUSDCtoETH);
      setReceiveCurrency("USDC");
    }
  };

  function handleClose() {
    setShowModal(false);
  }
  function handleOpen() {
    setShowModal(true);
  }

  async function swap(e) {
    e.preventDefault();
    console.log(payCurrency);
    console.log(inputPay);
    if (payCurrency === "USDC") {
      let tx = await contractLiqPool.swapUSDCtoETH(inputPay);
      await tx.wait();
    } else {
      let tx = await contractLiqPool.swapETHtoUSDC(inputPay);
      await tx.wait();
    }
  }

  async function checkIsTrader(inputContract, account) {
    console.log("checkTrader");

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const events = await inputContract.queryFilter(
      inputContract.filters.LPCreated()
    );
    console.log(events);

    let lpAddress = undefined;

    events.some(function (event) {
      const { lp, manager } = event.args;
      if (manager === account) {
        lpAddress = lp;
        return true;
      }
    });

    if (lpAddress !== undefined) {
      const contractLP = new ethers.Contract(
        lpAddress,
        liquidityPoolAbi.abi,
        signer
      );

      const contractTradingAcc = new ethers.Contract(
        addresses.TRADING_ACCOUNT_ADDRESS,
        traidingAccountAbi.abi,
        provider
      );

      let currency = await contractTradingAcc.currency();
      setCurrencyUSDCtoETH(Number(currency));

      let balanceETHLP = await provider.getBalance(lpAddress);
      setBalanceETH(Number(balanceETHLP));

      let balanceUSDCLP = await contractLP.balance();
      setBalanceUSDC(Number(balanceUSDCLP));

      // setBalanceETH();

      console.log("ono", contractTradingAcc);
      let dateNow = Date.now();

      let fundrisingStopTime = Number(await contractLP.fundrisingStopTime());
      let timeStopFund = new Date(fundrisingStopTime * 1000).getTime();

      let timeForStopTraiding = Number(await contractLP.timeForStopTraiding());
      let timeStopTrading = new Date(timeForStopTraiding * 1000).getTime();

      let canTrade = await contractLP.canTraiding();

      if (dateNow > timeStopTrading) {
        if (canTrade) {
          setIsTimeForClose(true);
        }
      } else {
        if (dateNow > timeStopFund) {
          setIsTradingTime(true);
        }
      }
      setContractLiqPool(contractLP);

      console.log("выдано функцией", lpAddress);

      return true;
    } else {
      return false;
    }
  }

  //TODO: обработать отказ от создания.
  async function createLiqudityPool(e) {
    e.preventDefault();
    await contractAccManager.createAccount(fundTime * 60, tradingTime * 60);
    let answer = await checkIsTrader(contractAccManager, currentAccount);
    console.log("mda", answer);
    if (answer) {
      setIsTrader(true);
    }
    setShowModal(false);
  }

  async function startTrading() {
    await contractLiqPool.startTraiding();
    setIsTradingTime(false);
    setSwapAvailable(true);
  }

  async function closeTrading() {
    let tx = await contractLiqPool.closeTraiding();
    await tx.wait();
    setIsTimeForClose(false);
    setSwapAvailable(false);
  }

  return (
    <div className="container">
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Item>
            <CurrentPrice></CurrentPrice>
          </Item>
        </Grid>
        {isTrader ? (
          <Grid item xs={12}>
            <Grid container spacing={4}>
              {isTradingTime && (
                <Grid item xs={12}>
                  <Button
                    onClick={startTrading}
                    variant="contained"
                    color="primary"
                  >
                    Начать фазу торговли
                  </Button>
                </Grid>
              )}
              {isTimeForClose && (
                <Grid item xs={12}>
                  <Button
                    onClick={closeTrading}
                    variant="contained"
                    color="primary"
                  >
                    Закончить торговать
                  </Button>
                </Grid>
              )}
              {swapAvailable && (
                <Grid item xs={12}>
                  <div className="container-sm">
                    <div className="row justify-content-md-center">
                      <div className="col-md-5 bg-light">
                        <form className="p-3" onSubmit={swap}>
                          <div className="fs-2">Swap</div>
                          {/* d */}
                          <div className="container mt-3 border border-3 pt-3 pb-3">
                            <div className="row">
                              <div className="col-6">
                                <div>You pay</div>
                              </div>
                              <div className="col text-end">
                                <div>
                                  Balance:{" "}
                                  {payCurrency === "USDC"
                                    ? balanceUSDC
                                    : balanceETH}
                                </div>
                              </div>
                            </div>

                            <div className="row">
                              <div className="col-9">
                                <input
                                  type="number"
                                  id="standard-basic"
                                  variant="standard"
                                  className="form-control"
                                  name="fundTime"
                                  value={inputPay}
                                  onChange={handlePay}
                                  // placeholder="30"
                                  // error={telephoneError}
                                  // helperText={telephoneText}
                                  required
                                />
                              </div>
                              <div className="col">
                                <select
                                  className="form-select"
                                  labelid="demo-simple-select-label"
                                  id="demo-simple-select"
                                  value={payCurrency}
                                  onChange={handleChangePayCurrency}
                                >
                                  <option value={"USDC"}>USDC</option>
                                  <option value={"ETH"}>ETH</option>
                                </select>
                              </div>
                            </div>
                          </div>
                          {/* d */}
                          <div className="container mt-3 pt-3 border pb-3 border-3">
                            <div className="row">
                              <div className="col">
                                <div>You receive</div>
                              </div>
                              <div className="col text-end">
                                <div>
                                  Balance:{" "}
                                  {receiveCurrency === "USDC"
                                    ? balanceUSDC
                                    : balanceETH}
                                </div>
                              </div>
                            </div>

                            <div className="row">
                              <div className="col-9">
                                <input
                                  type="number"
                                  id="standard-basic"
                                  variant="standard"
                                  className="form-control"
                                  name="fundTime"
                                  value={inputReceive}
                                  disabled
                                  readOnly
                                  // placeholder="30"
                                  // error={telephoneError}
                                  // helperText={telephoneText}
                                  required
                                />
                              </div>
                              <div className="col">{receiveCurrency}</div>
                              {/* <div className="col">
                                <select
                                  className="form-select"
                                  labelid="demo-simple-select-label"
                                  id="demo-simple-select"
                                  value={receiveCurrency}
                                >
                                  <option value={"USDC"}>USDC</option>
                                  <option value={"ETH"}>ETH</option>
                                </select>
                              </div> */}
                            </div>
                          </div>
                          <div className="mt-5 pb-3">
                            <Button
                              className="w-100 "
                              variant="contained"
                              type="submit"
                            >
                              Swap
                            </Button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </Grid>
              )}
              <Grid item xs={12}>
                <div>
                  <div>Portfolio</div>
                  <div className="ETH">Количество эфира: {balanceETH}</div>
                  <div className="USDC">Количество долларов: {balanceUSDC}</div>
                </div>
              </Grid>
            </Grid>
          </Grid>
        ) : (
          <Grid item xs={12}>
            <div className="text-center fs-4">
              Создайте свой трейдинг аккаунт
            </div>
            <div className="text-center mt-3">
              <Button variant="contained" onClick={handleOpen}>
                Создать
              </Button>
            </div>
          </Grid>
        )}
      </Grid>
      <Modal show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Создание трейдинг аккаунта</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={createLiqudityPool} className="ms-5">
            <div className="mt-3 ms-5">
              <FormControl>
                <FormLabel htmlFor="count">Введите время для взноса</FormLabel>
                <TextField
                  type="number"
                  id="standard-basic"
                  variant="standard"
                  name="fundTime"
                  value={fundTime}
                  onChange={handleFundTime}
                  placeholder="30"
                  // error={telephoneError}
                  className="form-control"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">дней</InputAdornment>
                    ),
                  }}
                  // helperText={telephoneText}
                  required
                />
              </FormControl>
            </div>
            <div className="mt-4 ms-5">
              <FormControl>
                <FormLabel htmlFor="count">
                  Введите время для трейдинга
                </FormLabel>
                <TextField
                  type="number"
                  id="standard-basic"
                  variant="standard"
                  name="tradingTime"
                  placeholder="24"
                  value={tradingTime}
                  onChange={handleTradingTime}
                  // error={fioError}
                  className="form-control"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">дней</InputAdornment>
                    ),
                  }}
                  // helperText={fioText}
                  required
                />
              </FormControl>
            </div>
            <div className="mt-5 text-center mb-4">
              <Button type="submit" variant="contained" color="primary">
                Создать аккаунт
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default Traders;
