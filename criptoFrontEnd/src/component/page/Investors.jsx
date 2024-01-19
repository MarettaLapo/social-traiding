import { useState, useEffect } from "react";
import { ethers } from "ethers";

import CurrentPrice from "./CurrentPrice";
import * as addresses from "../utils/addresses";

import accountManagerAbi from "../abi/AccountManager.json";
import liquidityPoolAbi from "../abi/LiquidityPool.json";
import usdcAbi from "../abi/USDC.json";
import Modal from "react-bootstrap/Modal";

import { styled } from "@mui/material/styles";
import {
  TableCell,
  TableRow,
  TableContainer,
  TableHead,
  TableBody,
  Paper,
  Table,
  Grid,
  Button,
  FormControl,
  FormLabel,
  TextField,
} from "@mui/material";

function createData(
  lpAddress,
  balanceLp,
  balanceOwnerToken,
  fundrisingStopTime,
  timeForStopTraiding,
  canTraiding,
  contractLP
) {
  return {
    lpAddress,
    balanceLp,
    balanceOwnerToken,
    fundrisingStopTime,
    timeForStopTraiding,
    canTraiding,
    contractLP,
  };
}

function Investors() {
  const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: "#666666",
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: "center",
    fontSize: "20px",
    color: "white",
  }));
  // DeployAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  const [contractAccManager, setContractAccManager] = useState();
  const [contractLiqPool, setContractLiqPool] = useState();
  const [currentAccount, setCurrentAccount] = useState();
  const [datas, setDatas] = useState();
  const [showModal, setShowModal] = useState(false);
  const [currentContractLP, setCurrentContractLP] = useState();
  const [provideValue, setProvideValue] = useState();

  //получение адреса аккаунта
  useEffect(() => {
    async function load() {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const a = await provider.listAccounts();
      console.log("Адрес аккаунта: ", a[0].address);

      setCurrentAccount(a[0].address);
    }
    load();
  }, []);

  //создание контракта Менеджера
  useEffect(() => {
    async function load() {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const a = await provider.listAccounts();
      console.log("Адрес аккаунта: ", a[0].address);

      setCurrentAccount(a[0].address);

      const contract = new ethers.Contract(
        addresses.ACCOUNT_MANAGER_ADDRESS,
        accountManagerAbi.abi,
        signer
      );
      console.log("Контракт менеджера: ", contract);
      setContractAccManager(contract);

      ///////////////////////////////

      const events = await contract.queryFilter(contract.filters.LPCreated());

      let investorsList = [];
      let promiseBalanceList = [];
      let promiseOwnerTokenList = [];
      let promiseFundrisingStopTime = [];
      let promiseTimeForStopTraiding = [];
      let promiseCanTraiding = [];
      let contratLPList = [];
      console.log("event", events);

      events.forEach(async (event) => {
        const { lp, manager } = event.args;
        //console.log(event.args);

        const contractLP = new ethers.Contract(
          lp,
          liquidityPoolAbi.abi,
          signer
        );

        investorsList.unshift(lp);
        promiseBalanceList.unshift(contractLP.balance());
        promiseOwnerTokenList.unshift(
          contractLP.getOwnerTokenCount(a[0].address)
        );
        promiseFundrisingStopTime.unshift(contractLP.fundrisingStopTime());
        promiseTimeForStopTraiding.unshift(contractLP.timeForStopTraiding());
        promiseCanTraiding.unshift(contractLP.canTraiding());
        contratLPList.unshift(contractLP);
      });

      const balanceList = await Promise.all(promiseBalanceList);
      const ownerTokenList = await Promise.all(promiseOwnerTokenList);
      const fundrisingStopTime = await Promise.all(promiseFundrisingStopTime);
      const timeForStopTraiding = await Promise.all(promiseTimeForStopTraiding);
      const canTraiding = await Promise.all(promiseCanTraiding);

      const outputList = investorsList.map(function (e, i) {
        return [
          e,
          balanceList[i],
          ownerTokenList[i],
          fundrisingStopTime[i],
          timeForStopTraiding[i],
          canTraiding[i],
          contratLPList[i],
        ];
      });
      const datas = [];
      for (let item of outputList) {
        datas.push(
          createData(
            item[0],
            Number(item[1]),
            Number(item[2]),
            Number(item[3]),
            Number(item[4]),
            item[5],
            item[6]
          )
        );
      }
      console.log(datas);
      setDatas(datas);
    }
    load();
  }, []);

  function handleClose() {
    setShowModal(false);
  }
  function handleOpen(contract) {
    setCurrentContractLP(contract);
    setShowModal(true);
  }

  const handleProvideValue = (event) => {
    setProvideValue(event.target.value);
  };

  function isButtonProvide(fundrisingStopTime) {
    let timeNow = Date.now();
    let fund = new Date(fundrisingStopTime * 1000).getTime();
    return timeNow < fund;
  }

  function isButtonWithdraw(timeForStopTraiding, canTraiding, contract) {
    // const provider = new ethers.BrowserProvider(window.ethereum);
    // const signer = await provider.getSigner();

    // const a = await provider.listAccounts();
    // let address = a[0].address;
    // const events = await contract.queryFilter(
    //   contract.filters.ownerProvidedToken()
    // );
    // let he = false;
    // events.some((event) => {
    //   for (let i = 0; i < event.args.length; i++) {
    //     console.log(event.args[i]);
    //     if (event.args[i] === address) {
    //       he = true;
    //     }
    //   }
    // });
    // console.log(he);
    let timeNow = Date.now();
    let timeTrading = new Date(timeForStopTraiding * 1000).getTime();
    return timeNow > timeTrading && !canTraiding;
  }

  function isButtonClose(timeForStopTraiding, canTraiding) {
    let timeNow = Date.now();
    let timeTrading = new Date(timeForStopTraiding * 1000).getTime();
    return timeNow > timeTrading && canTraiding;
  }

  async function provide(e) {
    e.preventDefault();
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const contractUSDC = new ethers.Contract(
      addresses.USDC_ADDRESS,
      usdcAbi.abi,
      signer
    );
    console.log(contractUSDC);

    let lpAddress = await currentContractLP.getAddress();
    console.log(lpAddress);

    await contractUSDC.approve(lpAddress, provideValue);
    await currentContractLP.provide(provideValue);

    console.log(await currentContractLP.balance());
  }

  async function withdraw(contract) {
    let tx = await contract.withdraw();
    await tx.wait();
  }

  async function closeTrading(contract) {
    let tx = await contract.closeTraiding();
    await tx.wait();
  }

  return (
    <div className="container">
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Item>
            <CurrentPrice></CurrentPrice>
          </Item>
        </Grid>
        <TableContainer
          // sx={{ maxWidth: 1000 }}
          component={Paper}
          className="mt-5 mb-5"
        >
          <Table aria-label="customized table">
            <TableHead>
              <TableRow>
                <TableCell>Manager</TableCell>
                <TableCell align="right">Total Invested</TableCell>
                <TableCell align="right">Your balance</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {datas?.map((data) => (
                <TableRow key={data.lpAddress}>
                  <TableCell component="th" scope="row">
                    {data.lpAddress}
                  </TableCell>
                  <TableCell align="right">{data.balanceLp}</TableCell>
                  <TableCell align="right">{data.balanceOwnerToken}</TableCell>
                  <TableCell align="right">
                    <div>
                      {isButtonProvide(data.fundrisingStopTime) && (
                        <div>
                          <Button
                            onClick={() => handleOpen(data.contractLP)}
                            variant="contained"
                          >
                            Provide
                          </Button>
                        </div>
                      )}

                      {isButtonWithdraw(
                        data.timeForStopTraiding,
                        data.canTraiding,
                        data.contractLP
                      ) && (
                        <div>
                          <Button
                            onClick={() => withdraw(data.contractLP)}
                            variant="contained"
                          >
                            Withdraw
                          </Button>
                        </div>
                      )}
                      {isButtonClose(
                        data.timeForStopTraiding,
                        data.canTraiding
                      ) && (
                        <div>
                          <Button
                            onClick={() => closeTrading(data.contractLP)}
                            variant="contained"
                          >
                            Close trading
                          </Button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
      <Modal show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Создание трейдинг аккаунта</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={provide} className="ms-5">
            <div className="mt-3 ms-5">
              <FormControl>
                <FormLabel htmlFor="count">Укажите сумму ввода</FormLabel>
                <TextField
                  type="number"
                  id="standard-basic"
                  variant="standard"
                  name="provideValue"
                  value={provideValue}
                  onChange={handleProvideValue}
                  placeholder="30"
                  // error={telephoneError}
                  className="form-control"
                  // helperText={telephoneText}
                  required
                />
              </FormControl>
            </div>
            <div className="mt-5 text-center mb-4">
              <Button type="submit" variant="contained" color="primary">
                Внести
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default Investors;
