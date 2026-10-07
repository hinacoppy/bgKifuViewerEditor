// BgKifuEditor_class.js
"use strict";

class BgKifuEditor {
  constructor(gametype = "normal") {
    const gameparam = BgUtil.getGametypeParam(gametype);
    this.ckrnum = gameparam[1]; //chequer num
    this.param0 = gameparam[0]; //my inner point = point num of one area
    this.param1 = this.param0 * 4 + 1; //array param of XGID position
    this.param2 = this.param0 * 4 + 2; //boff1
    this.param3 = this.param0 * 4 + 3; //boff2
    this.dicemx = gameparam[2]; //dice pip max

    this.xgid = new Xgid(null);
    this.board = new BgBoard("#board", false);
    this.board.showBoard2(this.xgid);
    this.kifuobj = new BgKifu(this, false);
    this.player = true; //true=player1, false=player2
    this.strictflg = true;
    this.animDelay = 500; //cube, dice
    this.animDelay2 = 200; //checker
    this.autoplay = false;
    this.curGameNo = 0;
    this.curRollNo = 0;
    this.score = [0, 0, 0];
    this.globalKifuData = [];

    this.setDomNames();
    this.createEditorHandlers();
    this.prepareFloatWindows();
    this.prepareKifuTable();
    this.makeDicelistTable();
    this.setEventHandler();
    this.setDraggableEvent();
    this.hideAllPanel();
    this.checkGithub(); //GitHubに公開しているときに使えない機能は見せない
    this.date.value = this.getToday();
    this.loadKifuDataFromQuery(); //クエリに棋譜データが設定されていればそれを読む
  } //end of constructor()

  setDomNames() {
    //button
    this.doublebtn   = document.getElementById("doublebtn");
    this.resignbtn   = document.getElementById("resignbtn");
    this.takebtn     = document.getElementById("takebtn");
    this.dropbtn     = document.getElementById("dropbtn");
    this.donebtn     = document.getElementById("donebtn");
    this.dicebtn     = document.getElementById("dicebtn");
    this.undobtn     = document.getElementById("undobtn");
    this.forcedbtn   = document.getElementById("forcedbtn");
    this.dancebtn    = document.getElementById("dancebtn");
    this.resignokbtn = document.getElementById("resignokbtn");
    this.resignclbtn = document.getElementById("resignclbtn");
    this.gameendbtn  = document.getElementById("gameendbtn");
    this.newgamebtn  = document.getElementById("newgamebtn");
//    this.rewindbtn   = document.getElementById("rewindbtn"); //現HTMLには存在しない(未使用のRewind機能の名残)。nullになるためイベント登録側でガードする
    this.fliphorizbtn= document.getElementById("fliphorizbtn");
    this.downloadbtn = document.getElementById("downloadbtn");
    this.diceAsBtn   = document.querySelectorAll("#dice10,#dice11,#dice20,#dice21");
    this.allowillegal= document.getElementById("allowillegal");
    this.pointTriangle = document.querySelectorAll(".point");
    this.analyseBtn  = document.getElementById("analyse");

    //infos
    this.site       = document.getElementById("site");
    this.date       = document.getElementById("date");
    this.player1    = document.getElementById("player1");
    this.player2    = document.getElementById("player2");
    this.player1inp = document.getElementById("player1inp");
    this.player2inp = document.getElementById("player2inp");
    this.score1     = document.getElementById("score1");
    this.score2     = document.getElementById("score2");
    this.pip1       = document.getElementById("pip1");
    this.pip2       = document.getElementById("pip2");
    this.matchlen   = document.getElementById("matchlen");
    this.matchlen1  = document.getElementById("matchlen1");
    this.matchlen2  = document.getElementById("matchlen2");
    this.actiondisp = document.getElementById("actiondisp");
    this.openingroll= document.getElementById("openingroll");
    this.newmatch   = document.getElementById("newmatch");
    this.analysisDisp = document.getElementById("analysisresult");

    //panel
    this.panelholder = document.getElementById("panelholder");
    this.allpanel    = document.querySelectorAll(".panel");
    this.rolldouble  = document.getElementById("rolldouble");
    this.doneundo    = document.getElementById("doneundo");
    this.gameend     = document.getElementById("gameend");
    this.takedrop    = document.getElementById("takedrop");
    this.resign      = document.getElementById("resign");

    //kifu input
    this.kifuTable      = document.getElementById("kifuTable"); //TableOperatorのコンストラクタに渡す生DOM要素
    this.kifuTableOp    = null; //prepareKifuTable()でTableOperatorインスタンスをセットする
    this.inputKifuFile  = document.getElementById("inputKifuFile");
    this.gameSelect     = document.getElementById("gameSelect");
    this.fileName       = document.getElementById("fileName");
    this.DnDArea        = document.getElementById("DnDArea");
    this.prevPlayBtn    = document.getElementById("prevPlayBtn");
    this.nextPlayBtn    = document.getElementById("nextPlayBtn");
    this.autoPlayBtn    = document.getElementById("autoPlayBtn");
    this.gameGoBtn      = document.getElementById("gameGoBtn");
    this.showinsert     = document.getElementById("showinsert");

    //chequer
    this.chequerall  = document.querySelectorAll(".chequer");
    //pick dice
    this.pickdice    = document.querySelectorAll(".pickdice"); //makeDicelistTable()呼び出し前なのでこの時点では空
    this.pickdicetable = document.getElementById("pickdicetable");
  }

  //Editorモード用イベントハンドラの実体をここで1回だけ作る(setEventHandlerForEditor/unsetEventHandlerForEditorで
  //同じ関数参照を使い回さないとremoveEventListener()が効かないため)
  createEditorHandlers() {
    this.editorHandlers = {
      undo:              (e) => { e.preventDefault(); this.undoAction(); },
      done:              (e) => { e.preventDefault(); this.doneAction(); },
      dice:              (e) => { e.preventDefault(); this.reselectDiceAction(); },
      resign:            (e) => { e.preventDefault(); this.resignAction(); },
      double:            (e) => { e.preventDefault(); this.doubleAction(); },
      take:              (e) => { e.preventDefault(); this.takeAction(); },
      drop:              (e) => { e.preventDefault(); this.dropAction(); },
      dance:             (e) => { e.preventDefault(); this.danceAction(); },
      gameend:           (e) => { e.preventDefault(); this.gameendAction(); },
      diceAsClick:       (e) => { e.preventDefault(); this.doneAction(); },
      diceAsContextmenu: (e) => { e.preventDefault(); this.undoAction(); },
      rewind:            (e) => { e.preventDefault(); this.rewindAction(); },
      matchlenChange:    (e) => { e.preventDefault(); this.changeMatchLengthAction(); },
      pickdiceClick:     (e) => { e.preventDefault(); this.pickDiceAction(e.currentTarget.id.slice(-2)); },
      pointMouseup:      (e) => { e.preventDefault(); this.pointClickAction(e); },
      resignOk:          (e) => { e.preventDefault(); this.resignOkAction(); },
      resignCancel:      (e) => { e.preventDefault(); this.resignCancelAction(); },
      forced:            (e) => { e.preventDefault(); this.forcedMoveAction(); },
      allowillegalChange:(e) => { e.preventDefault(); this.strictflg = !this.allowillegal.checked; },
      documentKeydown:   (e) => { this.keyInputAction(e.key); },
    };
  }

  prepareFloatWindows() {
    //モーダルウィンドウを準備
    this.panelActionWindow = new FloatWindow({
      hoverid:  "#panelholder",
      headid:   "#panelHeader",
      bodyid:   "#panelBody",
      maxbtn:   "#maxBtn",
      minbtn:   "#minBtn",
      closebtn: "#closeBtn",
      width:    "auto",
      height:   "35px",
      initshow: false,
    });

    this.panelNavWindow = new FloatWindow({
      hoverid:  "#panelNavHolder",
      headid:   "#panelNavHeader",
      bodyid:   "#panelNavBody",
      maxbtn:   "#maxNavBtn",
      minbtn:   "#minNavBtn",
      closebtn: "#closeNavBtn",
      width:    "auto",
      height:   "auto",
      top:      50,
      left:     window.innerWidth * 0.5,
      initshow: true,
    });

    this.panelInfoWindow = new FloatWindow({
      hoverid:  "#panelInfoHolder",
      headid:   "#panelInfoHeader",
      bodyid:   "#panelInfoBody",
      maxbtn:   "#maxInfoBtn",
      minbtn:   "#minInfoBtn",
      closebtn: "#closeInfoBtn",
      width:    "auto",
      height:   "auto",
      top:      5,
      left:     window.innerWidth * 0.5,
      initshow: true,
    });

    this.analyseWindow = new FloatWindow({
      hoverid:  '#analysis',
      headid:   '#analysisHeader',
      bodyid:   '#analysisBody',
      maxbtn:   '#maxBtnAnl',
      minbtn:   '#minBtnAnl',
      closebtn: '#closeBtnAnl',
      width:    '40%',
      height:   '450px',
      initshow: false,
    });
  }

  setEventHandler() {
    //Viewer、Editor両方で有効なイベント
    this.fliphorizbtn.addEventListener("click", (e) => { e.preventDefault(); this.flipHorizOrientationAction(); });
    this.downloadbtn. addEventListener("click", (e) => { e.preventDefault(); this.downloadKifuAction(); });
    window.  addEventListener("resize", (e) => { e.preventDefault(); this.board.redraw(true); });
    document.addEventListener("contextmenu", (e) => { e.preventDefault(); });
    this.newgamebtn. addEventListener("click", (e) => { e.preventDefault(); this.newGameAction(); });
    this.player1inp. addEventListener("change", (e) => { this.onchangeInfoAction(); });
    this.player2inp. addEventListener("change", (e) => { this.onchangeInfoAction(); });
    this.matchlen.   addEventListener("change", (e) => { this.onchangeInfoAction(); });

    this.setEventHandlerForKifuViewer();
  }

