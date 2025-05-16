import { player1Name, player2Name, tempName, startTournment, tournBoard } from './tournment';
import { gamesboard, winnerBoard, button1v1, tournment, aiButton } from './main';
import { game1v1 } from './game1v1';
import { startAiGame } from './ai';
import { paddel3, paddel4 } from './game';
// import { paddel3 , paddel4 } from "./game";

export function quit() {
  console.log('hello');
  paddel3.style.display = 'none';
  paddel4.style.display = 'none';
  player1Name.innerText = tempName.p1;
  player2Name.innerText = '';
  (tempName.p2 = ''),
    (tempName.p3 = ''),
    (tempName.p4 = ''),
    (tempName.winners[0] = ''),
    (tempName.winners[1] = ''),
    (tempName.winners[2] = '');
  winnerBoard.style.display = 'none';
  tournBoard.style.display = 'none';
  gamesboard.style.display = 'flex';
  button1v1.addEventListener('click', game1v1);
  aiButton.addEventListener('click', startAiGame);
  tournment.addEventListener('click', startTournment);
}
