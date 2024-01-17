import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Navigate, useNavigate } from "react-router-dom";

function Home() {
  const [balance, setBalance] = useState();
  const [currentAccount, setCurrentAccount] = useState();
  const navigate = useNavigate();
  // const accounts = await provider.listAccounts();

  // setCurrentAccount(accounts[0].address);

  // console.log(accounts[0].address);
  useEffect(() => {
    if (!currentAccount || !ethers.isAddress(currentAccount)) return;
    //client side code
    if (!window.ethereum) return;

    const provider = new ethers.BrowserProvider(window.ethereum);

    provider.getBalance(currentAccount).then((result) => {
      setBalance(ethers.formatEther(result));
    });
  }, [currentAccount]);

  async function connectUs() {
    if (!window.ethereum) {
      console.log("please install MetaMask");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);

    const accounts = await provider.listAccounts();

    setCurrentAccount(accounts[0].address);
  }

  function toInvest() {
    navigate("/investment");
  }

  function toTrade() {
    navigate("/trading");
  }

  return (
    <div className="App">
      <div>Hello.</div>
      {!currentAccount ? (
        <div>
          <button onClick={connectUs}>Подключить MetaMask</button>
        </div>
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