  setEventHandlerForEditor() {
    //Editorモードのときだけのイベント
    const h = this.editorHandlers;
    this.undobtn.       addEventListener("click", h.undo);
    this.donebtn.       addEventListener("click", h.done);
    this.dicebtn.       addEventListener("click", h.dice);
    this.resignbtn.     addEventListener("click", h.resign);
    this.doublebtn.     addEventListener("click", h.double);
    this.takebtn.       addEventListener("click", h.take);
    this.dropbtn.       addEventListener("click", h.drop);
    this.dancebtn.      addEventListener("click", h.dance);
    this.gameendbtn.    addEventListener("click", h.gameend);
    for (const el of this.diceAsBtn) {
      el.addEventListener("click", h.diceAsClick);
      el.addEventListener("contextmenu", h.diceAsContextmenu);
    }
//    if (this.rewindbtn) { this.rewindbtn.addEventListener("click", h.rewind); } //現HTMLには存在しないため念のためガード
    this.matchlen.      addEventListener("change", h.matchlenChange);
    for (const el of this.pickdice) { el.addEventListener("click", h.pickdiceClick); }
    for (const el of this.pointTriangle) { el.addEventListener("mouseup", h.pointMouseup); }
    this.resignokbtn.   addEventListener("click", h.resignOk);
    this.resignclbtn.   addEventListener("click", h.resignCancel);
    this.forcedbtn.     addEventListener("click", h.forced);
    this.allowillegal.  addEventListener("change", h.allowillegalChange);
    document.            addEventListener("keydown", h.documentKeydown);
  }

  unsetEventHandlerForEditor() {
    //Viewerモードのときはこれらのイベントは無効にする
    const h = this.editorHandlers;
    this.undobtn.       removeEventListener("click", h.undo);
    this.donebtn.       removeEventListener("click", h.done);
    this.dicebtn.       removeEventListener("click", h.dice);
    this.resignbtn.     removeEventListener("click", h.resign);
    this.doublebtn.     removeEventListener("click", h.double);
    this.takebtn.       removeEventListener("click", h.take);
    this.dropbtn.       removeEventListener("click", h.drop);
    this.dancebtn.      removeEventListener("click", h.dance);
    this.gameendbtn.    removeEventListener("click", h.gameend);
    for (const el of this.diceAsBtn) {
      el.removeEventListener("click", h.diceAsClick);
      el.removeEventListener("contextmenu", h.diceAsContextmenu);
    }
//    if (this.rewindbtn) { this.rewindbtn.removeEventListener("click", h.rewind); }
    this.matchlen.      removeEventListener("change", h.matchlenChange);
    for (const el of this.pickdice) { el.removeEventListener("click", h.pickdiceClick); }
    for (const el of this.pointTriangle) { el.removeEventListener("mouseup", h.pointMouseup); }
    this.resignokbtn.   removeEventListener("click", h.resignOk);
    this.resignclbtn.   removeEventListener("click", h.resignCancel);
    this.forcedbtn.     removeEventListener("click", h.forced);
    this.allowillegal.  removeEventListener("change", h.allowillegalChange);
    document.            removeEventListener("keydown", h.documentKeydown);
  }

  initGameOption() {
    this.matchLength = this.matchlen.value;
    this.score = [0,0,0];
    this.score1.textContent = 0;
    this.score2.textContent = 0;
  }

  beginNewGame(newmatch = false) {
    const initpos = "-b----E-C---eE---c-e----B-";
    this.xgid.initialize(initpos, newmatch, this.matchLength);
    this.board.showBoard2(this.xgid);
    this.showPipInfo(this.xgid);
    this.unsetChequerDraggable();
    this.openingrollflag = true;
//    this.hideAllPanel();
    this.showRollDoublePanel(true, this.openingrollflag);
//    if (!newmatch) { this.showActionStr(null, "<br><br>"); }
//    this.showActionStr(null, "Opening roll");
  }

  async rollAction(openroll = false) {
    const dice = this.dice;
    if (openroll) {
      this.player = (dice[0] > dice[1]);
      this.xgid.turn = BgUtil.cvtTurnGm2Xg(this.player);
//      this.gameFinished = false;
      this.openingrollflag = false;
    }
    this.xgid.dice = dice[2];
    this.xgid.usabledice = true;
    this.board.showBoard2(this.xgid);
//    this.hideAllPanel();
    this.showDoneUndoPanel();
//    this.kifuobj.pushKifuXgid(this.xgid.xgidstr);　//棋譜を記録するのはアニメーションの前
    this.clearXgidPosition();
    this.pushXgidPosition(this.xgid.xgidstr);
    await this.board.animateDice(this.animDelay);
    this.setChequerDraggable(this.player); //ドラッグできるようにするのはアニメーションの後
  }

  undoAction() {
    //ムーブ前のボードを再表示
    if (this.undoStack.length == 0) { return; }
    const xgidstr = this.popXgidPosition();
    this.xgid = new Xgid(xgidstr);
    this.xgid.usabledice = true;
    this.makeDiceList(this.xgid.dice);
    this.donebtn.disabled = (!this.xgid.moveFinished() && this.strictflg);
    this.forcedflg = this.xgid.isForcedMove();
    BgDomUtil.toggle(this.forcedbtn, this.forcedflg);
    this.forcedbtn.disabled = this.xgid.moveFinished();
    this.pushXgidPosition(this.xgid.xgidstr);
    this.board.showBoard2(this.xgid);
    this.setChequerDraggable(this.player);
  }

  doneAction() {
    //if (this.gameFinished) { return; } //KifuEditorではthis.gameFinishedは使わない
    if (this.xgid.isBearoffAll()) {
      this.bearoffAllAction();
      return;
    } // else
//    this.showActionStr(this.player, this.peepXgidPosition(), this.xgid.xgidstr);
    const action = this.kifuobj.getActionStr2(this.peepXgidPosition(), this.xgid.xgidstr);
    const beforeXgid = new Xgid(this.peepXgidPosition());
    this.setGlobalKifuData(beforeXgid, action, "roll");
    this.swapTurn();
    this.xgid.dice = "00";
    this.swapXgTurn();
    this.showPipInfo(this.xgid);
    this.board.showBoard2(this.xgid);
    this.unsetChequerDraggable();
//    this.hideAllPanel();
    this.showRollDoublePanel(this.player);
    this.allowillegal.checked = false;
    this.strictflg = true;
  }

  reselectDiceAction() {
    const xgidstr = this.popXgidPosition();
    this.xgid = new Xgid(xgidstr);
    this.xgid.dice = "00";
    this.board.showBoard2(this.xgid);
    this.unsetChequerDraggable();
//    this.hideAllPanel();
    this.showRollDoublePanel(this.player);
  }

  async doubleAction() {
    if (!this.canDouble(this.player)) { return; }
//    this.showActionStr(this.player, "Doubles => " + Math.pow(2, this.xgid.cube + 1));
    this.swapTurn();
    this.xgid.dbloffer = true;
    this.board.showBoard2(this.xgid); //double offer
    const action = "Doubles => " + Math.pow(2, this.xgid.cube + 1);
    this.setGlobalKifuData(this.xgid, action, "double");
//    this.hideAllPanel();
    this.showTakeDropPanel();
//    this.kifuobj.pushKifuXgid(this.xgid.xgidstr); //棋譜を記録するのはアニメーションの前
    this.swapXgTurn(); //XGのturnを変えるのは棋譜用XGID出力後
    this.setButtonEnabled(this.takebtn, false); //アニメーションしているときはTakeボタンは押せない
    await this.board.animateCube(this.animDelay); //キューブを揺すのはshowBoard()の後
    this.setButtonEnabled(this.takebtn, true);
  }

  takeAction() {
//    this.showActionStr(this.player, "Takes");
    this.swapTurn();
    this.xgid.dice = "00";
    this.xgid.cubepos = this.xgid.turn;
    this.xgid.cube += 1; //キューブの値を変えるのはglobalKifuData設定前で画面表示前
//    this.kifuobj.pushKifuXgid(this.xgid.xgidstr);
    this.setGlobalKifuData(this.xgid, " Takes", "take");
    this.board.showBoard2(this.xgid);
    this.swapXgTurn(); //XGのturnを変えるのは棋譜用XGID出力後
//    this.hideAllPanel();
    this.showRollDoublePanel(this.player);
  }

  dropAction() {
//    this.showActionStr(this.player, "Drops");
    this.swapTurn();
    this.calcScore(this.player); //dblofferフラグをリセットする前に計算する必要あり
    this.xgid.dbloffer = false;
    this.board.showBoard2(this.xgid);
    this.setGlobalKifuData(this.xgid, " Drops", "drop");
//    this.kifuobj.pushKifuXgid(this.xgid.xgidstr);
//    this.hideAllPanel();
    this.showGameEndPanel(this.player);
//    this.gameFinished = true;
  }

  danceAction() {
    this.xgid.dice = "66";
    this.clearXgidPosition();
    this.pushXgidPosition(this.xgid.xgidstr);
//    this.kifuobj.pushKifuXgid(this.xgid.xgidstr);
    this.doneAction();
  }

