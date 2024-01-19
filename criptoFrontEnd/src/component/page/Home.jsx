import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@mui/material";

function Home() {
  const [balance, setBalance] = useState();
  const [currentAccount, setCurrentAccount] = useState();
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      if (!window.ethereum) {
        console.log("please install MetaMask");
        return;
      }

      let address;

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);

        const accounts = await provider.listAccounts();
        address = accounts[0].address;
        setCurrentAccount(address);
        provider.getBalance(address).then((result) => {
          setBalance(ethers.formatEther(result));
        });
      } catch (e) {
        setError(true);
        console.log(e);
      }
    }
    load();
  }, []);

  function toInvest() {
    navigate("/investment");
  }

  function toTrade() {
    navigate("/trading");
  }

  return (
    <div className="container">
      <div className="fs-1">Hello.</div>
      {error ? (
        <div>Обновите метамаск</div>
      ) : (
        <div className="fs-5 mt-3">
          <div>Адрес аккаунта: {currentAccount}</div>
          <div>Баланс: {balance}</div>
          <div className="mt-4">
            Причина использования:
            <div className="mt-3">
              <Button
                className="w-25 me-5"
                variant="contained"
                onClick={toInvest}
              >
                Investment
              </Button>

              <Button className="w-25" variant="contained" onClick={toTrade}>
                Trading
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
