// BgKifuParser_class.js
"use strict";

class BgKifuParser {
  constructor(gamesource) {
    //Class Variables
    this.matchLength = 0;
    this.separateColumn = 40;
    this.crawford = false;
    this.cubeBefore = 1; // =2^0
    this.gameLines = [];
    return this.parseKifuDataAll(gamesource); //棋譜データの解析結果オブジェクトを返す
  }

  parseKifuDataAll(gamesource) {
    let globalKifuDataAll = {
      matchLength: 0,
      gameCount: 0,
      playerName: [null, "bottom", "top"],
      globalKifuData: [],
    };

    let gamelineflag = false;
    let getplayerflag = false;
    let gameCount = 0;
    let lineno = 0;
    const gamesourceArray = gamesource.split("\n");
    for (const line of gamesourceArray) {
      lineno += 1;
      const linetrim = line.trim();
      if (linetrim.match(/point match/)) {
        this.matchLength = Number(linetrim.substring(0, linetrim.indexOf(" ")));
        globalKifuDataAll.matchLength = this.matchLength;
      }
      if (line.substring(0, 6) == " Game ") {
        gameCount += 1;
console.log("Game ", line, lineno);
        this.gameLines.push(lineno);
        gamelineflag = true;
        continue;
      }
      if (gamelineflag && !getplayerflag) {
        this.separateColumn = this.getSeparateColumn(line);
        const [player1, scr1, player2, scr2] = this.getPlayerAndScore(line, this.separateColumn);
        globalKifuDataAll.playerName = [null, player1, player2];
        gamelineflag = false;
        getplayerflag = true;
      }
    }

    if (gameCount === 0) {
      alert("Error in parseMatchData - no 'Game' lines in file")
      return false;
    }

    globalKifuDataAll.gameCount = gameCount;
console.log("gameCount", gameCount);
    for (let game = 0; game < gameCount; game++) {
      const gameObj = gamesourceArray.slice(this.gameLines[game], this.gameLines[game +1]); //1ゲーム分の棋譜データ
      const kifudataobj = this.parseGameData(gameObj, game);
      if (kifudataobj === false) {
        alert("Error in parseGameData - no gameplay lines");
        return false;
      }
      globalKifuDataAll.globalKifuData.push(kifudataobj);
    }

console.log("globalKifuDataAll", JSON.stringify(globalKifuDataAll));
    return globalKifuDataAll;
  }

  getSeparateColumn(line) {
    const sep1 = line.indexOf("    ") + 1;
    const ary = BgUtil.insertStr(line, sep1, ":").split(":");
    const player1 = ary[2].trim();
    const sep3 = line.indexOf(player1);
    const gap = (sep3 > 38) ? 1 : 0;　//player1の名前が38カラムより後ろなら、2文字前(tsuneさんの棋譜エディタの出力に対応)
                                      //普通は1文字前(002-gnubg-BGBlitz-1.txtの40行目の問題に対応)
    const sep2 = sep3 - gap;
console.log("getSeparateColumn '"+ line + "'", sep1, player1, sep2);
    return sep2;
  }

  getPlayerAndScore(playerscoreline, separateColumn) {
console.log("playerscoreline ", playerscoreline, separateColumn);
    const ary = BgUtil.insertStr(playerscoreline, separateColumn, ":").split(":");
console.log("playerscoreline ", BgUtil.insertStr(playerscoreline, separateColumn, ":"));
    const player1 = ary[2].trim();
    const player2 = ary[0].trim();
    const score1 = Number(ary[3].trim());
    const score2 = Number(ary[1].trim());
    return [player1, score1, player2, score2];
  }

  parseGameData(gameObj, gameNo) {
console.log("gameObj.length ", gameNo, gameObj.length);
    let gameObject = {
      game: gameNo,
      score1: 0,
      score2: 0,
      crawford: false,
      playObject: [],
    };

    const [player1, scr1, player2, scr2] = this.getPlayerAndScore(gameObj[0], this.separateColumn);
    this.score = [null, scr1, scr2];
    gameObject.score1 = scr1;
    gameObject.score2 = scr2;
    gameObject.crawford = this.checkCrawford(scr1, scr2, this.matchLength);

    const blockStart = BgUtil.findLine(gameObj, "1)");
    if (blockStart < 0) {
      return false;
    }

    // Now create serialised plays array
    const gameBlock = gameObj.slice(blockStart, gameObj.length - 1);
    let plays = [];
    for (const line of gameBlock) {
      const indexof = line.indexOf(";");
      const pl = indexof >= 0 ? line.substring(0, indexof) : line;
      const st = line.indexOf(")") + 1;
      plays.push(pl.substring(st, this.separateColumn).trim()); //)の次から
      plays.push(pl.substring(this.separateColumn).trim()); //player1の名前から--end
    }
    gameObject.playObject = this.parsePlay(plays, gameNo);

    return gameObject;
  }

