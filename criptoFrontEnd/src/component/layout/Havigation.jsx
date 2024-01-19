import React, { useState } from "react";
import { useEffect } from "react";
import { ethers } from "ethers";
import { NavLink } from "react-router-dom";
import Button from "@mui/material/Button";

const Navigation = () => {
  const [currentAccount, setCurrentAccount] = useState();
  const accountManager = "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199";
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    async function load() {
      if (!window.ethereum) {
        console.log("please install MetaMask");
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      let address;
      try {
        address = accounts[0].address;
        setCurrentAccount(address);
        if (address === accountManager) {
          isManager(true);
        }
      } catch (e) {
        console.log(e);
      }
    }
    load();
  }, []);

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
        <li>
          <Button variant="outlined" color="error">
            Currency
          </Button>
        </li>
      </ul>
    </nav>
  );
};

export default Navigation;
