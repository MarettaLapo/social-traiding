import { useState, useEffect } from "react";
import { ethers } from "ethers";

import CurrentPrice from "./CurrentPrice";
import * as addresses from "../utils/addresses";

import accountManagerAbi from "../abi/AccountManager.json";
import liquidityPoolAbi from "../abi/LiquidityPool.json";
import usdcAbi from "../abi/USDC.json";

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
} from "@mui/material";

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
  // const[contract, setContract] = useState();
  // const[provider, setProvider] = useState();

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
      events.forEach(async (event) => {
        const { lp, manager } = event.args;
        //console.log(event.args);

        const contractLP = new ethers.Contract(
          lp,
          liquidityPoolAbi.abi,
          signer
        );
        console.log("contract", contractLP);
        // let balance = await
        // let ownerToken = await
        //адрес, баланс лп, баланс человека
        investorsList.push([
          lp,
          contractLP.getBalance(),
          contractLP.getOwnerTokenCount(a[0].address),
        ]);
      });
      for (let i of investorsList) {
        await Promise.all(i[0]);
      }

      console.log(investorsList);
    }
    load();
  }, []);

  return (
    <div className="container">
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Item>
            <CurrentPrice></CurrentPrice>
          </Item>
        </Grid>
        <TableContainer
          sx={{ maxWidth: 1000 }}
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
              {/* {offices.map((office) => (
              <StyledTableRow key={office.id}>
                <TableCell  component="th" scope="row">
                  <Link to={"/office/" + office.id}>{office.number}</Link>
                </TableCell >
                <TableCell  align="right">
                  {office.floor.number}
                </TableCell >
                <TableCell  align="right">
                  {office.isFree ? "Свободен" : "Забронирован"}
                </TableCell >
                <TableCell  align="right">{office.area}</TableCell >
                <TableCell  align="right">
                  {office.officeDetail.isSun ? "Да" : "Нет"}
                </TableCell >
                <TableCell  align="right">
                  {office.officeDetail.windowsCount}
                </TableCell >
                <TableCell  align="right">
                  {office.officeDetail.isInternet ? "Да" : "Нет"}
                </TableCell >
                <TableCell  align="right">
                  {office.officeDetail.sockets}
                </TableCell >
              </StyledTableRow>
            ))} */}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </div>
  );
}

export default Investors;