  gameendAction() {
//    this.hideAllPanel();
    this.showScoreInfo();
    const action = "wins " + this.gameEndScore + " point";
    this.xgid.turn = BgUtil.cvtTurnGm2Xg(this.player); //this.player is winner
    this.xgid.dice = "00";
    this.setGlobalKifuData(this.xgid, action, "gameend");
//    this.kifuobj.pushKifuXgid(""); //空行
    //if (!this.matchwinflg) { this.beginNewGame(false); } //まだ続けられるなら
    this.setIntoViewerMode();
  }

  bearoffAllAction() {
//    this.showActionStr(this.player, this.peepXgidPosition(), this.xgid.xgidstr);
    this.calcScore(this.player); // this.player is winner
    const action = this.kifuobj.getActionStr2(this.peepXgidPosition(), this.xgid.xgidstr);
    const beforeXgid = new Xgid(this.peepXgidPosition());
    this.setGlobalKifuData(beforeXgid, action, "roll");
//    this.kifuobj.pushKifuXgid(this.xgid.xgidstr);
//    this.hideAllPanel();
    this.showGameEndPanel(this.player);
//    this.gameFinished = true;
  }

  newGameAction() {
    const newmatchflag = this.newmatch.checked;
    const kifudatalength = this.globalKifuData.length;
    if (newmatchflag) {
      if (kifudatalength != 0) {
        if (!confirm("Really New Match?")) { return; }
      }
      this.initGameOption();
      this.newmatch.checked = false;
    } else {
      if (kifudatalength == 0) {
        alert("You cannot begin without New match flag.");
        return;
      }
    }

    this.beginNewGameEditor(newmatchflag);
//    this.kifuobj.clearKifuXgid();
//    this.actiondisp.innerHTML = "";
//    this.panelInfoWindow.min();
    this.beginNewGame(newmatchflag);
  }

  ZZZrewindAction() {
    const last0xgid = this.kifuobj.peepKifuXgid(0);
    const last1xgid = this.kifuobj.peepKifuXgid(1);
    if (!last0xgid || !last1xgid) { return; } //rewindで戻せるのは空行で区切られたゲーム境界まで
                                //known bug:オープニングロールの出目は巻き戻せない
    const getDice   = ((xgidstr) => { const s = xgidstr.split(":"); return s[4]; }); //utility function
    const getPlayer = ((xgidstr) => { const s = xgidstr.split(":"); return (s[3] == 1); });

    const dice = getDice(last1xgid);
    if (dice == "00") { //rewind cube action
      //二つ前の履歴がtakeアクションだったときは、三つ前のダブルオファーのxgidを取り出す
      const dummy1 = this.kifuobj.popKifuXgid(); //ignore (dice=xx)
      const dummy2 = this.kifuobj.popKifuXgid(); //ignore (dice=00)
      const doubleofferxgid = this.kifuobj.popKifuXgid(); //double offer xgid (dice=D)
      this.player = getPlayer(doubleofferxgid);
      this.showActionStr(this.player, "Rewind Cube Action");
      this.xgid = new Xgid(doubleofferxgid);
      this.doubleAction();
    } else { //rewind checker action
      let lastxgid = this.kifuobj.popKifuXgid();
      if (this.xgid.moveFinished()) {
        this.kifuobj.pushKifuXgid(lastxgid);
        //Doneボタンが押せる状態になっているときは単純なundoActionとして動かすため、pop/pushして履歴を残す
      } else {
        lastxgid = last1xgid;
        //doubleAction()でpushされるダブルオファーの履歴(dice=D)をスキップするため、一つ前のxgidを使う
        //上記でpopしたlastxgidは捨てる
      }
      this.player = getPlayer(lastxgid);
      this.showActionStr(this.player, "Rewind " + getDice(lastxgid));
      this.clearXgidPosition();
      this.pushXgidPosition(lastxgid); //rollActionした状態にしてundoActionに渡す
//      this.hideAllPanel();
      this.showDoneUndoPanel();
      this.undoAction();
    }
  }

  flipHorizOrientationAction() {
    this.board.flipHorizFlag();
    this.board.flipHorizOrientation();
    this.board.redraw();
  }

  pickDiceAction(dice) {
    const dice1 = Number(dice.slice(0, 1));
    const dice2 = Number(dice.slice(1, 2));
    const dice3 = (dice1 < dice2) ? dice2 + "" + dice1 : dice; //ダイスは降順に並べる
    this.dice = [dice1, dice2, dice3];
    this.makeDiceList(dice3);

    if (this.openingrollflag && dice1 == dice2) { return; } //オープニングロールはゾロ目を選べない
    this.rollAction(this.openingrollflag);
  }

  makeDiceList(dice) {
    const dice1 = Number(dice.slice(0, 1));
    const dice2 = Number(dice.slice(1, 2));
    if      (dice1 == dice2) { this.dicelist = [dice1, dice1, dice1, dice1]; }
    else if (dice1 <  dice2) { this.dicelist = [dice2, dice1]; } //大きい順
    else                     { this.dicelist = [dice1, dice2]; }
  }

  keyInputAction(key) {
    switch(this.panelshowing) {
    case "rolldouble": //ダイスロール時は、123456dを受け付ける
      if (["1", "2", "3", "4", "5", "6"].includes(key)) {
        this.keyBuffer += key;
        if (this.keyBuffer.length == 2) {
          this.pickDiceAction(this.keyBuffer);
        }
      } else if (key == "d") {
        this.doubleAction();
      } else {
        this.keyBuffer = ""; //それ以外のキーが押されたらバッファをクリア
      }
      break;
    case "doneundo": //done undo時は、Enter, Space, Esc, r を受け付ける
      if (key == "Enter" || key == " ") {
        if (this.xgid.moveFinished()) { //押せるのはムーブ完了時のみ
          //known bug:forcedMoveの後はthis.xgid.moveFinished()がfalseを返すのでEnterが押せない。マウス操作で対応できるので放置
          this.doneAction();
        }
      } else if (key == "Escape") {
        this.undoAction();
      } else if (this.forcedflg && key == "f") { //フォーストのときは f を受け付ける
        this.forcedMoveAction();
      } else if (key == "r") { //r は出目の再選択
        this.reselectDiceAction();
      }
      break;
    case "takedrop": //take dropは、t p を受け付ける
      if (key == "t") {
        this.takeAction();
      } else if (key == "p") {
        this.dropAction();
      }
      break;
    default:
      break;
    }
  }

  resignAction() {
//    this.hideAllPanel();
    this.showResignPanel();
  }

  resignOkAction() {
//    this.showActionStr(this.player, "Resign");
    this.swapTurn();
    this.xgid.dice = "00";
    this.calcScore(this.player, true); //第2引数が true のときはリザイン
    this.board.showBoard2(this.xgid);
    const resign = ["", "Single", "Gammon", "BGammon"];
    const action = " Resign " + resign[this.gamescore[1]];
    this.setGlobalKifuData(this.xgid, action, "resign");
//    this.kifuobj.pushKifuXgid(this.xgid.xgidstr);
//    this.hideAllPanel();
    this.showGameEndPanel(this.player);
//    this.gameFinished = true;
  }

  resignCancelAction() {
//    this.hideAllPanel();
    this.showRollDoublePanel(this.player);
  }

  forcedMoveAction() {
    this.donebtn.disabled = false;
    this.forcedbtn.disabled = true;
    const afterxgidstr = this.xgid.getForcedMovedXgid();
    this.xgid = new Xgid(afterxgidstr);
    this.board.showBoard2(this.xgid);
  }

  changeMatchLengthAction() {
    this.matchLength = this.matchlen.value;
    const matchlenstr = this.matchLength == 0 ? "$" : this.matchLength;
    this.matchlen1.textContent = matchlenstr;
    this.matchlen2.textContent = matchlenstr;
    this.xgid.matchsc = this.matchLength;
  }

  showPipInfo(xgid) {
    this.pip1.textContent = xgid.get_pip(+1);
    this.pip2.textContent = xgid.get_pip(-1);
  }

  showScoreInfo() {
    const cfplayer = this.xgid.getCrawfordPlayer();
    const sc1 = this.xgid.sc_me + ((cfplayer == +1) ? "*" : "");
    const sc2 = this.xgid.sc_yu + ((cfplayer == -1) ? "*" : "");
    this.score1.textContent = sc1;
    this.score2.textContent = sc2;
  }

  showScoreInfo2(xgid) {
    const cfplayer = xgid.getCrawfordPlayer();
    const sc1 = xgid.sc_me + ((cfplayer == +1) ? "*" : "");
    const sc2 = xgid.sc_yu + ((cfplayer == -1) ? "*" : "");
    this.score1.textContent = sc1;
    this.score2.textContent = sc2;
  }

  ZZZshowActionStr(obj0, obj1, obj2 = null) {
    const player = (obj0 === null) ? "" : (obj0 ? "<br>Bl " : "<br>Wh ");
    const action = (obj2 === null) ? obj1 : this.kifuobj.getActionStr(obj1, obj2);
    this.actiondisp.insertAdjacentHTML("beforeend", player + action);
    this.actiondisp.scrollTo(0, this.actiondisp.scrollHeight);
  }

