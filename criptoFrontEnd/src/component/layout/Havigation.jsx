import React, { useState } from "react";
import { useEffect } from "react";
import { ethers } from "ethers";
import { NavLink } from "react-router-dom";
import Button from "@mui/material/Button";
import Modal from "react-bootstrap/Modal";
import { FormControl, TextField } from "@mui/material";
import Snackbar, { SnackbarOrigin } from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

import * as addresses from "../utils/addresses";
import traidingAccountAbi from "../abi/TraidingAccount.json";

const Navigation = () => {
  const accountManager = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";
  const [isManager, setIsManager] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currencyValue, setCurrencyValue] = useState();
  const [tradingContract, setTradingContract] = useState();
  const [open, setOpen] = useState(false);

  const handleCloseClick = () => {
    setOpen(false);
  };

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
        if (address === accountManager) {
          const contract = new ethers.Contract(
            addresses.TRADING_ACCOUNT_ADDRESS,
            traidingAccountAbi.abi,
            signer
          );

          let curr = await contract.currency();
          setCurrencyValue(Number(curr));
          setTradingContract(contract);
          setIsManager(true);
        }
      } catch (e) {
        console.log(e);
      }
    }
    load();
  }, []);
  function handleClose() {
    setShowModal(false);
  }
  function handleOpen() {
    setShowModal(true);
  }
  const handleCurrencyValue = (event) => {
    setCurrencyValue(event.target.value);
  };

  async function setCurrency(e) {
    e.preventDefault();
    let tx = await tradingContract.setCurrency(currencyValue);
    let receipt = await tx.wait();
    setShowModal(false);
    setOpen(true);
  }

  return (
    <nav>
      <ul>
        <li>
          <NavLink exact activeClassName="active" to="/">
            Home
          </NavLink>
        </li>
        <li>
          <NavLink exact activeClassName="active" to="/investment">
            Investors
          </NavLink>
        </li>
        <li>
          <NavLink exact activeClassName="active" to="/trading">
            Traders
          </NavLink>
        </li>
        {isManager && (
          <li>
            <Button variant="outlined" color="error" onClick={handleOpen}>
              Currency
            </Button>
          </li>
        )}
      </ul>
      <Modal show={showModal} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Changing currency</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={setCurrency} className="text-center">
            <div>
              <FormControl>
                <TextField
                  name="provideValue"
                  value={currencyValue}
                  onChange={handleCurrencyValue}
                  id="standard-basic"
                  label="Value"
                  variant="standard"
                />
              </FormControl>
            </div>
            <div className="mt-4 text-center mb-3">
              <Button type="submit" variant="contained" color="primary">
                Change
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
      <Snackbar open={open} onClose={handleCloseClick} autoHideDuration={6000}>
        <Alert
          onClose={handleClose}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          The currency value has been changed successfully
        </Alert>
      </Snackbar>
    </nav>
  );
};

export default Navigation;
