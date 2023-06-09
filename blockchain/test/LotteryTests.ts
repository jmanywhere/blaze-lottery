import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { convertToHex } from "./utils";
import { parseEther } from "ethers/lib/utils";


describe("Lottery", function () {

  async function setup(){
    const [owner, user1, user2, user3, user4, user5] = await ethers.getSigners();
    const LotteryFactory = await ethers.getContractFactory("BlazeLottery", owner);
    const MockTokenFactory = await ethers.getContractFactory("MockToken", owner);
    const mockToken = await MockTokenFactory.deploy();
    const lottery = await LotteryFactory.deploy(mockToken.address);
    await mockToken.transfer(user1.address, ethers.utils.parseEther("1000"))
    await mockToken.transfer(user2.address, ethers.utils.parseEther("1000"))
    await mockToken.transfer(user3.address, ethers.utils.parseEther("1000"))
    await mockToken.transfer(user4.address, ethers.utils.parseEther("1000"))
    return {lottery, owner, user1, user2, user3, user4, user5, mockToken}
  }

  async function setupStarted () {
    const init = await setup()
    const {lottery, owner, user1, user2, user3, user4, user5, mockToken} = init
    await lottery.activateLottery(parseEther("10"))
    await mockToken.connect(user1).approve(lottery.address, parseEther("1000"))
    await mockToken.connect(user2).approve(lottery.address, parseEther("1000"))
    await mockToken.connect(user3).approve(lottery.address, parseEther("1000"))
    await mockToken.connect(user4).approve(lottery.address, parseEther("1000"))
    await mockToken.connect(user5).approve(lottery.address, parseEther("1000"))
    return init
  }

  describe("Owner Functions", ()=>{
    it("Should set the price for current Round", async() => {
      const { lottery, owner, user1, user2, user3, user4, user5, mockToken} = await loadFixture(setup);
      await expect(lottery.connect(user1).setPrice(0, 0)).to.be.revertedWith("Ownable: caller is not the owner");
      await lottery.setPrice( parseEther("12"), 1, )
      const round1Info = await lottery.roundInfo(1)
      expect(round1Info.price).to.equal(parseEther("12"))
    })

  })

  describe("Calculation functions", () => {
    it("Should check that ticket matches are the same regardless of scenario", async () => {
      const { lottery } = await loadFixture(setup);

      const ticketWinner = convertToHex([10,20,30,40,50])
      
      let ticketToBuy = convertToHex([10,20,30,40,50])
      expect(await lottery.checkTicketMatching(ticketWinner, ticketToBuy)).to.equal(5)
      
      ticketToBuy = convertToHex([50,40,30,20,10])
      expect(await lottery.checkTicketMatching(ticketWinner, ticketToBuy)).to.equal(5)

      ticketToBuy = convertToHex([10,20,30,40,60])
      expect(await lottery.checkTicketMatching(ticketToBuy, ticketWinner)).to.equal(4)
      expect(await lottery.checkTicketMatching(ticketWinner, ticketToBuy)).to.equal(4)
      
      ticketToBuy = convertToHex([88,1,0,3,0])
      expect(await lottery.checkTicketMatching(ticketWinner, ticketToBuy)).to.equal(0)

      // TODO THIS PARTICULAR CASE IS STILL PENDING
      ticketToBuy = convertToHex([1,40,63, 74, 148 ])
      expect(await lottery.checkTicketMatching(ticketWinner, ticketToBuy)).to.equal(3)
    })
  })

  describe( "Buy Tickets", function (){
    it("Should not allow to buy tickets until the round is started", async ()=>{
      const { lottery, user1 } = await loadFixture(setup);
      const ticketToBuy = convertToHex([10,20,30,40,50])
      await expect(lottery.connect(user1).buyTickets(new Array(10).fill(ticketToBuy))).to.be.revertedWithCustomError(lottery,"RoundInactive").withArgs(0)
    })
    it("Should not allow to buy tickets until the round is started NOT EVEN OWNER", async ()=>{
      const { lottery, owner } = await loadFixture(setup);
      const ticketToBuy = convertToHex([10,20,30,40,50])
      await expect(lottery.connect(owner).buyTickets(new Array(10).fill(ticketToBuy))).to.be.revertedWithCustomError(lottery,"RoundInactive").withArgs(0)
    })
    it("should buy tickets", async function (){
      const { lottery, owner, user1, user2, user3, user4, user5} = await loadFixture(setupStarted);
      const ticketToBuy = convertToHex([10,20,30,40,50])
      const user2TicketsToBuy = new Array(100).fill(ticketToBuy)
      await lottery.connect(user1).buyTickets(new Array(10).fill(ticketToBuy))
      await lottery.connect(user2).buyTickets(user2TicketsToBuy)
      await lottery.connect(user3).buyTickets(new Array(20).fill(ticketToBuy))
      await lottery.connect(user4).buyTickets(new Array(40).fill(ticketToBuy))
      await lottery.connect(user5).buyTickets(new Array(60).fill(ticketToBuy))

      const user1Tickets = await lottery.getUserTickets(user1.address, 0)
      expect(user1Tickets[2]).to.equal(10)
    })
  })
})