  calcScore(player, resignflag = false) {
    const resignscore = Number(document.querySelector("input[name='resign']:checked").value);
    this.score = [0, this.xgid.sc_me, this.xgid.sc_yu]; //ここでセットしないとリザイン時のスコアがおかしくなる
    this.gamescore = this.xgid.get_gamesc( BgUtil.cvtTurnGm2Xg(player) );
    const w = BgUtil.cvtTurnGm2Bd( player);
    const l = BgUtil.cvtTurnGm2Bd(!player);
    this.gamescore[1] = (resignflag && resignscore != 0) ? resignscore : this.gamescore[1];
    const scr = this.gamescore[0] * this.gamescore[1];
    this.xgid.crawford = this.xgid.checkCrawford(this.score[w], scr, this.score[l]);
    this.score[w] += scr;
    this.xgid.sc_me = this.score[1];
    this.xgid.sc_yu = this.score[2];
    this.matchwinflg = (this.matchLength != 0) && (this.score[w] >= this.matchLength);
    this.gameEndScore = scr;
  }

  canDouble(player) {
    return !this.xgid.crawford && (this.xgid.cubepos == 0) || (this.xgid.cubepos == this.xgid.turn);
  }

  showTakeDropPanel() {
    this.hideAllPanel();
    this.showElement(this.takedrop);
    this.panelshowing = "takedrop";
  }

  showRollDoublePanel(player, openroll = false) {
    this.hideAllPanel();
    BgDomUtil.toggle(this.doublebtn, !openroll);
    this.doublebtn.disabled = !this.canDouble(player);
    BgDomUtil.toggle(this.resignbtn, !openroll);
    BgDomUtil.toggle(this.openingroll, openroll);

    const closeout = this.isCloseout(player);
    BgDomUtil.toggle(this.pickdicetable, !closeout); //ダイス一覧かpassボタンのどちらかを表示
    BgDomUtil.toggle(this.dancebtn, closeout);

    const col1 = openroll ? "blue"  : (player ? "blue" : "white");
    const col2 = openroll ? "white" : (player ? "blue" : "white");
    const col1bg = (col1 == "blue") ? "white" : "black";
    const col2bg = (col2 == "blue") ? "white" : "black";
    document.querySelectorAll(".turn1").forEach((el) => { el.style.stroke = col1bg; el.style.fill = col1; });
    document.querySelectorAll(".turn2").forEach((el) => { el.style.stroke = col2bg; el.style.fill = col2; });
    this.showElement(this.rolldouble);
    this.keyBuffer = "";
    this.panelshowing = "rolldouble";
  }

  showDoneUndoPanel() {
    this.hideAllPanel();
    this.donebtn.disabled = (!this.xgid.moveFinished() && this.strictflg);
    this.forcedflg = this.xgid.isForcedMove(); //rewindAction()時にも呼ばれるため、rollAction()ではなくここで確認
    BgDomUtil.toggle(this.forcedbtn, this.forcedflg);
    this.forcedbtn.disabled = this.xgid.moveFinished();
    this.showElement(this.doneundo);
    this.panelshowing = "doneundo";
  }

  makeGameEndPanel(player) {
    //const playername = player ? this.player1.value : this.player2.value;
    const playername = player ? this.playername[1] : this.playername[2];
    const mes1 = playername + " WIN" + ((this.matchwinflg) ? "<br>and the MATCH" : "");
    const mes1dash = "You WIN" + ((this.matchwinflg) ? " and the MATCH" : "");
//    this.showActionStr(player, mes1dash);
    this.gameend.querySelector(".mes1").innerHTML = mes1;

    const winlevel = ["", "SINGLE", "GAMMON", "BACK GAMMON"];
    const res = winlevel[this.gamescore[1]];
    const mes2 = "Get " + this.gamescore[0] * this.gamescore[1] + "pt (" + res + ")";
//    this.showActionStr(player, mes2);
    this.gameend.querySelector(".mes2").textContent = mes2;

    const matchlengthinfo = this.matchLength == 0 ? "unlimited game" : this.matchLength + "pt";
    const mes3 = this.score[1] + " - " + this.score[2] + " (" + matchlengthinfo + ")";
//    this.showActionStr(player, mes3);
    this.gameend.querySelector(".mes3").innerHTML = mes3;
  }

  showGameEndPanel(player) {
    this.hideAllPanel();
    this.makeGameEndPanel(player);
//    const btnmsg = this.matchwinflg ? "<i class='fas fa-check-circle'></i> Ok"
//                                    : "<i class='fas fa-arrow-alt-circle-right'></i> Next";
    const btnmsg = "<i class='fas fa-check-circle'></i> Ok";
    this.gameendbtn.innerHTML = btnmsg;
    this.showElement(this.gameend);
  }

  showResignPanel() {
    this.hideAllPanel();
    this.showElement(this.resign);
  }

  hideAllPanel() {
    this.allpanel.forEach((el) => BgDomUtil.hide(el));
    this.panelActionWindow.max();
    this.panelshowing = "none";
  }

  showElement(elem) {
    BgDomUtil.show(elem);
    const width = BgDomUtil.outerWidth(elem, true);
    const height = BgDomUtil.outerHeight(elem, true);
    this.panelholder.style.width = width + "px";
    this.panelholder.style.height = (height + 35) + "px";
  }

  pushXgidPosition(xgidstr) {
   this.undoStack.push(xgidstr);
  }

  popXgidPosition() {
    return this.undoStack.pop();
  }

  peepXgidPosition() {
    return this.undoStack[this.undoStack.length - 1];
  }

  clearXgidPosition() {
   this.undoStack = [];
  }

  swapTurn() {
    this.player = !this.player;
  }

  swapXgTurn() {
    this.xgid.turn = -1 * this.xgid.turn;
  }

  isCloseout(player) {
    const xgturn = BgUtil.cvtTurnGm2Xg(!player); //クローズアウトを確認するのは相手側
    return this.xgid.isCloseout(xgturn);
  }

  setButtonEnabled(button, enable) {
    button.disabled = !enable;
  }

  getToday(separator = true) {
    const date = new Date();
    const year = date.getFullYear();
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    const datestr = separator ? year + "-" + month + "-" + day : year + month + day;
    return datestr;
  }

  setDraggableEvent() {
    //関数内広域変数
    var x;//要素内のクリックされた位置
    var y;
    var dragobj; //ドラッグ中のオブジェクト
    var zidx; //ドラッグ中のオブジェクトのzIndexを保持

    //この関数内の処理は、パフォーマンスのため jQuery Free で記述

    //ドラッグ開始時のコールバック関数
    const evfn_dragstart = ((origevt) => {
      origevt.preventDefault();
      dragobj = origevt.currentTarget; //dragする要素を取得し、広域変数に格納
      if (!dragobj.classList.contains("draggable")) {
        //相手チェッカーのときはそこにポイントオンする(できるときは)
        const position = { //オブジェクトの位置
              left: dragobj.offsetLeft,
              top:  dragobj.offsetTop
            };
        //オブジェクト(チェッカー)の位置からポイント番号を得る
        const point = this.board.getDragEndPoint(position, 1); //下側プレイヤーから見たポイント番号
        this.makeBlockPointAction(point); //そこにブロックポイントを作る
        return;
      }

      dragobj.classList.add("dragging"); //drag中フラグ(クラス追加/削除で制御)
      zidx = dragobj.style.zIndex;
      dragobj.style.zIndex = 999;

      //マウスイベントとタッチイベントの差異を吸収
      const event = (origevt.type === "mousedown") ? origevt : origevt.changedTouches[0];

      //要素内の相対座標を取得
      x = event.pageX - dragobj.offsetLeft;
      y = event.pageY - dragobj.offsetTop;

      //イベントハンドラを登録
      document.body.addEventListener("mousemove",  evfn_drag,    {passive:false});
      document.body.addEventListener("mouseleave", evfn_dragend, false);
      dragobj.      addEventListener("mouseup",    evfn_dragend, false);
      document.body.addEventListener("touchmove",  evfn_drag,    {passive:false});
      document.body.addEventListener("touchleave", evfn_dragend, false);
      document.body.addEventListener("touchend",   evfn_dragend, false);

      const position = { //dragStartAction()に渡すオブジェクトを作る
              left: dragobj.offsetLeft,
              top:  dragobj.offsetTop
            };
      this.dragStartAction(origevt, position);
    });

    //ドラッグ中のコールバック関数
    const evfn_drag = ((origevt) => {
      origevt.preventDefault(); //フリックしたときに画面を動かさないようにデフォルト動作を抑制

      //マウスイベントとタッチイベントの差異を吸収
      const event = (origevt.type === "mousemove") ? origevt : origevt.changedTouches[0];

      //マウスが動いた場所に要素を動かす
      dragobj.style.top  = event.pageY - y + "px";
      dragobj.style.left = event.pageX - x + "px";
    });

    //ドラッグ終了時のコールバック関数
    const evfn_dragend = ((origevt) => {
      origevt.preventDefault();
      dragobj.classList.remove("dragging"); //drag中フラグを削除
      dragobj.style.zIndex = zidx;

      //イベントハンドラの削除
      document.body.removeEventListener("mousemove",  evfn_drag,    false);
      document.body.removeEventListener("mouseleave", evfn_dragend, false);
      dragobj.      removeEventListener("mouseup",    evfn_dragend, false);
      document.body.removeEventListener("touchmove",  evfn_drag,    false);
      document.body.removeEventListener("touchleave", evfn_dragend, false);
      document.body.removeEventListener("touchend",   evfn_dragend, false);

      const position = { //dragStopAction()に渡すオブジェクトを作る
              left: dragobj.offsetLeft,
              top:  dragobj.offsetTop
            };
      this.dragStopAction(position);
    });

    //dragできるオブジェクトにdragstartイベントを設定
    for(const elm of this.chequerall) {
      elm.addEventListener("mousedown",  evfn_dragstart, false);
      elm.addEventListener("touchstart", evfn_dragstart, false);
    }
  }

