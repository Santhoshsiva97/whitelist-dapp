import Head from 'next/head'
import { useState, useRef, useEffect } from 'react';
import styles from '../styles/Home.module.css'
import { providers, Contract } from 'ethers';
import Web3Model from 'web3modal';
import { WHITELIST_CONTRACT_ADDRESS, abi } from '../constants';

export default function Home() {

  const [ walletConnected, setWalletConnected ] = useState(false);
  const [ joinedWhitelist, setJoinedWhitelist ] = useState(false);
  const [ whitelistNumber, setWhitelistNumber ] = useState(0);
  const [ loading, setLoading ] = useState(false);
  // const [ renderItem, setRenderItem ] = useState([]);
  const web3ModelRef = useRef();
 /**
   * Returns a Provider or Signer object representing the Ethereum RPC with or without the
   * signing capabilities of metamask attached
   *
   * A `Provider` is needed to interact with the blockchain - reading transactions, reading balances, reading state, etc.
   *
   * A `Signer` is a special type of Provider used in case a `write` transaction needs to be made to the blockchain, which involves the connected account
   * needing to make a digital signature to authorize the transaction being sent. Metamask exposes a Signer API to allow your website to
   * request signatures from the user using Signer functions.
   *
   * @param {*} needSigner - True if you need the signer, default false otherwise
   */
  
  const getSignerOrProvider = async (needSigner = false) => {
    const provider = await web3ModelRef.current.connect();
    const web3provider = await new providers.Web3Provider(provider);

    const {chainId} = await web3provider.getNetwork(web3provider);
    if(chainId != 4) {
      window.alert('Change network to Rinkeby');
      throw new error('Change network to Rinkeby');
    }
    if(needSigner) {
      const signer = web3provider.getSigner();
      return signer;
    }
    return web3provider;
  }

  const addAddressToWhitelist = async () => {
    try {
      const signer = await getSignerOrProvider(true);
      if(signer) {
        const whitelistContract = new Contract(
          WHITELIST_CONTRACT_ADDRESS,
          abi,
          signer
        );

        const tx = await whitelistContract.addToWhitelistAddresses();
        setLoading(true);
        await tx.wait();
        setLoading(false);
        await getNumberOfWhitelisted();
        setJoinedWhitelist(true);

      }
    } catch(err) {
      console.error('error in getting whitelisted', err);
    }
  }

  const getNumberOfWhitelisted = async () => {
    console.log('getNumberOfWhitelisted:::::::::')
    try {
      const provider = await getSignerOrProvider();
      const deployedContract = new Contract (
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        provider
      )
      const _whitelistNumber = await deployedContract.numAddressesWhitelisted();
      console.log('_whitelistNumber:::::', _whitelistNumber.toNumber())

      setWhitelistNumber(_whitelistNumber.toNumber());

    } catch(err) {
      console.error('error in getNumberOfWhitelisted::::', err)
    }
  }

  const checkIfAddressInWhitelist = async () => {
    console.log('checkIfAddressInWhitelist:::::::')
    try{

      const signer = await getSignerOrProvider(true);
      const deployedContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer
      );
      const signerAddress = signer.getAddress();
      const _setWhitelistAddress = await deployedContract.whitelistedAddress(signerAddress);
      setJoinedWhitelist(_setWhitelistAddress);

    } catch(err) {
      console.error('error in checkIfAddressInWhitelist::::::::', err);
    }
  }

  const connectWallet = async() => {
    try {

      const tx = await getSignerOrProvider();
      setWalletConnected(true);

      checkIfAddressInWhitelist();
      getNumberOfWhitelisted();

    } catch(err) {
      console.error('connection is failed::::::', err);
    }
  }

  const renderButton = () => {
    // let contentItem = [];
    if (walletConnected) {
      console.log('walletConnected::::::true')
      if (joinedWhitelist) {
        return (
          <div className={styles.description}>
            Thanks for joining the Whitelist!
          </div>
        );
      } else if (loading) {
        return <button className={styles.button}>Loading...</button>;
      } else {
        console.log('addAddressToWhitelist::::::true')
        return (
          <button onClick={addAddressToWhitelist} className={styles.button}>
            Join the Whitelist
          </button>
        );
      }
    } else {
      return <button onClick={connectWallet} className={styles.button}>Connect your wallet</button> 
    }
  };


  useEffect(() => {
    if(!walletConnected) {
      web3ModelRef.current = new Web3Model({
        network: 'rinkeby',
        providerOptions: {},
        disableInjectedProvider: false,
      })
      connectWallet();
    }
  }, [walletConnected])

  


    return (
      <div>
        <Head>
          <title>Whitelist Dapp</title>
          <meta name="description" content="Whitelist-Dapp" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        <div className={styles.main}>
          <div>
            <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
            <div className={styles.description}>
              Its an NFT collection for developers in Crypto.
            </div>
            <div className={styles.description}>
              {whitelistNumber} have already joined the Whitelist
            </div>
            {renderButton()}
          </div>
          <div>
            <img className={styles.image} src="./crypto-devs.svg" />
          </div>
        </div>

        <footer className={styles.footer}>
          Made with &#10084; by Crypto Devs
        </footer>
      </div>
    )
  
  
}
