import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Navigate, useNavigate } from "react-router-dom";

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
    <div className="App">
      <div>Hello.</div>
      {error ? (
        <div>Обновите метамастк</div>
      ) : (
        <div>
          <div>Адрес аккаунта: {currentAccount}</div>
          <div>Баланс: {balance}</div>
          <div>
            Причина использования:
            <div>
              <button onClick={toInvest}>Инвестирование</button>
              <button onClick={toTrade}>Трейдинг</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
