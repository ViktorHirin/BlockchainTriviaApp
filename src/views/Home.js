import React, { useEffect, useState } from "react";

// import modules
import { useMoralis, useChain, useMoralisWeb3Api } from "react-moralis";
import {
  isBrowser,
  isMobile,
  BrowserView,
  MobileView,
} from "react-device-detect";
import Web3 from "web3";

// Import Modules
import _ from "lodash";
import shuffle from "lodash.shuffle";
import { Modal, Button, Spinner, Form, Badge } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Import Images
import Background from "../assets/img/background.png";
import BackgroundMobile from "../assets/img/background-mobile.png";
import SkipBtn from "../assets/img/skip.png";
import StoppedTimer from "../assets/img/timer/10.png";
import LemonBtn from "../assets/img/btn-lemon.png";
import Qprepare from "../assets/img/qpoint/0.png";
import Qstep1 from "../assets/img/qpoint/1.png";
import Qstep2 from "../assets/img/qpoint/2.png";
import Qstep3 from "../assets/img/qpoint/3.png";
import Qstep4 from "../assets/img/qpoint/4.png";
import Qstep5 from "../assets/img/qpoint/5.png";
import Qend from "../assets/img/qpoint/00.png";

// Import Problems
import round_1 from "../store/round1.json";
import round_2 from "../store/round2.json";
import round_3 from "../store/round3.json";
import round_4 from "../store/round4.json";
import round_5 from "../store/round5.json";
import round_6 from "../store/round6.json";

// Import Smart Contract Details
import {
  gameContractAddress,
  coinContractAddress,
  betMinAmount,
  fee,
} from "../constants/constants";
import gameAbi from "../constants/gameAbi.json";
import coinAbi from "../constants/coinAbi.json";

// Import Components
import Timer from "../components/Timer";

// import constants
import {
  ROUND1_COIN_SCORE,
  ROUND2_COIN_SCORE,
  ROUND3_COIN_SCORE,
  ROUND4_COIN_SCORE,
  ROUND5_COIN_SCORE,
  TOTAL_PROBLEM,
} from "../constants/constants.js";

const qSteps = [Qprepare, Qstep1, Qstep2, Qstep3, Qstep4, Qstep5, Qend];
var web3Js, gameContract, coinContract;

// Global function
const shuffleList = (_array) => {
  var copy = [],
    i;
  // While there remain elements to shuffle…
  for (let j = 0; j < TOTAL_PROBLEM; j++) {
    // Pick a remaining element…
    i = Math.floor(Math.random() * _array.length);

    // If not already shuffled, move it to the new array.
    if (i in _array) {
      copy.push(_array[i]);
    }
  }
  // return copy;
  const final = sortRandomArr(copy);
  return final;
};

const sortRandomArr = (_array) => {
  const tempList = [];
  _array.forEach((el) => {
    let tempEl = {};
    let tempOpt = shuffle(el.answerOptions);
    tempEl = {
      questionText: el.questionText,
      answerOptions: tempOpt,
    };
    tempList.push(tempEl);
  });
  const quiz = shuffle(tempList);
  return quiz;
};