  parsePlay(plays, gameno) {
    // Now generate the script from the plays[] elements
    let e, s1, s2, dc, af, xg, po, ac, mode;

    let bf = this.firstXgid();
    let playObject = []; //init _playObject

    let i = 0;
    for (const k of plays) {
      const tn = (i % 2 == 0) ? 2 : 1; //bottom side(left) = 1, top side(right) = 2

      switch( this.chkAction(k) ) {
      case "ROLL":
        mode = "roll";
        e = k.indexOf(":");
        dc = k.substr(e-2,2);
        ac = k.substr(e+1).trim();
        if (ac == "") { ac = "Cannot Move"; }
        xg = this.nextXgid(bf, tn, mode, dc, "", 0); // ロール後(ムーブ前)のXGIDを計算する(解析(move action)に渡す用)
        af = this.nextXgid(bf, tn, "move", dc, ac, 0); // ムーブ後のXGIDを計算する(画面表示用)
        po = this.makePlayObj(gameno, tn, mode, dc, 0, ac, xg, af);
        break;
      case "DOUBLE":
        mode = "offer";
        s1 = k.trim();
        s2 = parseInt(s1.substr(s1.lastIndexOf(" ")));
        xg = this.nextXgid(bf, tn, mode, "D", "", this.cubeBefore); //解析(cube action)に渡す用
        af = this.nextXgid(bf, tn, mode, "00", "", s2); //画面表示用
        //afの作り方がKifuEditorとKifuViewerで異なる（ToDo：合わせたい）
        ac = " Doubles => " + s2;
        po = this.makePlayObj(gameno, tn, mode, "D", s2, ac, xg, af);
        break;
      case "TAKE":
        mode = "take";
        af = xg = this.nextXgid(bf, tn, mode, "00", "", s2);
        ac = " Takes";
        po = this.makePlayObj(gameno, tn, mode, "00", s2, ac, xg, af);
        this.cubeBefore = s2;
        break;
      case "DROP":
        mode = "drop";
        af = xg = this.nextXgid(bf, tn, mode, "00", "", this.cubeBefore, true);
        ac = " Drops";
        po = this.makePlayObj(gameno, tn, mode, "00", 0, ac, xg, af);
        break;
      case "OTHER":
        const dropflag = (mode == "drop"); //ここに来る直前のmodeを確認
        mode = "gameend";
        this.cubeBefore = 1; // =2^0
        af = xg = this.nextXgid(bf, tn, mode, "00", "", 0, dropflag);
        const xgtmp = new Xgid(xg);
        //const sc = BgUtil.calcCubeVal(xgtmp.cube); // 3 => 8
        const sc = this.calcGamesetScore(dropflag, xgtmp);
        ac = "wins " + sc + " point";
        po = this.makePlayObj(gameno, tn, mode, "00", 0, ac, xg, af);
        break;
      default: // "NULL"
        ac = "";
        break;
      }
      if (ac != "") {
         bf = af; //change XGID for next turn
         playObject.push(po);
      }
      i++;
    }
    return playObject;
  }

  makePlayObj(gameno, turn, mode, dice, cube, action, xgid, xgaf) {
    const playobj = {
      gameno: gameno,
      turn: turn,
      mode: mode,
      dice: dice,
      cube: cube,
      action: action,
      xgid: xgid,
      xgaf: xgaf,
    };
    return playobj;
  }

  chkAction(play) {
    const p = play.toLowerCase()
    if (BgUtil.isContain(p,""))       { return "NULL"; }
    if (BgUtil.isContain(p,":"))      { return "ROLL"; }
    if (BgUtil.isContain(p,"double")) { return "DOUBLE"; }
    if (BgUtil.isContain(p,"take"))   { return "TAKE"; }
    if (BgUtil.isContain(p,"drop"))   { return "DROP"; }
    return "OTHER";
  }

  firstXgid() {
    const xgid = new Xgid();
    xgid.position = "-b----E-C---eE---c-e----B-";
    xgid.dice = "00";
    xgid.cube = xgid.cubepos = xgid.turn = 0;
    xgid.crawford = this.crawford;
    xgid.sc_me = this.score[1];
    xgid.sc_yu = this.score[2];
    xgid.matchsc = this.matchLength;
    return xgid.xgidstr;
  }

  nextXgid(bf, tn, mode, dc, mv, cb, dropflag = false) {
    const xgid = new Xgid(bf);
    xgid.turn = BgUtil.cvtTurnBd2Xg(tn); //tn==1 -> xgid.turn = 1, tn==2 -> xgid.turn = -1
    switch (mode) {
    case "roll":
      xgid.dice = dc;
      break;
    case "move":
      xgid.dice = dc;
      xgid.position = xgid.getMovedPosition(xgid.position, mv, xgid.turn);
      break;
    case "offer":
      xgid.dice = dc;
      xgid.cube = BgUtil.calcCubeValRev(cb); // 8 => 3
      xgid.cubepos = BgUtil.cvtTurnBd2Xg(BgUtil.getBdOppo(tn));
      xgid.dbloffer = (dc == "D");
      break;
    case "take":
      xgid.dbloffer = false;
      break;
    case "drop":
      xgid.cube = BgUtil.calcCubeValRev(cb); // 8 => 3
      xgid.dbloffer = false;
      break;
    case "gameend":
      const mode = "gameend";
      const sc = this.calcGamesetScore(dropflag, xgid)
      const winnerscr = (tn == 1) ? xgid.sc_me : xgid.sc_yu;
      const loserscr  = (tn == 1) ? xgid.sc_yu : xgid.sc_me;
      this.crawford = xgid.checkCrawford(winnerscr, sc, loserscr);
      xgid.dice = "00";
      if (tn == 1) { xgid.sc_me += sc; }
      else         { xgid.sc_yu += sc; }
      break;
    default:
      break;
    }
    return xgid.xgidstr;
  }

  calcGamesetScore(dropflag, xgid) {
    const cubevalue = BgUtil.calcCubeVal(xgid.cube); // 3 => 8
    const xgscr1 = xgid.get_gamesc(1); //me
    const xgscr2 = xgid.get_gamesc(-1); //yu
    const xgscoreme = xgscr1[0] * xgscr1[1];
    const xgscoreyu = xgscr2[0] * xgscr2[1];
    const score = dropflag ? cubevalue : Math.max(xgscoreme, xgscoreyu);
    return score
  }

  checkCrawford(scr1, scr2, matchlength) {
    const lastonepoint = matchlength == Math.max(scr1, scr2) + 1;
    const crawford = (scr1 != scr2) && lastonepoint;
    return crawford;
  }

}
