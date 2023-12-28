import './App.css';

function Investors() {
    const[account, setAccount] = useState();
    const[address, setAddress] = useState();

    useEffect(() => {
      async function load() {
        //Получение провайдера
        const provider = new ethers.BrowserProvider(window.ethereum);

        //Получение аккаунтов
        const accounts = await provider.listAccounts();
        
        //Адрес деплоинга
        const addressContract = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
        //Объект контракта
        const erc20 = new ethers.Contract(addressContract, abi, provider);

        //Баланс аккаунта
        const balance = await provider.getBalance(a[0].address)


        setAddress(accounts[0].address)
        setAccount(accounts[0]);
      }
      load();
      }, []);
  //render function
    return(
        <div>
            <h1>Это я меню</h1>
        </div>
    )  


}

export default Investors;
