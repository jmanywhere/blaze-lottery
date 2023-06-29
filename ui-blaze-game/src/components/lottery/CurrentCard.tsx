"use client";
import Image from "next/image";
import { useEffect } from "react";
import { FaChevronDown } from "react-icons/fa";
import format from "date-fns/format";
import { useSetAtom } from "jotai";
// Contracts
import { useAccount, useContractRead, useContractReads } from "wagmi";
import { formatEther, zeroAddress } from "viem";
import {
  lotteryAbi,
  lotteryContract,
  uniswapPairAbi,
  blazePair,
  ethPriceFeed,
  priceFeedAbi,
} from "@/data/contracts";
// Images
import flyingTokens from "@/../public/assets/flying_tokens.png";
//  Data
import { blazeInfo, openBuyTicketModal } from "@/data/atoms";

const Card = () => {
  const setOpenBuyTicketModal = useSetAtom(openBuyTicketModal);
  const setBlazeInfo = useSetAtom(blazeInfo);
  const { address } = useAccount();
  const { data: currentRound, refetch: currentRoundRefetch } = useContractRead({
    address: lotteryContract,
    abi: lotteryAbi,
    functionName: "currentRound",
  });
  const { data: roundInfo, refetch: roundInfoRefetch } = useContractReads({
    contracts: [
      {
        address: lotteryContract,
        abi: lotteryAbi,
        functionName: "roundInfo",
        args: [currentRound || 0n],
      },
      {
        address: lotteryContract,
        abi: lotteryAbi,
        functionName: "getUserTickets",
        args: [address || zeroAddress, currentRound || 0n],
      },
      {
        address: blazePair,
        abi: uniswapPairAbi,
        functionName: "getReserves",
        chainId: 1,
      },
      {
        address: ethPriceFeed,
        abi: priceFeedAbi,
        functionName: "latestRoundData",
        chainId: 1,
      },
    ],
  });

  useEffect(() => {
    setBlazeInfo({
      price:
        (Number(roundInfo?.[2]?.result?.[1] || 0) *
          (Number(roundInfo?.[3]?.result?.[1] || 0n) / 1e8)) /
        Number(roundInfo?.[2]?.result?.[0] || 1),
      ticketPrice: Number(formatEther(roundInfo?.[0]?.result?.[2] || 0n)),
      currentRound: Number(currentRound?.toString() || 0),
    });
  }, [setBlazeInfo, roundInfo, currentRound]);

  useEffect(() => {
    const interval = setInterval(() => {
      void currentRoundRefetch();
      void roundInfoRefetch();
    }, 10000);
    return () => clearInterval(interval);
  });

  console.log(roundInfo);

  const ethPrice = Number(roundInfo?.[3]?.result?.[1] || 0n) / 1e8;
  const blazePrice =
    (Number(roundInfo?.[2]?.result?.[1] || 0) * ethPrice) /
    Number(roundInfo?.[2]?.result?.[0] || 1);

  console.log({
    ethPrice,
    blazePrice,
  });
  return (
    <div className="card bg-secondary-bg rounded-3xl overflow-hidden border-golden border-4 max-w-md font-outfit">
      <div className="bg-golden text-black px-4 py-2 flex flex-row justify-between items-center text-sm">
        <div>Next Draw</div>
        <div>
          #{currentRound?.toString()} |{" "}
          {format(
            new Date(Number(roundInfo?.[0]?.result?.[3]) * 1000),
            "yyyy-MM-dd HH:mm"
          )}
        </div>
      </div>
      <div className="card-body flex flex-row items-center justify-evenly border-b-2 border-b-gray-400 pb-4">
        <div className="w-16">
          <Image src={flyingTokens} alt="Flying tokens" />
        </div>
        <div className="flex flex-col items-center">
          <div className="text-xl whitespace-pre-wrap md:whitespace-normal text-center">
            Prize amount:{" \n"}
            <span className="text-golden">
              ${" "}
              <span className="underline">
                {(
                  blazePrice *
                  Number(formatEther(roundInfo?.[0]?.result?.[0] || 0n))
                ).toLocaleString()}
              </span>
            </span>
          </div>
          <div className="py-4 whitespace-pre-wrap md:whitespace-normal text-center">
            Tickets playing:{" \n"}
            <span className="underline">
              {roundInfo?.[0]?.result?.[1].toLocaleString() || 0}
            </span>
          </div>
          {(roundInfo?.[1]?.result?.[2] || 0n) > 0 && (
            <div className="py-4">
              Your Tickets:{" "}
              <span className="underline">
                {roundInfo?.[1]?.result?.[2].toLocaleString() || 0}
              </span>
            </div>
          )}
          <div className="py-4">
            <button
              className="btn btn-accent btn-sm text-white"
              onClick={() => setOpenBuyTicketModal(true)}
            >
              Buy Tickets
            </button>
          </div>
        </div>
        <div className="w-16">
          <Image src={flyingTokens} alt="Flying tokens" />
        </div>
      </div>
      <div className="w-full collapse collapse-arrow">
        <input type="checkbox" />
        <div className="w-full flex flex-row items-center justify-center gap-x-2 collapse-title">
          Details
        </div>
        <div className="collapse-content">content here</div>
      </div>
    </div>
  );
};

export default Card;