  dragStartAction(event, position) {
    this.mouseRbtnFlg = (event.button != 0); //主ボタン(左)のときだけfalse
    this.dragObject = event.currentTarget; //dragStopAction()で使うがここで取り出しておかなければならない
    const id = event.currentTarget.id;
    this.dragStartPt = this.board.getDragStartPoint(id, BgUtil.cvtTurnGm2Bd(this.player));
    this.dragStartPos = position;
    this.flashOnMovablePoint(this.dragStartPt);
  }

  checkDragEndPt(xg, dragstartpt, dragendpt) {
    let endpt = dragendpt;
    let ok = false;

    if (dragstartpt == dragendpt) {
      //同じ位置にドロップ(＝クリック)したときは、ダイスの目を使ったマスに動かす
      if (this.mouseRbtnFlg) { this.dicelist.reverse(); }　//右クリックのときは小さい目から使う
      for (let i = 0; i < this.dicelist.length; i++) {
        //ダイス目でピッタリに上がれればその目を使って上げる
        const endptwk = this.dicelist.includes(dragstartpt) ? dragstartpt - this.dicelist[i]
                                                            : Math.max(dragstartpt - this.dicelist[i], 0);
        if (xg.isMovable(dragstartpt, endptwk)) {
          this.dicelist.splice(i, 1);
          endpt = endptwk;
          ok = true;
          break;
        }
      }
      if (this.mouseRbtnFlg) { this.dicelist.reverse(); } //元に戻す
    } else {
      if (this.strictflg) {
        //ドロップされた位置が前後 1pt の範囲であれば OK とする。せっかちな操作に対応
        const ok0 = xg.isMovable(dragstartpt, dragendpt);
        const ok1 = xg.isMovable(dragstartpt, dragendpt + 1);
        const ok2 = xg.isMovable(dragstartpt, dragendpt - 1);
        if      (ok0)         { endpt = dragendpt;     ok = true; } //ちょうどの目にドロップ
        else if (ok1 && !ok2) { endpt = dragendpt + 1; ok = true; } //前後が移動可能な時は進めない
        else if (ok2 && !ok1) { endpt = dragendpt - 1; ok = true; } //ex.24の目で3にドロップしたときは進めない
      } else {
        //イリーガルムーブを許可したとき
        endpt = dragendpt;
        ok = (dragstartpt > dragendpt) && !this.xgid.isBlocked(dragendpt); //掴んだマスより前でブロックポイントでなければtrue
      }
      //D&Dで動かした後クリックで動かせるようにダイスリストを調整しておく
      for (let i = 0; i < this.dicelist.length; i++) {
        if (this.dicelist[i] == (dragstartpt - endpt)) {
          this.dicelist.splice(i, 1);
          break;
        }
      }
    }
    return [endpt, ok];
  }

  dragStopAction(position) {
    this.flashOffMovablePoint();
    const dragendpt = this.board.getDragEndPoint(position, BgUtil.cvtTurnGm2Bd(this.player));

    let ok;
    [this.dragEndPt, ok] = this.checkDragEndPt(this.xgid, this.dragStartPt, dragendpt);
    const hit = this.xgid.isHitted(this.dragEndPt);

    if (ok) {
      if (hit) {
        const movestr = this.dragEndPt + "/" + this.param1;
        this.xgid = this.xgid.moveChequer2(movestr);
      }
      const movestr = this.dragStartPt + "/" + this.dragEndPt;
      this.xgid = this.xgid.moveChequer2(movestr);
      this.board.showBoard2(this.xgid);
    } else {
      BgDomUtil.animatePos(this.dragObject, this.dragStartPos, this.animDelay2);
    }
    this.setChequerDraggable(this.player);
    this.donebtn.disabled = (!this.xgid.moveFinished() && this.strictflg);
  }

  unsetChequerDraggable() {
    this.chequerall.forEach((el) => el.classList.remove("draggable"));
  }

  setChequerDraggable(player) {
    this.unsetChequerDraggable();
    const plyr = BgUtil.cvtTurnGm2Bd(player);
    for (let i = 0; i < this.ckrnum; i++) {
      const pt = this.board.chequer[plyr][i].point;
      if (pt == this.param2 || pt == this.param3) { continue; }
      this.board.chequer[plyr][i].dom.classList.add("draggable"); //.domはSVG化に伴い生DOM要素に変更済み
    }
  }

  flashOnMovablePoint(startpt) {
    if (!this.strictflg) { return; }
    let dest2 = [];
    const destpt = this.xgid.movablePoint(this.dragStartPt, this.strictflg);
    if (this.player) { dest2 = destpt; }
    else {
      for (const p of destpt) {
        const pt = (p == 0) ? 0 : this.param1 - p;
        dest2.push(pt);
      }
    }
    this.board.flashOnMovablePoint(dest2, BgUtil.cvtTurnGm2Bd(this.player));
  }

  flashOffMovablePoint() {
    this.board.flashOffMovablePoint();
  }

  pointClickAction(event) {
    this.mouseRbtnFlg = (event.button != 0);
    const id = event.currentTarget.id;
    const pt = parseInt(id.substring(2));
    const chker = this.board.getChequerOnDragging(pt, BgUtil.cvtTurnGm2Bd(this.player));

    if (chker) { //そのポイントにチェッカーがあればそれを動かす
      this.moveCheckerAction(chker);
    } else { //そのポイントにチェッカーがなければ
      this.makeBlockPointAction(pt); //そこに向かって動かせる2枚を使ってブロックポイントを作る
    }
  }

  moveCheckerAction(checker) {
    const checkerdom = checker.dom; //.domはSVG化に伴い生DOM要素に変更済み(以前はjQueryオブジェクトで[0]で取り出していた)
    const position = { //dragStopAction()に渡すオブジェクトを作る
            left: parseInt(checkerdom.style.left),
            top:  parseInt(checkerdom.style.top)
          };
    this.dragObject = checker.dom; //以前は$(checker.domid)で"#"が抜けており常に空のjQueryオブジェクトになっていた
    this.dragStartPt = this.board.getDragEndPoint(position, BgUtil.cvtTurnGm2Bd(this.player));
    this.dragStopAction(position);
  }

  makeBlockPointAction(pointto) {
    if (this.dicelist.length < 2) {
      return; //使えるダイスが２個以上なければ何もしない
    }

    this.mouseRbtnFlg = false; //このルーチンではダイスの大きい目から使う(右クリックを無視する)
    const pointfr1 = this.player ? (pointto + this.dicelist[0]) : (pointto - this.dicelist[0]);
    const pointfr2 = this.player ? (pointto + this.dicelist[1]) : (pointto - this.dicelist[1]);

    const ptno1  = this.xgid.get_ptno (pointfr1);
    const ptcol1 = this.xgid.get_ptcol(pointfr1);
    const ptno2  = this.xgid.get_ptno (pointfr2);
    const ptcol2 = this.xgid.get_ptcol(pointfr2);
    const ptno3  = this.xgid.get_ptno (pointto);
    const ptcol3 = this.xgid.get_ptcol(pointto);
    const chkrnum = this.dicelist[0] == this.dicelist[1] ? 2 : 1; //ゾロ目のときは元ポイントに2個以上なければならない
    const ismovablefr = (ptno1 >= chkrnum && ptcol1 == BgUtil.cvtTurnGm2Xg(this.player) &&
                         ptno2 >= chkrnum && ptcol2 == BgUtil.cvtTurnGm2Xg(this.player)); //動かせるチェッカーがあるかどうか
    const ismovableto = (ptno3 == 0 || (ptno3 == 1 && ptcol3 == BgUtil.cvtTurnGm2Xg(!this.player))); //空かブロットかどうか

    if (!(ismovablefr && ismovableto)) {
      return; //動かせるチェッカーが２つない、または、動かし先が空あるいはブロットでなければ何もしない
    }

    //１つ目のチェッカーを動かす
    const chker1 = this.board.getChequerOnDragging(pointfr1, BgUtil.cvtTurnGm2Bd(this.player));
    this.moveCheckerAction(chker1);

    //２つ目のチェッカーを動かす
    const chker2 = this.board.getChequerOnDragging(pointfr2, BgUtil.cvtTurnGm2Bd(this.player));
    this.moveCheckerAction(chker2);
  }

  makeDicelistTable() {
    let dicelist = "";

    for (let i = 1; i <= 6; i++) {
      dicelist += "<tr>\n"
      for (let j = 1; j <= 6; j++) {
        const id = "pickdice" + i + "" + j;
        const cls1 = (i >= j) ? "turn1 " : "turn2 ";
        const cls2 = (i >  j) ? "turn1 " : "turn2 ";
        const dice1 = this.board.svgDice[i].replace('class="', 'class="' + cls1);
        const dice2 = this.board.svgDice[j].replace('class="', 'class="' + cls2);

        dicelist += "<td id='" + id + "' class='pickdice'>\n";
        dicelist += dice1;
        dicelist += dice2;
        dicelist += "</td>\n";
      }
      dicelist += "</tr>\n"
    }
    this.pickdicetable.innerHTML = dicelist;
    this.pickdice = document.querySelectorAll(".pickdice"); //ここで定義しないと有効にならない
  }


//★★ここからKifuViewerのコード
  prepareKifuTable() {
    const options = { //TableOperator config
      clickToSelect: true,
      singleSelect: true,
      height: 200,
      onRowSelect: (row) => { //テーブル行をクリック/チェックしたときにその手番の閲覧モードに切り替える
        this.curRollNo = row.no - 1;
        this.setIntoViewerMode();
      },
    };
    this.kifuTableOp = new TableOperator(this.kifuTable, this.getKifuTableColumns(), options);
  }

