import { useState, useEffect } from "react";
import { ethers } from "ethers";
import CurrentPrice from "./CurrentPrice";
import accountManagerAbi from "../abi/AccountManager.json";
import liquidityPoolAbi from "../abi/LiquidityPool.json";
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

//AccountManager deployed to: 0x0165878A594ca255338adfa4d48449f69242Eb8F
//USDC deployed to: 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9

function Traders() {
  const balanceETH = 100; //получить баланс эфириума ликвидити пула
  const balanceUSDC = 0.1; //получить баланс доллара ликвидити пула
  const [inputPay, setInputPay] = useState("");
  const [inputReceive, setInputReceive] = useState("");
  const [isTrader, setIsTrader] = useState(false);
  const [contractAccManager, setContractAccManager] = useState();
  const [contractLiqPool, setContractLiqPool] = useState();
  const [currentAccount, setCurrentAccount] = useState();
  const [addressLP, setAddressLP] = useState();
  const [showModal, setShowModal] = useState(false);
  const [fundTime, setFundTime] = useState(undefined);
  const [tradingTime, setTradingTime] = useState(undefined);
  const [payCurrency, setPayCurrency] = useState(undefined);
  const [receiveCurrency, setReceiveCurrency] = useState(undefined);

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
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const addressContract = "0x0165878A594ca255338adfa4d48449f69242Eb8F";
      const contract = new ethers.Contract(
        addressContract,
        accountManagerAbi.abi,
        signer
      );

      setContractAccManager(contract);
      const events = await contract.queryFilter(contract.filters.LPCreated());
      console.log(events);
      let need;
      events.forEach((event) => {
        const { lp, manager } = event.args;
        // if (manager === currentAccount) {
        //   console.log("yay");
        //   //setAddressLP(lp);
        // }
        need = lp;
        console.log("lp", lp);
        console.log("manager", manager);
      });
      const contractLP = new ethers.Contract(
        need,
        liquidityPoolAbi.abi,
        signer
      );
      console.log(contractLP);
      console.log(await contractLP.getCanTraiding());
      console.log(
        await contractLP.getOwnerTokenCount(
          "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
        )
      );

      // const contractUSDC = new ethers.Contract(
      //   "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
      //   usdcAbi.abi,
      //   signer
      // );
      // console.log(contractUSDC);
      // await contractUSDC.approve(need, 10);
      // await contractLP.provide(10);

      // console.log(contract);
    }
    if (!contractAccManager) {
      load();
    }
  }, []);

  useEffect(() => {
    async function acc() {
      if (!window.ethereum) {
        console.log("please install MetaMask");
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();

      setCurrentAccount(accounts[0].address);

      // if (checkIsTrader(contractAccManager)) {
      //   setIsTrader(true);
      // }

      console.log(accounts[0].address);
    }

    acc();
  }, []);

  const handlePay = (event) => {
    setInputPay(event.target.value);
  };

  const handleReceive = (event) => {
    setInputReceive(event.target.value);
  };

  const handleFundTime = (event) => {
    setFundTime(event.target.value);
  };

  const handleTradingTime = (event) => {
    setTradingTime(event.target.value);
  };
  const handleChangePayCurrency = (event) => {
    setPayCurrency(event.target.value);
  };

  const handleChangeReceiveCurrency = (event) => {
    setReceiveCurrency(event.target.value);
  };

  function handleClose() {
    setShowModal(false);
  }
  function handleOpen() {
    setShowModal(true);
  }

  async function swap(e) {
    e.preventDefault();
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    console.log(addressLP);
    const contract = new ethers.Contract(
      addressLP,
      liquidityPoolAbi.abi,
      signer
    );
    console.log(contract);
    setContractLiqPool(contract);
  }

  async function checkIsTrader(inputContract) {
    console.log("checkTrader");
    const events = await inputContract.queryFilter(
      inputContract.filters.LPCreated()
    );
    events.forEach((event) => {
      const { lp, manager } = event.args;
      if (manager === currentAccount) {
        console.log("yay");
        setAddressLP(lp);
        return true;
      }
      console.log("lp", lp);
      console.log("manager", manager);
    });
    return false;
  }

  //TODO: обработать отказ от создания.
  async function createLiqudityPool(e) {
    e.preventDefault();
    setShowModal(false);
    await contractAccManager.createAccount(
      fundTime * 60 * 60,
      tradingTime * 60 * 60
    );
    if (checkIsTrader(contractAccManager)) {
      setIsTrader(true);
    }
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
                              <div>Balance: {balanceETH}</div>
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
                                placeholder="30"
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
                              <div>Balance: {balanceUSDC}</div>
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
                                onChange={handleReceive}
                                placeholder="30"
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
                                value={receiveCurrency}
                                onChange={handleChangeReceiveCurrency}
                              >
                                <option value={"USDC"}>USDC</option>
                                <option value={"ETH"}>ETH</option>
                              </select>
                            </div>
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

              <Grid item xs={12}>
                <div>
                  <div>Portfolio</div>
                  <div className="ETH"></div>
                  <div className="USDC"></div>
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