function Home() {
  const {
    authenticate,
    isAuthenticated,
    isWeb3Enabled,
    enableWeb3,
    user,
    isWeb3EnableLoading,
    logout,
    account,
    Moralis,
  } = useMoralis();

  const { switchNetwork, chainId } = useChain();
  const Web3Api = useMoralisWeb3Api();

  // state variables
  const [round1, setRound1] = useState(shuffleList(round_1));
  const [round2, setRound2] = useState(shuffleList(round_2));
  const [round3, setRound3] = useState(shuffleList(round_3));
  const [round4, setRound4] = useState(shuffleList(round_4));
  const [round5, setRound5] = useState(shuffleList(round_5));
  const [round6, setRound6] = useState(round_6);

  const [name, setName] = useState("");
  const [coinBalance, setCoinBalance] = useState(0);
  const [quiz, setQuiz] = useState([]);
  const [aCoin, setACoin] = useState(10);
  const [start, setStart] = useState(false);

  const [currentRound, setCurrentRound] = useState(0);
  const [currentSuccess, setCurrentSuccess] = useState(0);
  const [skip, setSkip] = useState(0);
  const [skipAvailable, setSkipAvailable] = useState(true);
  const [totalScore, setTotalScore] = useState(0);
  const [totalSuccess, setTotalSuccess] = useState(0);
  const [withdraw, setWithdraw] = useState(false);

  const [loading, setLoading] = useState(false);
  const [signModalShow, setSignModalShow] = useState(false);
  const [correctModalShow, setCorrectModalShow] = useState(false);
  const [wrongModalShow, setWrongModalShow] = useState(false);
  const [failedModalShow, setFailedModalShow] = useState(false);
  const [collectModalShow, setCollectModalShow] = useState(false);
  const [stopTimer, setStopTimer] = useState(0);
  const [currentQ, setCurrentQ] = useState(
    Math.floor(Math.random() * round1.length)
  );

  const [isEntered, setIsEntered] = useState(false);
  const [gameId, setGameId] = useState(0);
  const [isClaimed, setIsClaimed] = useState(false);
  const [curUser, setCurUser] = useState("");

  // Initialize App
  useEffect(() => {
    if (!isWeb3EnableLoading && !isWeb3Enabled) {
      if (isBrowser) {
        enableWeb3();
      } else if (isMobile) {
        enableWeb3({ provider: "walletconnect" });
      }
    }

    const loadContract = async () => {
      web3Js = await new Web3(Moralis.provider);
      gameContract = await new web3Js.eth.Contract(
        gameAbi,
        gameContractAddress
      );
      coinContract = await new web3Js.eth.Contract(
        coinAbi,
        coinContractAddress
      );
      console.log(gameContract, "game contract");
      console.log(coinContract, "coin contract");
    };

    if (isWeb3Enabled) {
      loadContract();
    }
  }, [isWeb3Enabled]);

  const fetchTokenBalances = async () => {
    const options = { chain: "bsc", address: curUser };
    const balances = await Web3Api.account.getTokenBalances(options);
    balances.forEach((value) => {
      if (value.name === "LemonHaze") {
        let balance = (Number(value.balance) / 1e18).toFixed(0);
        setCoinBalance(balance);
      }
    });
  };

  const connectMetamask = async () => {
    if (typeof window.ethereum === "undefined") {
      notify("info", "Please install metamask wallet.");
    } else {
      setLoading(true);
      handleSignUpModal(true);
      if (chainId !== "0x38") {
        try {
          await switchNetwork("0x38");
        } catch (err) {
          console.log(err);
        }
      }
      await authenticate({
        provider: "injected",
        signingMessage: "🎉 Welcome to LemonHaze App!",
        onComplete: () => {
          setCurUser(account);
          fetchTokenBalances();
          setLoading(false);
        },
      });
    }
  };

  const connectWalletConnect = async () => {
    setLoading(true);
    handleSignUpModal(true);
    if (chainId !== "0x38") {
      try {
        await switchNetwork("0x38");
      } catch (err) {
        console.log(err);
      }
    }
    await authenticate({
      provider: "walletconnect",
      signingMessage: "🎉 Welcome to LemonHaze App!",
      onComplete: () => {
        setCurUser(account);
        fetchTokenBalances();
        setLoading(false);
      },
    });
  };

  const registUser = async () => {
    if (name === "") {
      notify("error", "Please input your Nickname.");
    } else {
      if (coinBalance < 100) {
        notify(
          "warning",
          "Insufficient Tokens! Over 100 $Lmonz tokens are necessary."
        );
      } else {
        setLoading(true);
        coinContract.methods
          .approve(gameContractAddress, (betMinAmount * 10 ** 18).toString())
          .send({
            from: curUser,
          })
          .then((res) => {
            notify("success", "Your account is registered successfully.");
            gameContract.methods
              .startRound(name, (betMinAmount * 10 ** 18).toString())
              .send({
                from: curUser,
              })
              .then((res) => {
                const game_id = parseInt(
                  res.events.SendGameId.returnValues._id
                );
                console.log(game_id, "round is started");
                notify(
                  "success",
                  "You can start playing a game now. Good Luck!"
                );
                fetchTokenBalances();
                setIsEntered(true);
                setGameId(game_id);
                setLoading(false);
              })
              .catch((err) => {
                notify("error", "Error in playing a game.");
                setLoading(false);
              });
          })
          .catch((err) => {
            console.log(err);
            notify("error", "Error in Approving coins.");
            setLoading(false);
          });
      }
      // saveAccount();
    }
  };

  const collectWinnings = async () => {
    setFailedModalShow(false);
    setWrongModalShow(false);

    if (currentRound < 2) {
      if (currentSuccess !== 5 || (currentSuccess !== 4 && skip !== 1)) {
        notify("info", "You didn't get any tokens!");
        restart();
      }
    } else {
      setCollectModalShow(true);
      setLoading(true);
      const reward = totalScore * fee * 10 ** 18;
      const strReward = "0x" + reward.toString(16);
      gameContract.methods
        .endRound(gameId, strReward)
        .send({
          from: curUser,
        })
        .then((res) => {
          fetchTokenBalances();
          restart();
          setLoading(false);
          setCollectModalShow(false);
          notify("success", "Claimed successfully!");
        })
        .catch((err) => {
          console.log(err);
          setLoading(false);
          setCollectModalShow(false);
          notify("error", "You ejected the action.");
          collectWinnings();
        });
    }
  };

  // Custom Functions
  const goToScoreboard = () => {
    window.location.href = "https://lemonhazescoreboard.com";
  };

  // Notification
  const notify = (_type, _text) =>
    toast(_text, {
      position: "top-right",
      type: _type,
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: false,
      progress: undefined,
      theme: "colored",
    });

  const saveAccount = () => {
    if (name === "") {
      notify("error", "Please input your nick name!");
    } else {
      startGame();
      handleSignUpModal(false);
    }
  };

  const makeSubStringForAddr = (_str) => {
    const str_address =
      _str.substring(0, 6) +
      "..." +
      _str.substring(_str.length - 5, _str.length);
    return str_address;
  };

  const handleSignUpModal = (_type) => {
    setSignModalShow(_type);
  };

  const handleCorrectModal = (_type) => {
    setCorrectModalShow(_type);
  };

  const handleWrongModal = (_type) => {
    setWrongModalShow(_type);
  };

  const handleCollectModal = (_type) => {
    setCollectModalShow(_type);
  };

  const handleFailModal = (_type) => {
    setFailedModalShow(_type);
  };

  // Main functions

  const setInitialStates = (_round) => {
    switch (_round) {
      case 1:
        setQuiz(round1);
        setACoin(ROUND1_COIN_SCORE);
        break;
      case 2:
        setQuiz(round2);
        setACoin(ROUND2_COIN_SCORE);
        break;
      case 3:
        setQuiz(round3);
        setACoin(ROUND3_COIN_SCORE);
        break;
      case 4:
        setQuiz(round4);
        setACoin(ROUND4_COIN_SCORE);
        break;
      case 5:
        setQuiz(round5);
        setACoin(ROUND5_COIN_SCORE);
        break;
      case 6:
        setQuiz(round6);
        setACoin(ROUND5_COIN_SCORE);
        break;
      default:
        setQuiz([]);
        setACoin(10);
        break;
    }
  };

  const startGame = () => {
    setStart(true);
    setSkipAvailable(true);
    setStopTimer(0);
    setCurrentRound(1);
    setInitialStates(1);
  };

  const restart = () => {
    sortAllRounds();
    setStart(false);
    setIsEntered(false);
    setIsClaimed(false);
    setCurrentRound(0);
    setACoin(10);
    setInitialStates(0);
    setTotalScore(0);
    setTotalSuccess(0);
    setCurrentSuccess(0);
  };

  const restartGame = async () => {
    collectWinnings();
  };

  const skipPro = () => {
    setSkipAvailable(false);
    setSkip((prev) => prev + 1);
    const tempArr = quiz.slice();
    tempArr.splice(currentQ, 1);
    setQuiz(tempArr);
    if (tempArr.length > 0) {
      const nextQ = Math.floor(tempArr.length * Math.random());
      setCurrentQ(nextQ);
    } else {
      if (currentRound < 6) {
        goToNextRound();
      }
    }
  };

  const goToNextRound = () => {
    setWithdraw(true);
  };

  const continueRound = () => {
    setCurrentSuccess(0);
    setSkip(0);
    setSkipAvailable(true);
    setCurrentRound((prev) => prev + 1);
    setInitialStates(currentRound + 1);
  };

  const sortAllRounds = () => {
    setRound1(shuffleList(round_1));
    setRound2(shuffleList(round_2));
    setRound3(shuffleList(round_3));
    setRound4(shuffleList(round_4));
    setRound5(shuffleList(round_5));
  };

  const startAgain = () => {
    sortAllRounds();
    setStart(true);
    setStopTimer(0);
    setWithdraw(false);
    setCurrentSuccess(0);
    setCurrentRound(0);
    setInitialStates(0);
  };

  const checkAnswer = (_answer) => {
    setStopTimer(1);
    if (_answer) {
      setTotalSuccess((prev) => prev + 1);
      setTotalScore((prev) => prev + aCoin);
      setCurrentSuccess((prev) => prev + 1);
      handleCorrectModal(true);
    } else {
      if (currentRound < 6) {
        setTotalScore((prev) => prev - aCoin * currentSuccess);
        setTotalSuccess((prev) => prev - currentSuccess);
      }
      handleWrongModal(true);
    }
  };

  const continueTest = () => {
    setStopTimer(0);
    handleCorrectModal(false);
    const tempArr = quiz.slice();
    tempArr.splice(currentQ, 1);
    setQuiz(tempArr);
    if (tempArr.length > 0) {
      const nextQ = Math.floor(tempArr.length * Math.random());
      setCurrentQ(nextQ);
    } else {
      if (currentRound < 6) {
        goToNextRound();
      }
    }
  };

  return (
    <>
      <ToastContainer />
      {/* Sign Up Modal*/}
      <Modal
        dialogClassName="connect-modal"
        show={signModalShow}
        onHide={() => handleSignUpModal(false)}
        backdrop="static"
        keyboard={false}
        centered
      >
        <Modal.Header className="d-flex justify-content-center">
          <Modal.Title>
            {loading && (
              <div>
                <Spinner animation="border" variant="danger" />
              </div>
            )}
            {isEntered && (
              <Badge pill bg="success">
                <i className="bi bi-check-circle"></i> &nbsp;Entered
              </Badge>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {isAuthenticated && curUser !== "" && (
              <Form.Group
                className="mb-3"
                controlId="exampleForm.ControlInput1"
              >
                <Form.Label>Your wallet address : </Form.Label>
                <Form.Control
                  type="text"
                  readOnly
                  value={curUser}
                  className="login-input"
                />
              </Form.Group>
            )}
            <Form.Group
              className="mb-3"
              controlId="exampleForm.ControlTextarea1"
            >
              <Form.Label>Choose A Nick Name</Form.Label>
              <Form.Control
                disabled={loading}
                readOnly={isEntered}
                type="text"
                placeholder="Input your Nick Name"
                onChange={(e) => setName(e.target.value)}
                className="login-input"
                value={name}
              />
            </Form.Group>
            {!isEntered && <h6>You should pay 100 $Lmonz to play a game.</h6>}
          </Form>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-center">
          <Button
            disabled={loading}
            className="cancel-btn"
            variant="success"
            onClick={() => {
              handleSignUpModal(false);
            }}
          >
            Cancel
          </Button>

          {isEntered ? (
            <Button
              disabled={start}
              className="start-playing-btn"
              variant="success"
              onClick={() => {
                saveAccount();
              }}
            >
              Start Playing
            </Button>
          ) : (
            <Button
              disabled={loading || !isAuthenticated}
              className="confirm-btn"
              variant="success"
              onClick={() => {
                registUser();
              }}
            >
              Confirm
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      <Modal
        dialogClassName="correct-answer-modal"
        show={correctModalShow}
        onHide={() => handleCorrectModal(false)}
        backdrop="static"
        keyboard={false}
        centered
      >
        <Modal.Header className="d-flex justify-content-center"></Modal.Header>
        <Modal.Body className="text-center">
          <h3>You Answered Correctly !</h3>
          <h4>Are You Ready For The Next Question ?</h4>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-center">
          <Button
            className="continue-btn"
            variant="success"
            onClick={() => {
              continueTest();
            }}
          >
            Continue
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        dialogClassName="correct-answer-modal"
        show={collectModalShow}
        onHide={() => handleCollectModal(false)}
        backdrop="static"
        keyboard={false}
        centered
      >
        <Modal.Header className="d-flex justify-content-center">
          {loading && (
            <div>
              <Spinner animation="border" variant="success" />
            </div>
          )}
        </Modal.Header>
        <Modal.Body className="text-center">
          <h1 style={{ fontSize: "50px", color: "purple" }}>
            {" "}
            <i className="bi bi-trophy"></i>
          </h1>
          <h3 style={{ color: "purple" }}>Congratulations!</h3>
          <h5>You are claiming {totalScore} $Lmonz tokens now!</h5>
        </Modal.Body>
      </Modal>

      <Modal
        dialogClassName="wrong-answer-modal"
        show={wrongModalShow}
        onHide={() => handleWrongModal(false)}
        backdrop="static"
        keyboard={false}
        centered
      >
        <Modal.Body className="text-center">
          <h3>You Answered Incorrectly !</h3>
          <h4>Ready to try again?</h4>
          {currentRound > 5 ? (
            <Button
              className="restart-btn"
              variant="success"
              onClick={() => {
                collectWinnings();
              }}
            >
              <i className="bi bi-trophy"></i> &nbsp;Collect Winnings
            </Button>
          ) : (
            <Button
              className="restart-btn"
              variant="success"
              onClick={() => {
                restartGame();
              }}
            >
              Restart
            </Button>
          )}
        </Modal.Body>
      </Modal>

      <Modal
        dialogClassName="wrong-answer-modal"
        show={failedModalShow}
        onHide={() => handleFailModal(false)}
        backdrop="static"
        keyboard={false}
        centered
      >
        <Modal.Body className="text-center">
          <h3>You ran out of time!</h3>
          <h4>Ready to try again?</h4>
          {currentRound > 5 ? (
            <Button
              className="restart-btn"
              variant="success"
              onClick={() => {
                collectWinnings();
              }}
            >
              <i className="bi bi-trophy"></i> &nbsp;Collect Winnings
            </Button>
          ) : (
            <Button
              className="restart-btn"
              variant="success"
              onClick={() => {
                restartGame();
              }}
            >
              Restart
            </Button>
          )}
        </Modal.Body>
      </Modal>
      {/* Sign Up Modal End */}

      <div className="position-relative">
        {/* Header */}
        <div className="header position-relative">
          <BrowserView>
            <img className="w-100 h-375" src={Background} />
            <div className="header-content position-absolute top-0 container-fluid pt-3">
              <div className="row">
                <div className="col-5 text-start">
                  <div className="menu-btn">{/* <img src={MenuBtn} /> */}</div>
                </div>
                <div className="col-2 d-flex align-items-center justify-content-center">
                  <div className="level-container d-flex align-items-center justify-content-center text-center">
                    {currentRound === 0
                      ? "Start Game!"
                      : "Level " + currentRound}
                  </div>
                </div>
                <div className="col-5 d-flex align-items-center justify-content-end btn-container">
                  <div className="coin-balance text-center">
                    <span className="d-block label-balance">LMONZ Balance</span>
                    <div className="coin-balance-container d-flex align-items-center justify-content-center">
                      {coinBalance}
                    </div>
                  </div>
                  {isAuthenticated && curUser !== "" ? (
                    <button
                      className="connect-btn"
                      onClick={() => {
                        setCoinBalance(0);
                        logout();
                      }}
                    >
                      {makeSubStringForAddr(curUser)}
                    </button>
                  ) : (
                    <button className="connect-btn" onClick={connectMetamask}>
                      Connect Wallet
                    </button>
                  )}
                </div>
                <div className="row">
                  <div className="question-slider">
                    {quiz.length > 0 ? (
                      <img src={qSteps[TOTAL_PROBLEM - quiz.length + 1]} />
                    ) : (
                      <img src={qSteps[0]} />
                    )}
                  </div>
                </div>
                <div className="row">
                  <span className="question-text w-100 text-center m-auto">
                    {start && quiz.length > 0
                      ? quiz[currentQ].questionText
                      : "There are 5 questions per round."}
                  </span>
                </div>
              </div>
            </div>
            <div className="timer-container position-absolute bottom-0 mb-4">
              {quiz.length > 0 ? (
                <Timer
                  quetionNumber={TOTAL_PROBLEM - quiz.length + 1}
                  currentRound={currentRound}
                  stopTimer={stopTimer}
                  handleFailModal={handleFailModal}
                  start={start}
                />
              ) : (
                <img src={StoppedTimer} />
              )}
            </div>
          </BrowserView>
          <MobileView>
            <img className="w-100 h-375" src={BackgroundMobile} />
            <div className="header-content position-absolute top-0 container-fluid pt-3">
              <div className="row">
                <div className="question-slider">
                  {quiz.length > 0 ? (
                    <img src={qSteps[TOTAL_PROBLEM - quiz.length + 1]} />
                  ) : (
                    <img src={qSteps[0]} />
                  )}
                </div>
              </div>
              <div className="row">
                <div className="col-12 d-flex align-items-center justify-content-center">
                  <div className="level-container d-flex align-items-center justify-content-center text-center">
                    {currentRound === 0
                      ? "Start Game!"
                      : "Level " + currentRound}
                  </div>
                </div>
              </div>
              <div className="row mt-3">
                <span className="question-text w-100 text-center m-auto">
                  {start && quiz.length > 0
                    ? quiz[currentQ].questionText
                    : "There are 5 questions per round."}
                </span>
              </div>
            </div>
            <div className="timer-container position-absolute bottom-0 mb-0">
              {quiz.length > 0 ? (
                <Timer
                  quetionNumber={TOTAL_PROBLEM - quiz.length + 1}
                  currentRound={currentRound}
                  stopTimer={stopTimer}
                  handleFailModal={handleFailModal}
                  start={start}
                />
              ) : (
                <img src={StoppedTimer} />
              )}
            </div>
          </MobileView>
        </div>
        {/* End of the Header */}
        {/* Sidebar */}
        <div className="side-bar container-flud">
          <div className="row">
            <div className="black-side col-3"></div>
          </div>
        </div>
        <div className="quiz-body container-fluid">
          <BrowserView>
            <div className="row">
              <div className="col-lg-3 col-md-3 col-sm-12 col-xs-12 round-status-container">
                <div className="round-status">
                  Profit So Far
                  <div className="round-status-value">{totalScore}</div>
                </div>
                <div className="round-status">
                  Question is Worth
                  <div className="round-status-value">{aCoin}</div>
                </div>
                <div className="round-status">
                  Total Answered
                  <div className="round-status-value">{totalSuccess}</div>
                </div>
                {isAuthenticated && start && skipAvailable && (
                  <div className="round-status">
                    <button
                      className="next-btn"
                      onClick={() => {
                        skipPro();
                      }}
                      disabled={
                        currentSuccess === 5 ||
                        (currentSuccess === 4 && skip === 1)
                      }
                    >
                      Skip Question
                    </button>
                  </div>
                )}
              </div>
              <div className="col-lg-7 col-md-7 col-sm-12 col-xs-12 question-container">
                {start && quiz.length > 0 ? (
                  quiz[currentQ].answerOptions.map((_answer, index) => (
                    <button
                      className="question-btn"
                      key={index}
                      onClick={() => {
                        {
                          checkAnswer(_answer.isCorrect);
                        }
                      }}
                    >
                      {_answer.answerText}
                    </button>
                  ))
                ) : currentRound === 0 ? (
                  <button
                    className="connect-second-btn"
                    onClick={connectMetamask}
                  >
                    Please connect wallet to start playing.
                  </button>
                ) : currentSuccess === 5 ||
                  (currentSuccess === 4 && skip === 1) ? (
                  <>
                    <button
                      className="connect-second-btn"
                      onClick={continueRound}
                    >
                      Start Round{" "}
                      {currentRound === 5 ? "( Infinitive )" : currentRound + 1}
                      .
                    </button>

                    {!isClaimed && (
                      <div className="display-score-container">
                        <Badge pill bg="success">
                          {totalScore} $Lmonz coins collected
                        </Badge>
                      </div>
                    )}
                  </>
                ) : (
                  <button className="connect-second-btn" onClick={startAgain}>
                    Start Round{" "}
                    {currentRound === 6 ? currentRound - 1 : currentRound}.
                  </button>
                )}
              </div>
              <div className="col-lg-2 col-md-2 col-sm-12 col-xs-12 d-flex align-items-center justify-content-center">
                <img
                  src={LemonBtn}
                  onClick={goToScoreboard}
                  style={{ cursor: "pointer" }}
                />
              </div>
            </div>
          </BrowserView>
          <MobileView>
            <div className="row">
              <div className="col-lg-3 col-md-3 col-sm-12 col-xs-12 round-status-container">
                <div className="row footer-panel">
                  <div className="col-3">
                    {skipAvailable ? (
                      <img
                        src={SkipBtn}
                        className="w-100 skip-btn"
                        onClick={() => {
                          skipPro();
                        }}
                      />
                    ) : (
                      <img
                        src={SkipBtn}
                        className="w-100 skip-btn"
                        onClick={() => {
                          notify("info", "You can't use skip function now.");
                        }}
                      />
                    )}
                  </div>
                  <div className="col-9 display-score">
                    <div className="row">
                      <div className="col-6 px-1">
                        <div className="panel">
                          <span className="d-block label-balance profit">
                            Profit So Far
                          </span>
                          <div className="panel-container d-flex align-items-center justify-content-center m-auto text-white">
                            {totalScore}
                          </div>
                        </div>
                      </div>
                      <div className="col-6 px-1">
                        <div className="panel">
                          <span className="d-block label-balance worth">
                            Question Worth
                          </span>
                          <div className="panel-container d-flex align-items-center justify-content-center m-auto text-white">
                            {aCoin}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-7 col-md-7 col-sm-12 col-xs-12 question-container">
                {start && quiz.length > 0 ? (
                  quiz[currentQ].answerOptions.map((_answer, index) => (
                    <button
                      className="question-btn"
                      key={index}
                      onClick={() => {
                        {
                          checkAnswer(_answer.isCorrect);
                        }
                      }}
                    >
                      {_answer.answerText}
                    </button>
                  ))
                ) : currentRound === 0 ? (
                  <button
                    className="connect-second-btn"
                    onClick={connectWalletConnect}
                  >
                    Please connect wallet to start playing.
                  </button>
                ) : currentSuccess === 5 ||
                  (currentSuccess === 4 && skip === 1) ? (
                  <>
                    <button
                      className="connect-second-btn"
                      onClick={continueRound}
                    >
                      Start Round{" "}
                      {currentRound === 5 ? "( Infinitive )" : currentRound + 1}
                      .
                    </button>
                    {!isClaimed && (
                      <div className="display-score-container">
                        <Badge pill bg="success">
                          {totalScore} $Lmonz coins collected
                        </Badge>
                      </div>
                    )}
                  </>
                ) : (
                  <button className="connect-second-btn" onClick={startAgain}>
                    Start Round{" "}
                    {currentRound === 6 ? currentRound - 1 : currentRound}.
                  </button>
                )}
              </div>
            </div>
            <div className="col-lg-12 col-md-12 col-sm-12 col-xs-12 d-flex justify-content-center">
              <img
                src={LemonBtn}
                onClick={goToScoreboard}
                style={{ cursor: "pointer" }}
              />
            </div>
          </MobileView>
        </div>
        {/* The end of Sidebar */}
      </div>
    </>
  );
}

export default Home;