  getKifuTableColumns() {
    const operateEvents = {
      "click .edit": (e, value, row, index) => {
        this.execEditButtonAction(e, value, row, index);
      },
      "click .insert": (e, value, row, index) => {
        this.execInsertButtonAction(e, value, row, index);
      },
      "click .delete": (e, value, row, index) => {
        this.execDeleteButtonAction(e, value, row, index);
      }
    };

    //イリーガルムーブの行は赤、それ以降の局面が信頼できない行は黄色で表示する
    //(共有のTableOperatorには行スタイル機能がないため、セルのformatterで実現)
    const illegalFormatter = (value, row) => {
      const text = value ?? "";
      if (row.illegal) {
        return '<div style="background-color:#fdd; color:#a00; font-weight:bold;">' + text + '</div>';
      } else if (row.unreliable) {
        return '<div style="background-color:#ffc; color:#860;">' + text + '</div>';
      } else {
        return text;
      }
    };

    const columns = [
      { field: "check",
        checkbox: true,
      },
      { title: "No",
        field: "no",
        visible: false,
      },
      { title: "No",
        field: "dispno",
        formatter: illegalFormatter,
      },
      { title: "Player",
        field: "player",
        formatter: illegalFormatter,
      },
      { title: "Dice",
        field: "dice",
        formatter: illegalFormatter,
      },
      { title: "Action",
        field: "action",
        formatter: illegalFormatter,
      },
      { title: "Edit",
        events: operateEvents,
        formatter: "<button class='edit'>Edit</button>",
      },
      { title: "Ins/Del",
        field: "insert",
        events: operateEvents,
        formatter: "<button class='insert'>Ins</button><button class='delete'>Del</button>",
        visible: false,
      },
    ];
    return columns;
  }

  execEditButtonAction(e, value, row, index) {
    this.switchViewerEditorMode(false);
    this.curRollNo = index;
    this.checkOnKifuRow(this.curRollNo);
    const xgid = this.globalKifuData[row.gameno].playObject[index].xgid;
    this.editCurrentPosition(row.mode, xgid);
  }

  editCurrentPosition(mode, xgid) {
    this.xgid = new Xgid(xgid);
    this.player = BgUtil.cvtTurnXg2Gm(this.xgid.turn);
    switch(mode) {
    case "roll":
      this.xgid.dice = "00";
      this.showPipInfo(this.xgid);
      this.board.showBoard2(this.xgid);
      this.unsetChequerDraggable();
//      this.hideAllPanel();
      const openingroll = (this.xgid.turn == 0);
      this.showRollDoublePanel(this.player, openingroll);
      break;
    case "offer":
      this.xgid.cubepos = 0;
      this.doubleAction();
      break;
    case "take":
    case "drop":
//      this.hideAllPanel();
      this.showTakeDropPanel();
      break;
    case "gameend":
//      this.hideAllPanel();
      this.showGameEndPanel();
      break;
    }
  }

  execInsertButtonAction(e, value, row, index) {
    const gameno = this.curGameNo;
    const playno = index;
    const playObj = this.globalKifuData[gameno].playObject[playno];
    const xgid = playObj.xgid;
    const turn = playObj.turn;
    const oppo = BgUtil.getBdOppo(turn);
    const dice = "00";
    const mode = "roll";
    const action = "????";
    const cube = playObj.cube;
    const xgaf = playObj.xgaf;
    const nextOne = this.makePlayObj(gameno, oppo, mode, dice, cube, action, xgid, xgaf);
    const nextTwo = this.makePlayObj(gameno, turn, mode, dice, cube, action, xgid, xgaf);

    this.globalKifuData[gameno].playObject.splice(playno + 1, 0, nextOne, nextTwo); //2つを下に差し込み
    this.makeTableData(); //テーブルデータを作り直してテーブル再表示
    this.scrollTo(playno + 1);
  }

  execDeleteButtonAction(e, value, row, index) {
    const gameno = this.curGameNo;
    const playno = index;
    this.globalKifuData[gameno].playObject.splice(playno, 2); //当該行から2行削除
    this.makeTableData(); //テーブルデータを作り直してテーブル再表示
    this.scrollTo(playno);
 }

  setGlobalKifuData(xgid, action, mode) {
    const gameno = this.curGameNo;
    const playno = this.curRollNo;
    const xgidstr = xgid.xgidstr;
    const turn = BgUtil.cvtTurnXg2Bd(xgid.turn);
    const dice = xgid.dice;
    const cube = xgid.cube;
    const xgaf = this.makeXgaf(xgid, action, mode);
    const newPlayObj = this.makePlayObj(gameno, turn, mode, dice, cube, action, xgidstr, xgaf);

    if (this.globalKifuData[gameno].playObject.length > playno) {
      this.globalKifuData[gameno].playObject[playno] = newPlayObj;
      this.updateKifuTable(newPlayObj);
    } else {
      this.globalKifuData[gameno].playObject.push(newPlayObj); //行が増えたときは
      this.makeTableData(); //テーブルデータを作り直してテーブル再表示
    }

    if (mode == "gameend") {
      this.recalcGameScore(xgid); //スコアに変化があった時用に以降のゲームスコアを再計算(変化なくても再計算)
    }

    if (mode != "gameend") {
      this.curRollNo += 1; //gameendのときは次行に行かない
    }
    const checkline = Math.min(this.curRollNo, this.globalKifuData[gameno].playObject.length -1);
    this.checkOnKifuRow(checkline); //次行を選択
  }

  makeXgaf(xgid, action, mode) {
    switch(mode) {
    case "roll":
      const moveary = BgMoveStrUtil.cleanupMoveStr(action, xgid.xgidstr);
      for (const move of moveary) {
        if (BgUtil.isContain(move, "/")) {
          xgid = xgid.moveChequer2(move);
        }
      }
      break;
    case "offer":
      xgid.dice = "00";
      xgid.dbloffer = false;
      break;
    default:
      break;
    }
    return xgid.xgidstr;
  }

  recalcGameScore(xgid) {
    //スコアの増分を確認
    let diffScr1 = [];
    let diffScr2 = [];
    for (const gameobj of this.globalKifuData) {
      const playlength = gameobj.playObject.length;
      const last1xg = gameobj.playObject[playlength -1].xgid; //増分は最後2つのXGIDから分かる
      const last2xg = gameobj.playObject[playlength -2].xgid;
      const last1xgid = new Xgid(last1xg);
      const last2xgid = new Xgid(last2xg);
      diffScr1.push(last1xgid.sc_me - last2xgid.sc_me);
      diffScr2.push(last1xgid.sc_yu - last2xgid.sc_yu);
    }

    let curScr1 = xgid.sc_me;
    let curScr2 = xgid.sc_yu;
    for (let gameno =  this.curGameNo +1; gameno < this.globalKifuData.length; gameno++) { //編集するのは以降のゲームだけ
      this.globalKifuData[gameno].score1 = curScr1;
      this.globalKifuData[gameno].score2 = curScr2;
      this.globalKifuData[gameno].crawford = this.checkCrawford(curScr1, curScr2, this.matchLength);
      curScr1 += diffScr1[gameno];
      curScr2 += diffScr2[gameno];

      //this.globalKifuDataに保持するxgidも編集する
      const playlength = this.globalKifuData[gameno].playObject.length;
      for (let playno = 0; playno < playlength -1; playno++) { //gameendまでのスコア登録
        const xg = this.globalKifuData[gameno].playObject[playno].xgid;
        const xgid = new Xgid(xg);
        xgid.sc_me = this.globalKifuData[gameno].score1;
        xgid.sc_yu = this.globalKifuData[gameno].score2;
        xgid.crawford = this.globalKifuData[gameno].crawford;
        this.globalKifuData[gameno].playObject[playno].xgid = xgid.xgidstr;
      }
      //gameendのときのスコア登録(次のゲームへの増分を登録)
      const xg = this.globalKifuData[gameno].playObject[playlength -1].xgid;
      const xgid = new Xgid(xg);
      xgid.sc_me = this.globalKifuData[gameno].score1 + diffScr1[gameno];
      xgid.sc_yu = this.globalKifuData[gameno].score2 + diffScr2[gameno];
      xgid.crawford = this.globalKifuData[gameno].crawford;
      this.globalKifuData[gameno].playObject[playlength -1].xgid = xgid.xgidstr;
    }
  }

  checkCrawford(scr1, scr2, matchlength) {
    const lastonepoint = matchlength == Math.max(scr1, scr2) + 1;
    const crawford = (scr1 != scr2) && lastonepoint;
    return crawford;
  }

  updateKifuTable(playobj) {
    const dispdice = (playobj.dice == "00" || playobj.dice == "D") ? "" : playobj.dice;
    const dispplayer = (playobj.turn == 1) ? "BLUE" : "WHITE";
    const player     = { index: this.curRollNo, field: "player",     value: dispplayer, };
    const dice       = { index: this.curRollNo, field: "dice",       value: dispdice, };
    const action     = { index: this.curRollNo, field: "action",     value: playobj.action, };
    const illegal    = { index: this.curRollNo, field: "illegal",    value: !!playobj.illegal };
    const unreliable = { index: this.curRollNo, field: "unreliable", value: !!playobj.unreliable };
    this.kifuTableOp.updateCell(player);
    this.kifuTableOp.updateCell(dice);
    this.kifuTableOp.updateCell(action);
    this.kifuTableOp.updateCell(illegal); //編集で作り直した手はイリーガル表示を解除
    this.kifuTableOp.updateCell(unreliable);
  }

