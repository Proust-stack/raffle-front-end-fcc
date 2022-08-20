import React, { useEffect, useState } from "react"
import { useWeb3Contract } from "react-moralis"
import { abi, contractAddresses } from "../constants"
import { useMoralis } from "react-moralis"
import { ethers } from "ethers"
import { Button, useNotification } from "web3uikit"

export default function LotteryEntrance() {
    const { chainId: chainIdHex, isWeb3Enabled } = useMoralis()
    const [entranceFee, setEntranceFee] = useState("0")
    const [numPlayers, setNumPlayers] = useState("0")
    const [recentWinner, setRecentWinner] = useState(null)
    const [entranceFeeFormatted, setEntranceFeeFormatted] = useState("0")

    const dispatch = useNotification()
    const chainId = parseInt(chainIdHex)
    const raffleAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null

    const {
        runContractFunction: enterRaffle,
        isLoading,
        isFetching,
    } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "enterRaffle",
        params: {},
        msgValue: entranceFee,
    })
    const { runContractFunction: getEntranceFee } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "getEntranceFee",
        params: {},
    })
    const { runContractFunction: getNumberOfPlayers } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "getNumberOfPlayers",
        params: {},
    })
    const { runContractFunction: getRecentWinner } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "getRecentWinner",
        params: {},
    })

    useEffect(() => {
        if (isWeb3Enabled) {
            updateUI()
        }
    }, [isWeb3Enabled])

    async function updateUI() {
        const entranceFeeFromCall = (await getEntranceFee()).toString()
        const numPlayersFromCall = (await getNumberOfPlayers()).toString()
        let recentWinnerFromCall = (await getRecentWinner()).toString()
        if (recentWinnerFromCall.includes("0x0000000000")) {
            recentWinnerFromCall = null
        }
        setEntranceFee(entranceFeeFromCall)
        setNumPlayers(numPlayersFromCall)
        setRecentWinner(recentWinnerFromCall)
        setEntranceFeeFormatted(ethers.utils.formatUnits(entranceFeeFromCall, "ether"))
    }

    const handleSuccess = async function (trx) {
        await trx.wait(1)
        handleNotification(trx)
        updateUI()
    }
    const handleNotification = function (trx) {
        dispatch({
            type: "success",
            title: "Transaction complete",
            position: "topR",
            icon: "bell",
        })
    }

    async function enterRaffleWrapper() {
        await enterRaffle({
            onSuccess: handleSuccess,
            onError: (error) => console.log(error),
        })
    }

    return (
        <div className="p-5">
            <Button
                text="enter raffle"
                onClick={enterRaffleWrapper}
                disabled={isLoading || isFetching}
                theme="primary"
                loadingText="loading"
            />
            {raffleAddress ? (
                <>
                    <div>Entrance fee: {entranceFeeFormatted} eth</div>
                    <div>Number of players: {numPlayers}</div>
                    {recentWinner && <div>Recent winner: {recentWinner}</div>}
                </>
            ) : (
                <div>No raffle address detected</div>
            )}
        </div>
    )
}