  checkOnKifuRow(checkline) {
    const check = { index: checkline, field: "check", value: true, };
    this.kifuTableOp.uncheckAll();
    this.kifuTableOp.updateCell(check);
  }

  scrollTo(checkline) {
    this.kifuTableOp.scrollTo(checkline); //チェック行が(stickyヘッダーに隠れず)可視領域に入るようスクロール
  }

  makeTableData() {
    const kfobject = this.parseGameKifu(); //棋譜表示テーブルに差し込むデータを作る
    this.kifuTableOp.load(kfobject); //テーブルに差し込む
    this.kifuTableOp.scrollTo(0);
  }

  calcDispNo(no, frp, poturn, action) {
    const playerColor = [null, "b", "w"];
    const actionoffset = action.includes("wins") ? 1 : 0; //勝ち名乗り行は行を下げて記述
    const offset = frp == 1 ? 2 : 1;
    const turnno = Math.trunc((no + offset + actionoffset) / 2);
    const dispno = turnno + playerColor[poturn];
    return dispno;
  }

  parseGameKifu() {
    let kifutableobject = [];
    const playerColor = [null, "BLUE", "WHITE"];
    for (const go of this.globalKifuData) {
      let no = 1; //Noは1始まり
      for (const po of go.playObject) {
        const firstrollplayer = go.playObject[0].turn;
        const kto = {
          no:     no,
          dispno: this.calcDispNo(no, firstrollplayer, po.turn, po.action),
          player: playerColor[po.turn],
          dice:   (po.dice == "00" || po.dice == "D") ? "" : po.dice,
          action: po.action,
          //xgid: po.xgid,
          mode:   po.mode,
          gameno: go.game,
          illegal: !!po.illegal, //イリーガルムーブ(棋譜テーブルで強調表示)
          unreliable: !!po.unreliable, //イリーガルムーブより後の手(局面が信頼できない)
        };
        kifutableobject.push(kto);
        no += 1;
      }
    }
    return kifutableobject;
  }

  setEventHandlerForKifuViewer() {
    this.gameGoBtn.addEventListener("click", () => {
      this.curGameNo = Number(this.gameSelect.value);
      this.initGame(this.curGameNo);
    });
    this.nextPlayBtn.addEventListener("click", () => {
      const playbefore = this.curRollNo;
      this.curRollNo = this.calcCurrentRoll(+1);
      this.setIntoViewerMode();
      this.scrollTo(this.curRollNo);
      this.playMove2(playbefore); //ここではawaitできないのでラップする
    });
    this.prevPlayBtn.addEventListener("click", () => {
      this.curRollNo = this.calcCurrentRoll(-1);
      this.setIntoViewerMode(); //テーブル再描画(チェック移動)を先に行い、その後でスクロールする
      this.scrollTo(this.curRollNo);
    });
    this.autoPlayBtn.addEventListener("click", () => {
      this.toggleAutoplay();
    });
    this.inputKifuFile.addEventListener("change", (e) => {
      this.loadLocalKifu(e);
      this.inputKifuFile.value = ""; //同じファイルを選択できるように
    });
    this.DnDArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      this.DnDArea.classList.add("DnDAreaDragOver");
    });
    this.DnDArea.addEventListener("dragleave", (e) => {
      this.DnDArea.classList.remove("DnDAreaDragOver");
    });
    this.DnDArea.addEventListener("drop", (e) => {
      e.preventDefault();
      this.DnDArea.classList.remove("DnDAreaDragOver");
      const files = e.dataTransfer.files; //ネイティブイベントなのでoriginalEvent経由の取り出しは不要
      if (files.length > 0) {
        this.inputKifuFile.files = files;
        this.inputKifuFile.dispatchEvent(new Event("change", {bubbles: true})); //ドロップしたらinputタグのchangeイベントを発火
      }
    });
    this.showinsert.addEventListener("change", (e) => {
      const checkflag = e.target.checked;
      const showhide = checkflag ? "showColumn" : "hideColumn";
      this.kifuTableOp[showhide]("insert"); //Insert列の表示/非表示を切り替える
    });

    this.analyseBtn.addEventListener("click", () => {
      if (this.isGithub()) {
        alert('Sorry, this feature is inactive.'); //githubで稼働しているときはgnubgの解析機能は営業停止
        return;
      }
      if (this.globalKifuData.length == 0) { return; } //棋譜データがないときは押せない
      const xgid = this.globalKifuData[this.curGameNo].playObject[this.curRollNo].xgid;
      this.analyseWindow.show();
      this.analyseByGnubg(xgid);
    });
  }

  calcCurrentRoll(delta) {
    let curroll = this.curRollNo + delta;
    curroll = Math.max(curroll, 0);
    curroll = Math.min(curroll, this.globalKifuData[this.curGameNo].playObject.length -1);
    return curroll;
  }

  setIntoViewerMode() {
    this.switchViewerEditorMode(true);
    this.checkOnKifuRow(this.curRollNo);
    this.showBoard(this.curGameNo, this.curRollNo);
  }

  switchViewerEditorMode(viewermodeflag = true) {
    //ビューアモードとエディタモードの切り替え(mode==true -> to viewer)
    this.stopAutoplay();
    this.panelInfoWindow.min();
    if (viewermodeflag) {
      this.unsetEventHandlerForEditor(); //エディタ用イベントを停止
      this.panelActionWindow.hide(); //ViewerModeではパネルを非表示に
    } else {
      this.unsetEventHandlerForEditor(); //エディタモードに入るときは一旦停止
      this.setEventHandlerForEditor();
      this.panelActionWindow.show();
    }
  }

  showBoard(gameno, rollno) {
    const xgid = this.globalKifuData[gameno].playObject[rollno].xgid;
    this.xgid = new Xgid(xgid);
    this.showPipInfo(this.xgid);
    this.showScoreInfo2(this.xgid);
    this.board.showBoard2(this.xgid);
  }

  downloadKifuAction() {
    this.kifuobj.clearKifuXgid();
    for (const game of this.globalKifuData) {
      for (const po of game.playObject) {
        this.kifuobj.pushKifuXgid(po.xgid);
        if (po.mode == "gameend") { break; } //gameend以降のplayObjectは無視する
      }
      this.kifuobj.pushKifuXgid(""); //ゲーム境界には空を挟む
    }

    const downloadfilename = this.makeDownloadFilename(this.kifuFileName);
    this.kifuobj.downloadKifuAction(downloadfilename);
  }

  makeDownloadFilename(origfilename) {
    const [fname, ext] = origfilename.split(".");
    const newfilename = fname + "_edited." + ext;
    return newfilename;
  }

  loadLocalKifu(evt) {
    const file = evt.target.files[0];
    if (!file) { return; }
    this.kifuFileName = file.name;
    this.readKifuFile(file);
    this.dispFileName(this.kifuFileName);
//    this.panelInfoWindow.min();
  }

  dispFileName(filename_enc) {
    const filename = decodeURI(filename_enc);
    const dispfile = (filename.length < 35) ? filename : BgUtil.insertStr(filename, 30, "<br>"); //長すぎるときは改行を入れる
    this.fileName.innerHTML = dispfile;
  }

  readKifuFile(file) {
    const reader = new FileReader();
    reader.readAsText(file); //テキスト形式で読み込む

    //読込終了後の処理
    reader.onload = () => { //アロー関数で記述すれば、thisがそのまま使える
      const kifudata = reader.result;
      this.parseKifuData(kifudata);
    }
  }

  parseKifuData(kifudata) {
console.log("parseKifuData kifudata", kifudata);
    //棋譜データを解析し、ビューア画面に表示する
    const globalKifuDataAll = new BgKifuParser(kifudata); //棋譜ファイルを読んで棋譜データオブジェクト作成
    this.globalKifuData = globalKifuDataAll.globalKifuData; //棋譜データオブジェクトを展開
    this.playername = globalKifuDataAll.playerName;
    this.matchLength = globalKifuDataAll.matchLength;
    const gameCount = globalKifuDataAll.gameCount;
    this.setGameSelection(gameCount); //selectタグデータ作成
    this.applyToInfoPanel();
    this.makeTableData(); //棋譜テーブル作成
    this.curGameNo = 0;
    this.initGame(this.curGameNo); //Game 1を表示
    this.notifyIllegalMoves(globalKifuDataAll.illegalMoves, globalKifuDataAll.globalKifuData);
  }

  notifyIllegalMoves(illegalMoves, globalKifuData) {
    //イリーガルムーブがあったことを1回だけ通知する。ゲームごとに最初のイリーガルムーブだけを列挙し、それ以降の手は件数で示す
    if (!illegalMoves || illegalMoves.length == 0) { return; }
    const playerName = [null, this.playername[1], this.playername[2]];
    const firstByGame = new Map();
    for (const im of illegalMoves) {
      if (!firstByGame.has(im.game)) { firstByGame.set(im.game, { first: im, count: 0 }); }
      firstByGame.get(im.game).count += 1;
    }
    let msg = "Illegal move(s) found in the kifu.\nIllegal moves are shown in red in the kifu table,\nand the following moves (whose board may be wrong) in yellow.\n\n";
    for (const [game, g] of firstByGame) {
      const im = g.first;
      msg += `Game ${game}, No.${im.no}: ${im.dice}: ${im.action}  (${im.reason})`;
      const unreliable = globalKifuData[game - 1].playObject.filter(po => po.unreliable).length;
      const following = (g.count - 1) + unreliable; //同じゲームでこれ以降の、赤または黄色の手の数
      msg += (following > 0) ? `  [+${following} following move(s) unreliable]\n` : "\n";
    }
    alert(msg);
  }

  setGameSelection(gameCount) {
    this.gameSelect.innerHTML = "";
    for (let g = 0; g < gameCount; g++) { //機械用は0始まり
      const dispg = g + 1; //人間用は１始まりのリスト
      const option = document.createElement("option");
      option.value = g;
      option.textContent = "Game " + dispg;
      this.gameSelect.appendChild(option);
    }
  }

  initGame(gamenum) {
    this.curRollNo = 0;
    this.kifuTableOp.filterBy({gameno: [gamenum]}); //棋譜テーブルで見せるデータを入替え
    //this.score = [null, this.globalKifuData[gamenum].score1, this.globalKifuData[gamenum].score2];
    this.setIntoViewerMode(); //ここでthis.xgidの設定とボード表示もやる
    this.dispGameInfo(); //ゲーム情報はthis.xgidの設定の後
  }

  dispGameInfo() {
    this.player1.textContent = this.playername[1];
    this.player2.textContent = this.playername[2];
    this.matchlen1.textContent = this.matchLength;
    this.matchlen2.textContent = this.matchLength;
    this.showScoreInfo();
  }

  makePlayObj(gameno, turn, mode, dice, cube, action, xgid, xgaf) {
    const playobj = {
      "gameno": gameno,
      "turn": turn,
      "mode": mode,
      "dice": dice,
      "cube": cube,
      "action": action,
      "xgid": xgid,
      "xgaf": xgaf,
    };
    return playobj;
  }


//★★ここからアニメーションボードのコード

  toggleAutoplay() {
    if (this.autoplay) {
      this.stopAutoplay();
    } else {
      this.startAutoplay();
    }
  }

  startAutoplay() {
    this.autoplay = true;
    this.autoPlayBtn.innerHTML = "<i class='fas fa-pause-circle fa-2x'></i>";
    this.loopAutoplay();
  }

  stopAutoplay() {
    this.autoplay = false;
    this.autoPlayBtn.innerHTML = "<i class='fas fa-play-circle fa-2x'></i>";
  }

  async loopAutoplay() {
    while (this.autoplay) {
      await this.nextPlay();
      await BgUtil.sleep(this.animDelay * 1.5); //ゆっくり待つ
    }
  }

  async nextPlay() {
    const playbefore = this.curRollNo;
    this.checkOnKifuRow(this.curRollNo); //先に棋譜テーブルの行選択
    this.scrollTo(this.curRollNo);
    this.curRollNo = this.calcCurrentRoll(+1);
    if (playbefore == this.curRollNo) {
      await this.nextGame(); //次のゲーム
    } else {
      await this.playMove(playbefore); //次のムーブ
    }
  }

  async nextGame() {
    if (this.curGameNo == this.globalKifuData.length - 1) {
      this.stopAutoplay(); //最後のゲームならアニメーションを止める
    } else {
      await BgUtil.sleep(this.animDelay * 4); //ゆっくり待つ
      this.curGameNo += 1;
      this.curRollNo = 0;
      this.gameSelect.value = this.curGameNo; //現在ゲームを選択状態に
      this.kifuTableOp.filterBy({gameno: [this.curGameNo]}); //棋譜テーブルで見せるデータを入替え
      this.showBoard(this.curGameNo, this.curRollNo); //this.xgidをセット
      this.showScoreInfo();
    }
  }

  async playMove2(playnum) {
    const mode = this.globalKifuData[this.curGameNo].playObject[playnum].mode;
    if (mode == "roll") {
      await this.playMove(playnum); //進むボタンでのアニメーションはロールのときだけ
      this.showBoard(this.curGameNo, this.curRollNo); //次ロール状態のボードを表示
    }
  }

  async playMove(playnum) {
    const playo = this.globalKifuData[this.curGameNo].playObject[playnum];
    const xgbf = new Xgid(playo.xgid);
    const xgaf = new Xgid(playo.xgaf);
    const mode = playo.mode;
    const action = playo.action;

    this.board.showBoard2(xgbf); //アニメーションする前のボードを表示

    if (mode == "roll") {
      await this.board.animateDice(this.animDelay); //ダイスを揺らし、揺れ終わるのを待つ
    }

    if (mode == "roll" && BgUtil.isContain(action, "/")) {
      const moveary = BgMoveStrUtil.cleanupMoveStr(action, xgbf.xgidstr);
      for (const move of moveary) {
        await this.board.animateChequer(xgbf, move, this.animDelay2); //move actionを分解し、ひとつずつ動かす
      }
    } else {
      await BgUtil.sleep(this.animDelay);
    }
    if (mode == "offer") {
      await this.board.animateCube(this.animDelay); //キューブを揺らす
    }

    this.board.showBoard2(xgaf); //動かし終わった後のボードとピップを表示
    this.showPipInfo(xgaf);
  }

//★★ここからBgKifuViewer-faからポーティングしたコード

  async loadKifuDataFromQuery() {
    // ページがロードされたときに、query情報があればFetchAPIで棋譜ファイルを取得する
    const query = location.search;
    if (query.startsWith('?s=')) {
      const filename = query.substr("?s=".length);
      const getfileurl = "./scripts/" + filename;
      const kifudata = await this.fetchApiTextCommon(getfileurl);
      this.dispFileName(filename);
      this.kifuFileName = decodeURI(filename);
      this.parseKifuData(kifudata);
    }
  }

  async getGnuAnalysisFetch(xgid) {
    //fetchAPI通信により、gnubgによる解析結果を取得する
    const hosturl = ""; //'http://local.example.com/';
    const depth = 2;
    const num = 5;
    const gnubgurl = hosturl + '/php/gnubg_ajax.php?g=' + xgid + '&d=' + depth + '&n=' + num;
    const result = await this.fetchApiTextCommon(gnubgurl);
    return result;
  }

  async analyseByGnubg(xgid) {
    this.analysisDisp.innerHTML = '<i class="fas fa-spinner fa-pulse fa-3x" style="color:purple"></i>';

    const xg = new Xgid(xgid);
    const moveaction = (xg.dice != "00");
    const dice = xg.dice;
    if (xg.cube == 0) {
      xg.cubepos = 0;
    } else if (!moveaction) {
      xg.cubepos = xg.turn;
    }
    xg.dice = "00";
    const xgidcube = xg.xgidstr;
    const analychequer = await this.getGnuAnalysisFetch(xgid);
    const analycube = await this.getGnuAnalysisFetch(xgidcube);
    const separator = "----------------------------------------------------------------------------------\n";

    let pre = xgid + "\n\n";
    pre += moveaction ? "Rolled " + dice + "\n" : "";
    pre += moveaction ? separator : "";
    pre += moveaction ? analychequer : "Cube Action\n";
    pre += separator;
    pre += analycube;

    this.analysisDisp.textContent = pre;
  }

  async fetchApiTextCommon(url) {
    //テキストデータをレスポンスする共通FetchAPI
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(url + `\n\n response status: ${response.status}`);
      }
      const result = await response.text();
      return result;
    } catch (error) {
      alert(error.message);
      console.error(error.message);
    }
  }

  isGithub() {
    const hostname = location.host;
    return BgUtil.isContain(hostname, "hinacoppy.github.io");
  }

  isHomePC() {
    const hostname = location.host;
    return BgUtil.isContain(hostname, "localhost");
  }

  checkGithub() {
    //GitHubで使わない機能は非表示
    if (this.isGithub()) {
      document.querySelectorAll('.hidewhengithub').forEach((el) => BgDomUtil.hide(el));
    }
  }


  beginNewGameEditor(newmatchflag = true) {
    //新規入力モードでエディタを開く
    this.switchViewerEditorMode(false);
    this.curGameNo = newmatchflag ? 0 : this.curGameNo + 1;
    this.curRollNo = 0;
    if (newmatchflag) {
      this.globalKifuData = [];
      this.inputKifuFile.value = ""; //ファイル選択されていない状態にする
      this.fileName.textContent = "Select File";
      this.onchangeInfoAction();
    }

    const xgid = "XGID=-b----E-C---eE---c-e----B-:0:0:0:00:0:0:0:0:10";
    const playObject = this.makePlayObj(this.curGameNo, 0, "roll", "00", 0, "opening roll", xgid, xgid);
    const gameObject = {
      game: this.curGameNo,
      score1: this.score[1],
      score2: this.score[2],
      crawford: this.checkCrawford(this.score[1], this.score[2], this.matchLength),
      playObject: [playObject],
    };
    this.globalKifuData.push(gameObject);

    this.setGameSelection(this.curGameNo + 1); //selectタグデータ作成
    this.gameSelect.value = this.curGameNo; //現在ゲームを選択状態に

    this.makeTableData(); //棋譜テーブル作成
    this.kifuTableOp.filterBy({gameno: [this.curGameNo]}); //棋譜テーブルで見せるデータを入替え
  }

  onchangeInfoAction() {
    this.playername = [null, this.player1inp.value, this.player2inp.value];
    this.matchLength = Number(this.matchlen.value);
    const date = this.date.value;
    const datetrim = date.split("-").join(""); //年月日のセパレータを取り除く
    this.kifuFileName = this.playername[1] + "-" + this.playername[2] + "-" + this.matchLength + "pt-" + datetrim + ".txt";
    this.dispGameInfo();
  }

  applyToInfoPanel() {
    this.player1inp.value = this.playername[1];
    this.player2inp.value = this.playername[2];
    this.matchlen.value = this.matchLength;
  }

}
